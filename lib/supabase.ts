import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/config";

const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_missing";

export const supabase = createClient(SUPABASE_URL, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
