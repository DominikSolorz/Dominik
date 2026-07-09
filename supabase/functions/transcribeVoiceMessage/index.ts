import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function env(name: string) {
  return Deno.env.get(name) || "";
}

function firstJsonSecret(name: string) {
  const raw = Deno.env.get(name);
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed[0] || "";
    if (typeof parsed === "object" && parsed !== null) return Object.values(parsed)[0] as string || "";
  } catch {
    return raw;
  }
  return "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY") || firstJsonSecret("SUPABASE_PUBLISHABLE_KEYS");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") || firstJsonSecret("SUPABASE_SECRET_KEYS");
  const openaiKey = env("OPENAI_API_KEY");
  const model = env("OPENAI_TRANSCRIBE_MODEL") || "gpt-4o-mini-transcribe";

  if (!supabaseUrl || !anonKey || !serviceKey || !openaiKey) {
    return json({ error: "Missing server configuration" }, 500);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } }
  });
  const serviceClient = createClient(supabaseUrl, serviceKey);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

  const { messageId, language } = await request.json().catch(() => ({}));
  if (!messageId || typeof messageId !== "string") return json({ error: "messageId is required" }, 400);

  const { data: message, error: messageError } = await serviceClient
    .from("messages")
    .select("id, conversation_id, sender_id, type, attachment_path, attachment_name, attachment_size")
    .eq("id", messageId)
    .maybeSingle();
  if (messageError) return json({ error: messageError.message }, 500);
  if (!message || message.type !== "voice" || !message.attachment_path) {
    return json({ error: "Voice message not found" }, 404);
  }
  if (message.attachment_size && message.attachment_size > 25 * 1024 * 1024) {
    await serviceClient.from("messages").update({ transcript_status: "failed" }).eq("id", message.id);
    return json({ error: "Audio file is too large for transcription" }, 413);
  }

  const { data: member, error: memberError } = await serviceClient
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", message.conversation_id)
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (memberError) return json({ error: memberError.message }, 500);
  if (!member) return json({ error: "Forbidden" }, 403);

  await serviceClient.from("messages").update({ transcript_status: "processing" }).eq("id", message.id);

  const { data: audioBlob, error: downloadError } = await serviceClient
    .storage
    .from("chat-files")
    .download(message.attachment_path);
  if (downloadError || !audioBlob) {
    await serviceClient.from("messages").update({ transcript_status: "failed" }).eq("id", message.id);
    return json({ error: downloadError?.message || "Audio download failed" }, 500);
  }

  const form = new FormData();
  form.append("model", model);
  form.append("file", audioBlob, message.attachment_name || "voice.webm");
  form.append("response_format", "json");
  if (language && typeof language === "string") form.append("language", language);

  const openaiResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form
  });
  const result = await openaiResponse.json().catch(() => ({}));
  if (!openaiResponse.ok) {
    await serviceClient.from("messages").update({ transcript_status: "failed" }).eq("id", message.id);
    return json({ error: result.error?.message || "Transcription failed" }, openaiResponse.status);
  }

  const text = typeof result.text === "string" ? result.text : "";
  const { error: updateError } = await serviceClient
    .from("messages")
    .update({
      transcript_text: text,
      transcript_language: language || null,
      transcript_status: "ready"
    })
    .eq("id", message.id);
  if (updateError) return json({ error: updateError.message }, 500);

  return json({ text, messageId: message.id });
});
