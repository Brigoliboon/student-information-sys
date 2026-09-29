import type { NextRequest } from "next/server";
import { fail, ok, no_content } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { get_user_by_id, delete_user_row, sanitize_user } from "@/lib/supabase/tables/users";
import { admin_update_user } from "@/services/users_service";

export const dynamic = "force-dynamic";

export const GET = async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(_req);
    if (caller.profile.role !== "administrator") return fail(403, "Forbidden");
    const { id } = await ctx.params;
    const { data, error } = await get_user_by_id(id);
    if (error) return fail(500, "Internal server error");
    if (!data) return fail(404, "User not found");
    return ok(sanitize_user(data as Record<string, unknown>));
  } catch (e) {
    return handle(e);
  }
};

export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (caller.profile.role !== "administrator") return fail(403, "Forbidden");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail(400, "Invalid JSON body");
    const row = await admin_update_user(id, body);
    return ok(sanitize_user(row as Record<string, unknown>), "User updated");
  } catch (e) {
    return handle(e);
  }
};

export const PUT = PATCH;

export const DELETE = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (caller.profile.role !== "administrator") return fail(403, "Forbidden");
    const { id } = await ctx.params;
    if (id === caller.auth_id) return fail(400, "You cannot delete your own account");
    const { error } = await delete_user_row(id);
    if (error) return fail(500, "Internal server error");
    return no_content();
  } catch (e) {
    return handle(e);
  }
};
