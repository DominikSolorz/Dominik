import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: profile } = await admin.from("stream_profiles").select("id").eq("user_id", userData.user.id).maybeSingle();
  if (!profile) return new Response(JSON.stringify({ error: "Creator profile not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const body = await req.json().catch(() => ({}));
  const amountGrosz = Math.max(5000, Math.min(Number(body.amount_grosz || 10000), 100000000));
  const message = String(body.message || "To jest test alertu DS Stream Support 💜").slice(0, 255);
  const name = String(body.name || "Testowy widz").slice(0, 50);
  const { error } = await admin.from("stream_events").insert({ creator_profile_id: profile.id, event_type: "system", payload: { name, amount_grosz: amountGrosz, currency: "PLN", message, test: true } });
  return new Response(JSON.stringify(error ? { error: error.message } : { ok: true }), { status: error ? 500 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
