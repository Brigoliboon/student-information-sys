import type { NextRequest } from "next/server";
import { ok } from "@/utils/api_response";
import { logout_user } from "@/services/auth_service";

export const dynamic = "force-dynamic";

export const POST = async (req: NextRequest) => {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7) : null;
  if (token) await logout_user(token);
  return ok(null, "Signed out");
};
