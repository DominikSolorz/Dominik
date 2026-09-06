import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function validStripeSignature(raw: string, header: string, secret: string) {
  const parts = header.split(",").map((x) => x.trim());
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const signatures = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!timestamp || !signatures.length) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${raw}`));
  const expected = hex(signature);
  return signatures.some((s) => safeEqual(s, expected));
}

function getCustomText(fields: unknown, key: string) {
  const field = Array.isArray(fields) ? fields.find((f: any) => f?.key === key) : null;
  return String(field?.text?.value || "").slice(0, 255);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const raw = await req.text();
  const signatureHeader = req.headers.get("stripe-signature") || "";
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const { data: secret, error: secretError } = await admin.rpc("stream_get_secret", { secret_name: "stripe_webhook_secret" });
  if (secretError || !secret) return new Response("Webhook secret unavailable", { status: 503 });
  if (!(await validStripeSignature(raw, signatureHeader, String(secret)))) return new Response("Invalid signature", { status: 401 });

  let event: any;
  try { event = JSON.parse(raw); } catch { return new Response("Invalid JSON", { status: 400 }); }
  const handled = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);
  if (!handled.has(event?.type)) return Response.json({ received: true, ignored: event?.type });

  const session = event?.data?.object || {};
  if (session.payment_status !== "paid") return Response.json({ received: true, pending: true });
  const creatorUsername = String(session?.metadata?.creator_username || "");
  if (!creatorUsername) return Response.json({ received: true, skipped: "missing_creator" });

  const { data: profile } = await admin.from("stream_profiles").select("id,min_amount_grosz").eq("username", creatorUsername).maybeSingle();
  if (!profile) return Response.json({ received: true, skipped: "creator_not_found" });

  const amountGrosz = Number(session.amount_total || 0);
  if (!Number.isFinite(amountGrosz) || amountGrosz < Number(profile.min_amount_grosz || 5000)) return Response.json({ received: true, skipped: "below_minimum" });

  const providerReference = String(session.id || "");
  const { data: existing } = await admin.from("stream_donations").select("id").eq("provider_reference", providerReference).maybeSingle();
  if (existing) return Response.json({ received: true, duplicate: true });

  const message = getCustomText(session.custom_fields, "message");
  const { data: blockedTerms } = await admin.from("stream_blocked_terms").select("term").eq("profile_id", profile.id);
  const lower = message.toLocaleLowerCase("pl-PL");
  const blocked = (blockedTerms || []).find((x: any) => x?.term && lower.includes(String(x.term).toLocaleLowerCase("pl-PL")));
  const moderationStatus = blocked ? "rejected" : "approved";

  const { error: insertError } = await admin.from("stream_donations").insert({
    creator_profile_id: profile.id,
    payer_name: String(session?.customer_details?.name || "Anonim").slice(0, 80),
    payer_email: session?.customer_details?.email ? String(session.customer_details.email).slice(0, 254) : null,
    amount_grosz: amountGrosz,
    currency: "PLN",
    message,
    payment_provider: "stripe",
    provider_reference: providerReference,
    status: "paid",
    moderation_status: moderationStatus,
    moderation_reason: blocked ? `blocked_term:${blocked.term}` : null,
    paid_at: new Date().toISOString(),
  });
  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });
  return Response.json({ received: true, stored: true, moderation_status: moderationStatus });
});
