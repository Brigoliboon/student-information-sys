import type { NextRequest } from "next/server";
import { created, fail, ok } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { parse_list_params } from "@/utils/pagination";
import { create_offering } from "@/services/catalog_service";
import { can_list, can_write } from "@/services/rbac";
import { create_admin_client } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const caller = await require_user(req);
    if (!can_list(caller.profile, "offerings")) return fail(403, "Forbidden");
    const q = parse_list_params(req);
    const admin = create_admin_client();
    const page = q.page;
    const per_page = q.per_page;
    let query = admin
      .from("course_offerings")
      .select("*, courses(id, course_code, title, units), academic_terms(id, school_year, semester)", { count: "exact" });
    for (const [k, v] of Object.entries(q.filters)) {
      if (["course_id", "academic_term_id", "instructor_id", "status"].includes(k)) query = query.eq(k, v);
    }
    if (q.search) query = query.ilike("section", `%${q.search}%`);
    const [col, dir] = (q.sort ?? "created_at:desc").split(":");
    query = query.order(col, { ascending: (dir ?? "desc") !== "desc" });
    query = query.range((page - 1) * per_page, page * per_page - 1);
    const { data, error, count } = await query;
    if (error) return fail(500, "Internal server error");
    return ok(data, "OK", { page, per_page, total: count ?? 0, last_page: Math.max(1, Math.ceil((count ?? 0) / per_page)) });
  } catch (e) {
    return handle(e);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const caller = await require_user(req);
    if (!can_write(caller.profile, "offerings")) return fail(403, "Forbidden");
    const body = await req.json().catch(() => null);
    if (!body) return fail(400, "Invalid JSON body");
    return created(await create_offering(body), "Course offering created");
  } catch (e) {
    return handle(e);
  }
};
