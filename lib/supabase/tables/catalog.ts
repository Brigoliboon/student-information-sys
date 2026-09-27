import { create_admin_client } from "@/lib/supabase/admin";
import { parse_sort, paged_meta, type list_params } from "@/lib/supabase/tables/common";

const crud_for = (table: string, search_cols: string[], filter_cols: string[]) => ({
  get_by_id: async (id: string) => {
    const admin = create_admin_client();
    return admin.from(table).select("*").eq("id", id).maybeSingle();
  },
  list: async (p: list_params) => {
    const admin = create_admin_client();
    const page = p.page ?? 1;
    const per_page = Math.min(p.per_page ?? 15, 100);
    let q = admin.from(table).select("*", { count: "exact" });
    if (p.search && search_cols.length) {
      q = q.or(search_cols.map((c) => `${c}.ilike.%${p.search}%`).join(","));
    }
    for (const [k, v] of Object.entries(p.filters ?? {})) {
      if (filter_cols.includes(k)) q = q.eq(k, v);
    }
    for (const s of parse_sort(p.sort)) q = q.order(s.col, { ascending: s.asc });
    q = q.range((page - 1) * per_page, page * per_page - 1);
    const { data, error, count } = await q;
    return { data, error, meta: paged_meta(page, per_page, count ?? 0) };
  },
  create_row: async (payload: Record<string, unknown>) => {
    const admin = create_admin_client();
    return admin.from(table).insert(payload).select("*").single();
  },
  update_row: async (id: string, payload: Record<string, unknown>) => {
    const admin = create_admin_client();
    return admin.from(table).update(payload).eq("id", id).select("*").single();
  },
  delete_row: async (id: string) => {
    const admin = create_admin_client();
    return admin.from(table).delete().eq("id", id);
  },
});

export const programs_repo = () =>
  crud_for("programs", ["code", "name"], ["status"]);
export const courses_repo = () =>
  crud_for("courses", ["course_code", "title"], ["status"]);
export const terms_repo = () =>
  crud_for("academic_terms", ["school_year", "semester"], ["status", "semester"]);
export const offerings_repo = () =>
  crud_for(
    "course_offerings",
    ["section"],
    ["course_id", "academic_term_id", "instructor_id", "status"]
  );
export const enrollments_repo = () =>
  crud_for("enrollments", [], ["student_id", "course_offering_id", "status"]);
export const grades_repo = () =>
  crud_for("grades", [], ["remarks"]);
