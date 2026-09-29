import { NextResponse } from "next/server";

export const ok = (data: unknown, message = "OK", meta?: unknown) =>
  NextResponse.json({ success: true, message, data, ...(meta ? { meta } : {}) }, { status: 200 });

export const created = (data: unknown, message = "Created") =>
  NextResponse.json({ success: true, message, data }, { status: 201 });

export const no_content = () => new NextResponse(null, { status: 204 });

export const fail = (status: number, message: string, errors?: unknown) =>
  NextResponse.json({ success: false, message, errors: errors ?? [] }, { status });

// Map Postgres errors to HTTP without leaking raw DB internals.
export const db_error = (error: { code?: string; message?: string; details?: string }) => {
  const code = error.code ?? "";
  if (code === "23505") return fail(409, "Duplicate record", [{ message: "Unique constraint violated" }]);
  if (code === "23503") return fail(422, "Invalid reference", [{ message: "Referenced record does not exist" }]);
  if (code === "23514" || code === "23513" || code === "22P02" || code === "22001") {
    return fail(422, "Validation failed", [{ message: "Invalid value supplied" }]);
  }
  return fail(500, "Internal server error");
};
