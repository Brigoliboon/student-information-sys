import type { NextRequest } from "next/server";
import { created, fail, ok } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { parse_list_params } from "@/utils/pagination";
import { courses_repo } from "@/lib/supabase/tables/catalog";
import { create_course } from "@/services/catalog_service";
import { can_list, can_write } from "@/services/rbac";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const caller = await require_user(req);
    if (!can_list(caller, "courses")) return fail(403, "Forbidden");
    const { data, error, meta } = await courses_repo().list(parse_list_params(req));
    if (error) return fail(500, "Internal server error");
    return ok(data, "OK", meta);
  } catch (e) {
    return handle(e);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const caller = await require_user(req);
    if (!can_write(caller, "courses")) return fail(403, "Forbidden");
    const body = await req.json().catch(() => null);
    if (!body) return fail(400, "Invalid JSON body");
    return created(await create_course(body), "Course created");
  } catch (e) {
    return handle(e);
  }
};
