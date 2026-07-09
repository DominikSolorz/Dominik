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

function stableVaultSecret() {
  return env("PRIVATE_PROFILE_VAULT_KEY")
    || firstJsonSecret("SUPABASE_SECRET_KEYS")
    || env("SUPABASE_SERVICE_ROLE_KEY");
}

function base64Encode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary);
}

function base64Decode(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function deriveVaultKey(secret: string) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("linktalk-private-profile-v1"),
      iterations: 120000,
      hash: "SHA-256"
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function normalizePrivateField(field: string, value: unknown) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  if (field === "pesel") {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length !== 11) throw new Error("PESEL musi miec 11 cyfr.");
    return digits;
  }
  if (field === "phone") {
    return trimmed.replace(/[^\d+()\s-]/g, "").slice(0, 40) || null;
  }
  return trimmed.slice(0, 240) || null;
}

function maskPesel(value: string | null) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `*******${digits.slice(-4)}`;
}

function normalizeProfileRecord(record: Record<string, unknown> = {}) {
  return {
    full_name: normalizePrivateField("full_name", record.full_name),
    phone: normalizePrivateField("phone", record.phone),
    home_address: normalizePrivateField("home_address", record.home_address),
    pesel: normalizePrivateField("pesel", record.pesel),
    data_consent_at: record.data_consent_at ? String(record.data_consent_at) : null
  };
}

async function encryptProfile(profile: Record<string, unknown>, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveVaultKey(secret);
  const payload = new TextEncoder().encode(JSON.stringify(profile));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);
  return `v1.${base64Encode(iv)}.${base64Encode(new Uint8Array(encrypted))}`;
}

async function decryptProfile(token: string, secret: string) {
  const [version, ivB64, payloadB64] = String(token || "").split(".");
  if (version !== "v1" || !ivB64 || !payloadB64) {
    throw new Error("Nieprawidlowy format szyfrowanego rekordu.");
  }
  const iv = base64Decode(ivB64);
  const payload = base64Decode(payloadB64);
  const key = await deriveVaultKey(secret);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, payload);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY") || firstJsonSecret("SUPABASE_PUBLISHABLE_KEYS");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") || firstJsonSecret("SUPABASE_SECRET_KEYS");
  const vaultSecret = stableVaultSecret();

  if (!supabaseUrl || !anonKey || !serviceKey || !vaultSecret) {
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

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  if (!["get", "save"].includes(action)) {
    return json({ error: "Unsupported action" }, 400);
  }

  const userId = userData.user.id;

  if (action === "get") {
    const { data: vaultRow, error: vaultError } = await serviceClient
      .from("profile_private_vault")
      .select("encrypted_payload, key_version, masked_pesel, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (vaultError) return json({ error: vaultError.message }, 500);

    if (vaultRow?.encrypted_payload) {
      try {
        const profile = await decryptProfile(vaultRow.encrypted_payload, vaultSecret);
        return json({
          storageMode: "encrypted-vault",
          profile: {
            ...normalizeProfileRecord(profile),
            updated_at: vaultRow.updated_at || vaultRow.created_at || null
          }
        });
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Vault decrypt failed" }, 500);
      }
    }

    const { data: legacyRow, error: legacyError } = await serviceClient
      .from("profile_private")
      .select("full_name, phone, home_address, pesel, data_consent_at, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (legacyError) return json({ error: legacyError.message }, 500);

    const legacyProfile = normalizeProfileRecord(legacyRow || {});
    if (legacyRow && Object.values(legacyProfile).some(Boolean)) {
      const encryptedPayload = await encryptProfile(legacyProfile, vaultSecret);
      const { error: migrateVaultError } = await serviceClient
        .from("profile_private_vault")
        .upsert({
          user_id: userId,
          encrypted_payload: encryptedPayload,
          key_version: "v1",
          masked_pesel: maskPesel(legacyProfile.pesel)
        }, { onConflict: "user_id" });
      if (migrateVaultError) return json({ error: migrateVaultError.message }, 500);

      const { error: scrubLegacyError } = await serviceClient
        .from("profile_private")
        .upsert({
          user_id: userId,
          full_name: null,
          phone: null,
          home_address: null,
          pesel: null,
          data_consent_at: legacyProfile.data_consent_at
        }, { onConflict: "user_id" });
      if (scrubLegacyError) return json({ error: scrubLegacyError.message }, 500);

      return json({
        storageMode: "encrypted-vault",
        profile: {
          ...legacyProfile,
          updated_at: legacyRow?.updated_at || legacyRow?.created_at || null
        }
      });
    }

    return json({
      storageMode: legacyRow ? "legacy-plaintext" : "encrypted-vault",
      profile: {
        ...legacyProfile,
        updated_at: legacyRow?.updated_at || legacyRow?.created_at || null
      }
    });
  }

  try {
    const incoming = normalizeProfileRecord(body.profile || {});
    const { data: currentMeta, error: metaError } = await serviceClient
      .from("profile_private")
      .select("data_consent_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (metaError) return json({ error: metaError.message }, 500);

    const dataConsentAt = incoming.data_consent_at
      || currentMeta?.data_consent_at
      || (Object.values(incoming).some(Boolean) ? new Date().toISOString() : null);

    const normalizedProfile = {
      ...incoming,
      data_consent_at: dataConsentAt
    };

    const encryptedPayload = await encryptProfile(normalizedProfile, vaultSecret);
    const { error: upsertVaultError } = await serviceClient
      .from("profile_private_vault")
      .upsert({
        user_id: userId,
        encrypted_payload: encryptedPayload,
        key_version: "v1",
        masked_pesel: maskPesel(normalizedProfile.pesel)
      }, { onConflict: "user_id" });
    if (upsertVaultError) return json({ error: upsertVaultError.message }, 500);

    const { error: updateLegacyError } = await serviceClient
      .from("profile_private")
      .upsert({
        user_id: userId,
        full_name: null,
        phone: null,
        home_address: null,
        pesel: null,
        data_consent_at: dataConsentAt
      }, { onConflict: "user_id" });
    if (updateLegacyError) return json({ error: updateLegacyError.message }, 500);

    const { data: savedVaultMeta, error: savedVaultError } = await serviceClient
      .from("profile_private_vault")
      .select("created_at, updated_at")
      .eq("user_id", userId)
      .single();
    if (savedVaultError) return json({ error: savedVaultError.message }, 500);

    return json({
      storageMode: "encrypted-vault",
      profile: {
        ...normalizedProfile,
        updated_at: savedVaultMeta.updated_at || savedVaultMeta.created_at || null
      }
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Private profile save failed" }, 400);
  }
});
