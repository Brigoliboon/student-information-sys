import type { NextRequest } from "next/server";
import { created, fail, ok } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { create_admin_client } from "@/lib/supabase/admin";
import { create_grade } from "@/services/academic_service";
import { can_list, can_write, instructor_owns_offering, offering_of_enrollment } from "@/services/rbac";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const caller = await require_user(req);
    if (!can_list(caller.profile, "grades")) return fail(403, "Forbidden");
    const admin = create_admin_client();
    let query = admin.from("grades").select("*, enrollments!inner(id, student_id, course_offering_id)");
    if (caller.profile.role === "student") {
      query = query.eq("enrollments.student_id", caller.profile.student_id!);
    }
    const enrollment_id = req.nextUrl.searchParams.get("enrollment_id");
    if (enrollment_id) query = query.eq("enrollment_id", enrollment_id);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return fail(500, "Internal server error");
    return ok(data);
  } catch (e) {
    return handle(e);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const caller = await require_user(req);
    if (!can_write(caller.profile, "grades")) return fail(403, "Forbidden");
    const body = await req.json().catch(() => null);
    if (!body) return fail(400, "Invalid JSON body");
    if (caller.profile.role === "instructor") {
      const offering_id = await offering_of_enrollment(String(body.enrollment_id));
      if (!offering_id || !(await instructor_owns_offering(caller.auth_id, offering_id))) {
        return fail(403, "You can only grade enrollments in your assigned offerings");
      }
    }
    return created(await create_grade(body, caller.auth_id), "Grade recorded");
  } catch (e) {
    return handle(e);
  }
};
