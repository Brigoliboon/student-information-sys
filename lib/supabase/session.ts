import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { create_admin_client } from "@/lib/supabase/admin";
import type { user_row } from "@/lib/supabase/models";

// Server-only: resolve the cookie session to the public.users profile.
// Returns null when unauthenticated, unknown, or inactive.
export const get_session_profile = async (): Promise<user_row | null> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub as string | undefined;
  if (error || !sub) return null;
  const admin = create_admin_client();
  const { data: profile } = await admin.from("users").select("*").eq("id", sub).maybeSingle();
  if (!profile || profile.status !== "active") return null;
  return profile as user_row;
};
