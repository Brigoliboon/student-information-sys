import type { NextRequest } from "next/server";
import { fail, ok } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { create_admin_client } from "@/lib/supabase/admin";
import { can_list } from "@/services/rbac";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    if (!can_list(caller, "enrollments")) return fail(403, "Forbidden");
    const { id } = await ctx.params;
    const admin = create_admin_client();
    const { data, error } = await admin
      .from("enrollments")
      .select("id, status, students(*)")
      .eq("course_offering_id", id);
    if (error) return fail(500, "Internal server error");
    return ok(data);
  } catch (e) {
    return handle(e);
  }
};
