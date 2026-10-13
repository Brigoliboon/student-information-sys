import type { NextRequest } from "next/server";
import { fail, ok, no_content } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { get_student_by_id, delete_student_row } from "@/lib/supabase/tables/students";
import { update_student } from "@/services/students_service";
import { can_read_student, can_write } from "@/services/rbac";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    const { id } = await ctx.params;
    if (!can_read_student(caller.profile, id)) return fail(403, "Forbidden");
    const { data, error } = await get_student_by_id(id);
    if (error) return fail(500, "Internal server error");
    if (!data) return fail(404, "Student not found");
    return ok(data);
  } catch (e) {
    return handle(e);
  }
};

export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (!can_write(caller.profile, "students")) return fail(403, "Forbidden");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail(400, "Invalid JSON body");
    const row = await update_student(id, body);
    return ok(row, "Student updated");
  } catch (e) {
    return handle(e);
  }
};

export const PUT = PATCH;

export const DELETE = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (!can_write(caller.profile, "students")) return fail(403, "Forbidden");
    const { id } = await ctx.params;
    const { error } = await delete_student_row(id);
    if (error) return fail(500, "Internal server error");
    return no_content();
  } catch (e) {
    return handle(e);
  }
};
