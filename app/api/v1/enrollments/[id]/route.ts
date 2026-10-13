import type { NextRequest } from "next/server";
import { fail, ok, no_content } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { create_admin_client } from "@/lib/supabase/admin";
import { in_enum, ENROLLMENT_STATUSES } from "@/utils/validation";
import { service_error } from "@/services/errors";
import { can_list } from "@/services/rbac";

export const dynamic = "force-dynamic";

const own_enrollment = async (caller_student_id: string | null, enrollment_id: string) => {
  const admin = create_admin_client();
  const { data } = await admin.from("enrollments").select("student_id").eq("id", enrollment_id).maybeSingle();
  return data?.student_id === caller_student_id;
};

export const GET = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (!can_list(caller.profile, "enrollments")) return fail(403, "Forbidden");
    const { id } = await ctx.params;
    if (caller.profile.role === "student" && !(await own_enrollment(caller.profile.student_id, id))) {
      return fail(403, "Forbidden");
    }
    const admin = create_admin_client();
    const { data, error } = await admin
      .from("enrollments")
      .select("*, students(*), course_offerings(*, courses(*)), grades(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) return fail(500, "Internal server error");
    if (!data) return fail(404, "Enrollment not found");
    return ok(data);
  } catch (e) {
    return handle(e);
  }
};

export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (caller.profile.role !== "administrator" && caller.profile.role !== "registrar") {
      return fail(403, "Forbidden");
    }
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail(400, "Invalid JSON body");
    if (body.status !== undefined && !in_enum(body.status, ENROLLMENT_STATUSES)) {
      throw new service_error(422, "Validation failed", [{ message: "invalid enrollment status" }]);
    }
    const admin = create_admin_client();
    const { data, error } = await admin
      .from("enrollments")
      .update({ status: body.status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return fail(500, "Internal server error");
    return ok(data, "Enrollment updated");
  } catch (e) {
    return handle(e);
  }
};

export const PUT = PATCH;

export const DELETE = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (caller.profile.role !== "administrator" && caller.profile.role !== "registrar") {
      return fail(403, "Forbidden");
    }
    const { id } = await ctx.params;
    const admin = create_admin_client();
    const { error } = await admin.from("enrollments").delete().eq("id", id);
    if (error) return fail(500, "Internal server error");
    return no_content();
  } catch (e) {
    return handle(e);
  }
};
