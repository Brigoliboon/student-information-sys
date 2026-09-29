import type { NextRequest } from "next/server";
import { fail, ok } from "@/utils/api_response";
import { require_user, handle } from "@/utils/route_auth";
import { create_admin_client } from "@/lib/supabase/admin";
import { can_read_student } from "@/services/rbac";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const caller = await require_user(req);
    const { id } = await ctx.params;
    if (!can_read_student(caller, id)) return fail(403, "Forbidden");
    const admin = create_admin_client();
    const { data, error } = await admin
      .from("enrollments")
      .select("*, course_offerings(*, courses(*), academic_terms(*))")
      .eq("student_id", id)
      .order("created_at", { ascending: false });
    if (error) return fail(500, "Internal server error");
    return ok(data);
  } catch (e) {
    return handle(e);
  }
};
