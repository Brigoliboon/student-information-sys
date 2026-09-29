import { create_admin_client } from "@/lib/supabase/admin";

export const is_email = (v: unknown) =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const in_enum = (v: unknown, allowed: readonly string[]) =>
  typeof v === "string" && allowed.includes(v);

export const USER_ROLES = ["administrator", "registrar", "instructor", "student"] as const;
export const USER_STATUSES = ["active", "inactive", "suspended"] as const;
export const STUDENT_STATUSES = ["active", "inactive", "graduated", "suspended", "dropped"] as const;
export const GENERIC_STATUSES = ["active", "inactive"] as const;
export const TERM_STATUSES = ["upcoming", "ongoing", "closed"] as const;
export const OFFERING_STATUSES = ["open", "closed", "cancelled"] as const;
export const ENROLLMENT_STATUSES = ["enrolled", "dropped", "withdrawn", "completed"] as const;
export const GRADE_REMARKS = ["passed", "failed", "incomplete", "dropped", "withdrawn", "no_grade"] as const;
export const SEMESTERS = ["1st", "2nd", "summer"] as const;

export const exists_in = async (table: string, id: string): Promise<boolean> => {
  const admin = create_admin_client();
  const { data, error } = await admin.from(table).select("id").eq("id", id).maybeSingle();
  return !error && !!data;
};

export const err = (message: string) => ({ message });
