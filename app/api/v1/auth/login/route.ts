import type { NextRequest } from "next/server";
import { created, fail } from "@/utils/api_response";
import { login_user } from "@/services/auth_service";

export const dynamic = "force-dynamic";

export const POST = async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) return fail(400, "email and password are required");
  const result = await login_user(String(body.email), String(body.password));
  if ("error" in result) return fail(401, "Invalid credentials");
  return created(result, "Authenticated");
};
