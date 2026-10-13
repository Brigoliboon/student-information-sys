import type { NextRequest } from "next/server";
import { fail, ok, no_content } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { programs_repo } from "@/lib/supabase/tables/catalog";
import { validate_program } from "@/services/catalog_service";
import { can_list, can_write } from "@/services/rbac";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (!can_list(caller.profile, "programs")) return fail(403, "Forbidden");
    const { id } = await ctx.params;
    const { data, error } = await programs_repo().get_by_id(id);
    if (error) return fail(500, "Internal server error");
    if (!data) return fail(404, "Program not found");
    return ok(data);
  } catch (e) {
    return handle(e);
  }
};

export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (!can_write(caller.profile, "programs")) return fail(403, "Forbidden");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail(400, "Invalid JSON body");
    validate_program(body, true);
    const allowed: Record<string, unknown> = {};
    for (const k of ["code", "name", "description", "status"]) if (body[k] !== undefined) allowed[k] = body[k];
    const { data, error } = await programs_repo().update_row(id, allowed);
    if (error) {
      if (error.code === "23505") return fail(409, "Duplicate program code");
      return fail(500, "Internal server error");
    }
    return ok(data, "Program updated");
  } catch (e) {
    return handle(e);
  }
};

export const PUT = PATCH;

export const DELETE = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (!can_write(caller.profile, "programs")) return fail(403, "Forbidden");
    const { id } = await ctx.params;
    const { error } = await programs_repo().delete_row(id);
    if (error) return fail(500, "Internal server error");
    return no_content();
  } catch (e) {
    return handle(e);
  }
};
