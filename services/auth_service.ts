import { createServerClient } from "@supabase/ssr";
import { sanitize_user } from "@/lib/supabase/tables/users";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const anon = () =>
  createServerClient(url, key, { cookies: { getAll: () => [], setAll: () => {} } });

export const login_user = async (email: string, password: string) => {
  const { data, error } = await anon().auth.signInWithPassword({ email, password });
  if (error || !data.session) return { error: error?.message ?? "Invalid credentials" };
  return {
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
    },
    user: sanitize_user({
      id: data.user.id,
      email: data.user.email,
    }),
  };
};

export const logout_user = async (access_token: string) => {
  const client = createServerClient(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
    global: { headers: { Authorization: `Bearer ${access_token}` } },
  });
  await client.auth.signOut();
};
