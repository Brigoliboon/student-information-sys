import type { NextRequest } from "next/server";
import { fail, ok } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { student_academic_record } from "@/services/academic_service";
import { can_read_student } from "@/services/rbac";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    const { id } = await ctx.params;
    if (!can_read_student(caller.profile, id)) return fail(403, "Forbidden");
    const record = await student_academic_record(id);
    return ok(record);
  } catch (e) {
    return handle(e);
  }
};
