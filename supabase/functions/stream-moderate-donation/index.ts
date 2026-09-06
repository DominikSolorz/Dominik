import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const donationId = String(body.donation_id || "");
  const action = String(body.action || "");
  const reason = String(body.reason || "").slice(0, 500);
  if (!donationId || !["approve", "reject"].includes(action)) return Response.json({ error: "Invalid request" }, { status: 400, headers: corsHeaders });

  const { data: donation } = await admin.from("stream_donations").select("id,creator_profile_id").eq("id", donationId).maybeSingle();
  if (!donation) return Response.json({ error: "Donation not found" }, { status: 404, headers: corsHeaders });

  const { data: profile } = await admin.from("stream_profiles").select("user_id").eq("id", donation.creator_profile_id).maybeSingle();
  const isOwner = profile?.user_id === userData.user.id;
  const { data: moderator } = await admin.from("stream_moderators").select("can_moderate_messages").eq("profile_id", donation.creator_profile_id).eq("moderator_user_id", userData.user.id).maybeSingle();
  const canModerate = isOwner || moderator?.can_moderate_messages === true;
  if (!canModerate) return Response.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });

  const moderation_status = action === "approve" ? "approved" : "rejected";
  const { error } = await admin.from("stream_donations").update({ moderation_status, moderation_reason: reason || (action === "reject" ? "manual_reject" : null) }).eq("id", donationId);
  if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  return Response.json({ ok: true, moderation_status }, { headers: corsHeaders });
});
