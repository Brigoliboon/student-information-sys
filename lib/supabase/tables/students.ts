import { create_admin_client } from "@/lib/supabase/admin";
import { parse_sort, paged_meta, type list_params } from "@/lib/supabase/tables/common";

export const get_student_by_id = async (id: string) => {
  const admin = create_admin_client();
  return admin.from("students").select("*, programs(id, code, name)").eq("id", id).maybeSingle();
};

export const list_students = async (p: list_params) => {
  const admin = create_admin_client();
  const page = p.page ?? 1;
  const per_page = Math.min(p.per_page ?? 15, 100);
  let q = admin.from("students").select("*, programs(id, code, name)", { count: "exact" });
  if (p.search) {
    q = q.or(
      `student_number.ilike.%${p.search}%,first_name.ilike.%${p.search}%,last_name.ilike.%${p.search}%,email.ilike.%${p.search}%`
    );
  }
  for (const [k, v] of Object.entries(p.filters ?? {})) {
    if (["program_id", "year_level", "status"].includes(k)) q = q.eq(k, v);
  }
  for (const s of parse_sort(p.sort)) q = q.order(s.col, { ascending: s.asc });
  q = q.range((page - 1) * per_page, page * per_page - 1);
  const { data, error, count } = await q;
  return { data, error, meta: paged_meta(page, per_page, count ?? 0) };
};

export const create_student_row = async (payload: Record<string, unknown>) => {
  const admin = create_admin_client();
  return admin.from("students").insert(payload).select("*").single();
};

export const update_student_row = async (id: string, payload: Record<string, unknown>) => {
  const admin = create_admin_client();
  return admin.from("students").update(payload).eq("id", id).select("*").single();
};

export const delete_student_row = async (id: string) => {
  const admin = create_admin_client();
  return admin.from("students").delete().eq("id", id);
};
