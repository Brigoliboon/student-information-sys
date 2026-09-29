import type { NextRequest } from "next/server";
import { fail } from "@/utils/api_response";
import { get_request_user } from "@/lib/supabase/auth";
import type { request_user } from "@/lib/supabase/models";
import { service_error } from "@/services/errors";

export const require_user = async (req: NextRequest): Promise<request_user> => {
  const caller = await get_request_user(req);
  if (!caller) throw new service_error(401, "Unauthorized");
  return caller;
};

export const handle = (e: unknown) => {
  if (e instanceof service_error) return fail(e.status, e.message, e.errors);
  return fail(500, "Internal server error");
};
