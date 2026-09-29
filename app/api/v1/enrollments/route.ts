import type { NextRequest } from "next/server";
import { created, fail, ok } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { parse_list_params } from "@/utils/pagination";
import { create_admin_client } from "@/lib/supabase/admin";
import { create_enrollment } from "@/services/academic_service";
import { can_list, can_write } from "@/services/rbac";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const caller = await require_user(req);
    if (!can_list(caller, "enrollments")) return fail(403, "Forbidden");
    const q = parse_list_params(req);
    const admin = create_admin_client();
    let query = admin
      .from("enrollments")
      .select("*, students(id, student_number, first_name, last_name), course_offerings(id, section, courses(course_code, title))", { count: "exact" });
    if (caller.profile.role === "student") query = query.eq("student_id", caller.profile.student_id!);
    for (const [k, v] of Object.entries(q.filters)) {
      if (["student_id", "course_offering_id", "status"].includes(k)) query = query.eq(k, v);
    }
    const [col, dir] = (q.sort ?? "created_at:desc").split(":");
    query = query.order(col, { ascending: (dir ?? "desc") !== "desc" });
    query = query.range((q.page - 1) * q.per_page, q.page * q.per_page - 1);
    const { data, error, count } = await query;
    if (error) return fail(500, "Internal server error");
    return ok(data, "OK", { page: q.page, per_page: q.per_page, total: count ?? 0, last_page: Math.max(1, Math.ceil((count ?? 0) / q.per_page)) });
  } catch (e) {
    return handle(e);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const caller = await require_user(req);
    if (!can_write(caller, "enrollments")) return fail(403, "Forbidden");
    const body = await req.json().catch(() => null);
    if (!body) return fail(400, "Invalid JSON body");
    return created(await create_enrollment(body), "Enrollment created");
  } catch (e) {
    return handle(e);
  }
};
