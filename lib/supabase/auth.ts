import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { create_admin_client } from "@/lib/supabase/admin";
import type { request_user } from "@/lib/supabase/models";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const extract_bearer = (req: NextRequest): string | null => {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
};

// Resolve the caller: prefers Authorization: Bearer <access_token> (curl/Postman),
// falls back to the Supabase SSR cookie session (browser). Verifies the JWT via
// getUser (Bearer) or getClaims (cookies); never trusts raw session data.
export const get_request_user = async (req: NextRequest): Promise<request_user | null> => {
  const bearer = extract_bearer(req);

  if (bearer) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: { getAll: () => [], setAll: () => {} },
    });
    const { data, error } = await supabase.auth.getUser(bearer);
    if (error || !data.user?.id) return null;
    const profile = await load_profile(data.user.id);
    if (!profile) return null;
    return { auth_id: data.user.id, email: data.user.email ?? "", profile };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // ignore when called outside a Route Handler
        }
      },
    },
  });
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub as string | undefined;
  if (error || !sub) return null;
  const profile = await load_profile(sub);
  if (!profile) return null;
  return { auth_id: sub, email: (data?.claims?.email as string) ?? "", profile };
};

const load_profile = async (auth_id: string) => {
  const admin = create_admin_client();
  const { data, error } = await admin
    .from("users")
    .select("*")
    .eq("id", auth_id)
    .maybeSingle();
  if (error || !data) return null;
  if (data.status !== "active") return null;
  return data;
};
