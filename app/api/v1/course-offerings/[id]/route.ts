import type { NextRequest } from "next/server";
import { fail, ok, no_content } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { offerings_repo } from "@/lib/supabase/tables/catalog";
import { validate_offering } from "@/services/catalog_service";
import { can_list, can_write } from "@/services/rbac";
import { create_admin_client } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (!can_list(caller.profile, "offerings")) return fail(403, "Forbidden");
    const { id } = await ctx.params;
    const admin = create_admin_client();
    const { data, error } = await admin
      .from("course_offerings")
      .select("*, courses(*), academic_terms(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) return fail(500, "Internal server error");
    if (!data) return fail(404, "Course offering not found");
    return ok(data);
  } catch (e) {
    return handle(e);
  }
};

export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (!can_write(caller.profile, "offerings")) return fail(403, "Forbidden");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail(400, "Invalid JSON body");
    await validate_offering(body, true);
    const allowed: Record<string, unknown> = {};
    for (const k of ["course_id", "academic_term_id", "instructor_id", "section", "schedule", "capacity", "status"]) {
      if (body[k] !== undefined) allowed[k] = body[k];
    }
    const { data, error } = await offerings_repo().update_row(id, allowed);
    if (error) return fail(500, "Internal server error");
    return ok(data, "Course offering updated");
  } catch (e) {
    return handle(e);
  }
};

export const PUT = PATCH;

export const DELETE = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (!can_write(caller.profile, "offerings")) return fail(403, "Forbidden");
    const { id } = await ctx.params;
    const { error } = await offerings_repo().delete_row(id);
    if (error) return fail(500, "Internal server error");
    return no_content();
  } catch (e) {
    return handle(e);
  }
};
