import type { NextRequest } from "next/server";
import { created, fail, ok } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { parse_list_params } from "@/utils/pagination";
import { list_users, sanitize_user } from "@/lib/supabase/tables/users";
import { admin_create_user } from "@/services/users_service";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const caller = await require_user(req);
    if (caller.profile.role !== "administrator") return fail(403, "Forbidden");
    const q = parse_list_params(req);
    const sp = req.nextUrl.searchParams;
    const { data, error, meta } = await list_users({
      ...q,
      role: sp.get("role") ?? undefined,
      status: sp.get("status") ?? undefined,
    });
    if (error) return fail(500, "Internal server error");
    return ok((data ?? []).map((r) => sanitize_user(r as Record<string, unknown>)), "OK", meta);
  } catch (e) {
    return handle(e);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const caller = await require_user(req);
    if (caller.profile.role !== "administrator") return fail(403, "Forbidden");
    const body = await req.json().catch(() => null);
    if (!body) return fail(400, "Invalid JSON body");
    const row = await admin_create_user(body);
    return created(sanitize_user(row as Record<string, unknown>), "User profile created");
  } catch (e) {
    return handle(e);
  }
};
