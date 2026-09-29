import { create_admin_client } from "@/lib/supabase/admin";
import { service_error } from "@/services/errors";
import { is_email, in_enum, exists_in, USER_ROLES, USER_STATUSES, err } from "@/utils/validation";
import { create_user_row, update_user_row } from "@/lib/supabase/tables/users";

export const validate_user_payload = async (b: Record<string, unknown>, partial = false) => {
  const errors: Array<{ message: string }> = [];
  if (!partial || b.email !== undefined) {
    if (!is_email(b.email)) errors.push(err("Valid email is required"));
  }
  if (!partial || b.role !== undefined) {
    if (!in_enum(b.role, USER_ROLES)) errors.push(err(`role must be one of: ${USER_ROLES.join(", ")}`));
  }
  if (b.status !== undefined && !in_enum(b.status, USER_STATUSES)) {
    errors.push(err(`status must be one of: ${USER_STATUSES.join(", ")}`));
  }
  if (b.student_id !== undefined && b.student_id !== null) {
    if (!(await exists_in("students", String(b.student_id)))) errors.push(err("student_id does not exist"));
  }
  if (errors.length) throw new service_error(422, "Validation failed", errors);
};

export const admin_create_user = async (b: Record<string, unknown>) => {
  // Creates the public.users profile row. The Supabase Auth account must exist
  // first (created via signUp/admin API); its id is passed as b.id.
  await validate_user_payload(b);
  if (!b.id) throw new service_error(422, "Validation failed", [err("id (auth user id) is required")]);
  const admin = create_admin_client();
  const { data: existing } = await admin.from("users").select("id").eq("id", String(b.id)).maybeSingle();
  if (existing) throw new service_error(409, "User profile already exists");
  const { data, error } = await create_user_row({
    id: b.id,
    email: b.email,
    display_name: b.display_name ?? null,
    role: b.role,
    status: b.status ?? "active",
    student_id: b.student_id ?? null,
  });
  if (error) throw new service_error(500, "Internal server error");
  return data;
};

export const admin_update_user = async (id: string, b: Record<string, unknown>) => {
  await validate_user_payload(b, true);
  const allowed: Record<string, unknown> = {};
  for (const k of ["display_name", "role", "status", "student_id"]) {
    if (b[k] !== undefined) allowed[k] = b[k];
  }
  const { data, error } = await update_user_row(id, allowed);
  if (error) throw new service_error(500, "Internal server error");
  return data;
};
