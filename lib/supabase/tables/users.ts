import { create_admin_client } from "@/lib/supabase/admin";
import { parse_sort, paged_meta, type list_params } from "@/lib/supabase/tables/common";

export const sanitize_user = (row: Record<string, unknown>) => {
  const { ...safe } = row;
  return safe; // public.users holds no password hash; Supabase Auth owns credentials
};

export const get_user_by_id = async (id: string) => {
  const admin = create_admin_client();
  return admin.from("users").select("*").eq("id", id).maybeSingle();
};

export const list_users = async (p: list_params & { role?: string; status?: string }) => {
  const admin = create_admin_client();
  const page = p.page ?? 1;
  const per_page = Math.min(p.per_page ?? 15, 100);
  let q = admin.from("users").select("*", { count: "exact" });
  if (p.search) q = q.or(`email.ilike.%${p.search}%,display_name.ilike.%${p.search}%`);
  if (p.role) q = q.eq("role", p.role);
  if (p.status) q = q.eq("status", p.status);
  for (const s of parse_sort(p.sort)) q = q.order(s.col, { ascending: s.asc });
  q = q.range((page - 1) * per_page, page * per_page - 1);
  const { data, error, count } = await q;
  return { data, error, meta: paged_meta(page, per_page, count ?? 0) };
};

export const create_user_row = async (payload: Record<string, unknown>) => {
  const admin = create_admin_client();
  return admin.from("users").insert(payload).select("*").single();
};

export const update_user_row = async (id: string, payload: Record<string, unknown>) => {
  const admin = create_admin_client();
  return admin.from("users").update(payload).eq("id", id).select("*").single();
};

export const delete_user_row = async (id: string) => {
  const admin = create_admin_client();
  return admin.from("users").delete().eq("id", id);
};
