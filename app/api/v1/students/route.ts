import type { NextRequest } from "next/server";
import { created, fail, ok } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { parse_list_params } from "@/utils/pagination";
import { list_students } from "@/lib/supabase/tables/students";
import { create_student } from "@/services/students_service";
import { can_list, can_write } from "@/services/rbac";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const caller = await require_user(req);
    if (!can_list(caller, "students")) return fail(403, "Forbidden");
    const q = parse_list_params(req);
    const { data, error, meta } = await list_students(q);
    if (error) return fail(500, "Internal server error");
    return ok(data, "OK", meta);
  } catch (e) {
    return handle(e);
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const caller = await require_user(req);
    if (!can_write(caller, "students")) return fail(403, "Forbidden");
    const body = await req.json().catch(() => null);
    if (!body) return fail(400, "Invalid JSON body");
    const row = await create_student(body);
    return created(row, "Student created");
  } catch (e) {
    return handle(e);
  }
};
