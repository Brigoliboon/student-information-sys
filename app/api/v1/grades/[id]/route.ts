import type { NextRequest } from "next/server";
import { fail, ok } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { create_admin_client } from "@/lib/supabase/admin";
import { validate_grade } from "@/services/academic_service";
import { can_list, can_write, instructor_owns_offering, offering_of_enrollment } from "@/services/rbac";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (!can_list(caller.profile, "grades")) return fail(403, "Forbidden");
    const { id } = await ctx.params;
    const admin = create_admin_client();
    const { data, error } = await admin
      .from("grades")
      .select("*, enrollments(id, student_id, course_offering_id)")
      .eq("id", id)
      .maybeSingle();
    if (error) return fail(500, "Internal server error");
    if (!data) return fail(404, "Grade not found");
    const enrollment = (data as Record<string, unknown>).enrollments as Record<string, unknown>;
    if (caller.profile.role === "student" && enrollment?.student_id !== caller.profile.student_id) {
      return fail(403, "Forbidden");
    }
    return ok(data);
  } catch (e) {
    return handle(e);
  }
};

const update = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const caller = await require_user(req);
  if (!can_write(caller.profile, "grades")) return fail(403, "Forbidden");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const subset: Record<string, unknown> = {};
  for (const k of ["grade_value", "remarks"]) if (body[k] !== undefined) subset[k] = body[k];
  await validate_grade(subset, true);
  const admin = create_admin_client();
  const { data: existing } = await admin.from("grades").select("enrollment_id").eq("id", id).maybeSingle();
  if (!existing) return fail(404, "Grade not found");
  if (caller.profile.role === "instructor") {
    const offering_id = await offering_of_enrollment(existing.enrollment_id as string);
    if (!offering_id || !(await instructor_owns_offering(caller.auth_id, offering_id))) {
      return fail(403, "You can only grade enrollments in your assigned offerings");
    }
  }
  const allowed: Record<string, unknown> = {};
  for (const k of ["grade_value", "remarks"]) if (body[k] !== undefined) allowed[k] = body[k];
  const { data, error } = await admin.from("grades").update(allowed).eq("id", id).select("*").single();
  if (error) return fail(500, "Internal server error");
  return ok(data, "Grade updated");
};

export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    return await update(req, ctx);
  } catch (e) {
    return handle(e);
  }
};

export const PUT = PATCH;
