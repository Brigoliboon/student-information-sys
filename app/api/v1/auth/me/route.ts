import type { NextRequest } from "next/server";
import { fail, ok } from "@/utils/api_response";
import { get_request_user } from "@/lib/supabase/auth";
import { sanitize_user } from "@/lib/supabase/tables/users";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  const caller = await get_request_user(req);
  if (!caller) return fail(401, "Unauthorized");
  return ok({ user: sanitize_user(caller.profile as unknown as Record<string, unknown>) });
};
