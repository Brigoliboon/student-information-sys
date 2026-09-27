import { createClient as create_supabase_client } from "@supabase/supabase-js";

// Server-only service_role client. Bypasses RLS; RBAC is enforced in services/.
// NEVER import this from client components. Key lives in env, never committed.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const create_admin_client = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return create_supabase_client(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
