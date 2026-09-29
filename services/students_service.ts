import { service_error } from "@/services/errors";
import { is_email, in_enum, exists_in, STUDENT_STATUSES, err } from "@/utils/validation";
import { create_student_row, update_student_row } from "@/lib/supabase/tables/students";

export const validate_student_payload = async (b: Record<string, unknown>, partial = false) => {
  const errors: Array<{ message: string }> = [];
  if (!partial || b.student_number !== undefined) {
    if (!b.student_number || typeof b.student_number !== "string") errors.push(err("student_number is required"));
  }
  if (!partial || b.first_name !== undefined) {
    if (!b.first_name) errors.push(err("first_name is required"));
  }
  if (!partial || b.last_name !== undefined) {
    if (!b.last_name) errors.push(err("last_name is required"));
  }
  if (b.email !== undefined && b.email !== null && b.email !== "" && !is_email(b.email)) {
    errors.push(err("email must be a valid email address"));
  }
  if (b.program_id !== undefined && b.program_id !== null) {
    if (!(await exists_in("programs", String(b.program_id)))) errors.push(err("program_id does not exist"));
  }
  if (b.year_level !== undefined && b.year_level !== null) {
    const y = Number(b.year_level);
    if (!Number.isInteger(y) || y < 1 || y > 6) errors.push(err("year_level must be an integer from 1 to 6"));
  }
  if (b.status !== undefined && !in_enum(b.status, STUDENT_STATUSES)) {
    errors.push(err(`status must be one of: ${STUDENT_STATUSES.join(", ")}`));
  }
  if (errors.length) throw new service_error(422, "Validation failed", errors);
};

export const create_student = async (b: Record<string, unknown>) => {
  await validate_student_payload(b);
  const { data, error } = await create_student_row({
    student_number: b.student_number,
    first_name: b.first_name,
    last_name: b.last_name,
    middle_name: b.middle_name ?? null,
    email: b.email ?? null,
    program_id: b.program_id ?? null,
    year_level: b.year_level ?? null,
    status: b.status ?? "active",
    contact_number: b.contact_number ?? null,
    address: b.address ?? null,
  });
  if (error) {
    if (error.code === "23505") throw new service_error(409, "Duplicate student number");
    throw new service_error(500, "Internal server error");
  }
  return data;
};

export const update_student = async (id: string, b: Record<string, unknown>) => {
  await validate_student_payload(b, true);
  const allowed: Record<string, unknown> = {};
  for (const k of ["student_number", "first_name", "last_name", "middle_name", "email", "program_id", "year_level", "status", "contact_number", "address"]) {
    if (b[k] !== undefined) allowed[k] = b[k];
  }
  const { data, error } = await update_student_row(id, allowed);
  if (error) {
    if (error.code === "23505") throw new service_error(409, "Duplicate student number");
    throw new service_error(500, "Internal server error");
  }
  return data;
};
