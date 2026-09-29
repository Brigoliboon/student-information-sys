import { service_error } from "@/services/errors";
import { in_enum, exists_in, GENERIC_STATUSES, TERM_STATUSES, OFFERING_STATUSES, SEMESTERS, err } from "@/utils/validation";
import { programs_repo, courses_repo, terms_repo, offerings_repo } from "@/lib/supabase/tables/catalog";

export const validate_program = (b: Record<string, unknown>, partial = false) => {
  const errors: Array<{ message: string }> = [];
  if (!partial || b.code !== undefined) if (!b.code) errors.push(err("code is required"));
  if (!partial || b.name !== undefined) if (!b.name) errors.push(err("name is required"));
  if (b.status !== undefined && !in_enum(b.status, GENERIC_STATUSES)) errors.push(err("status must be active|inactive"));
  if (errors.length) throw new service_error(422, "Validation failed", errors);
};

export const validate_course = (b: Record<string, unknown>, partial = false) => {
  const errors: Array<{ message: string }> = [];
  if (!partial || b.course_code !== undefined) if (!b.course_code) errors.push(err("course_code is required"));
  if (!partial || b.title !== undefined) if (!b.title) errors.push(err("title is required"));
  if (b.units !== undefined && (Number.isNaN(Number(b.units)) || Number(b.units) < 0)) errors.push(err("units must be a non-negative number"));
  if (b.status !== undefined && !in_enum(b.status, GENERIC_STATUSES)) errors.push(err("status must be active|inactive"));
  if (errors.length) throw new service_error(422, "Validation failed", errors);
};

export const validate_term = (b: Record<string, unknown>, partial = false) => {
  const errors: Array<{ message: string }> = [];
  if (!partial || b.school_year !== undefined) if (!b.school_year) errors.push(err("school_year is required"));
  if (!partial || b.semester !== undefined) {
    if (!in_enum(b.semester, SEMESTERS)) errors.push(err(`semester must be one of: ${SEMESTERS.join(", ")}`));
  }
  if (b.status !== undefined && !in_enum(b.status, TERM_STATUSES)) errors.push(err("status must be upcoming|ongoing|closed"));
  if (errors.length) throw new service_error(422, "Validation failed", errors);
};

export const validate_offering = async (b: Record<string, unknown>, partial = false) => {
  const errors: Array<{ message: string }> = [];
  if (!partial || b.course_id !== undefined) {
    if (!b.course_id) errors.push(err("course_id is required"));
    else if (!(await exists_in("courses", String(b.course_id)))) errors.push(err("course_id does not exist"));
  }
  if (!partial || b.academic_term_id !== undefined) {
    if (!b.academic_term_id) errors.push(err("academic_term_id is required"));
    else if (!(await exists_in("academic_terms", String(b.academic_term_id)))) errors.push(err("academic_term_id does not exist"));
  }
  if (b.instructor_id !== undefined && b.instructor_id !== null) {
    if (!(await exists_in("users", String(b.instructor_id)))) errors.push(err("instructor_id does not exist"));
  }
  if (!partial || b.section !== undefined) if (!b.section) errors.push(err("section is required"));
  if (b.capacity !== undefined && (!Number.isInteger(Number(b.capacity)) || Number(b.capacity) < 1)) {
    errors.push(err("capacity must be a positive integer"));
  }
  if (b.status !== undefined && !in_enum(b.status, OFFERING_STATUSES)) errors.push(err("status must be open|closed|cancelled"));
  if (errors.length) throw new service_error(422, "Validation failed", errors);
};

const save = async (
  repo: () => { create_row: (p: Record<string, unknown>) => Promise<{ data: unknown; error: { code?: string } | null }> },
  payload: Record<string, unknown>
) => {
  const { data, error } = await repo().create_row(payload);
  if (error) {
    if (error.code === "23505") throw new service_error(409, "Duplicate record");
    throw new service_error(500, "Internal server error");
  }
  return data;
};

export const create_program = async (b: Record<string, unknown>) => {
  validate_program(b);
  return save(programs_repo, { code: b.code, name: b.name, description: b.description ?? null, status: b.status ?? "active" });
};

export const create_course = async (b: Record<string, unknown>) => {
  validate_course(b);
  return save(courses_repo, { course_code: b.course_code, title: b.title, units: b.units ?? 3, description: b.description ?? null, status: b.status ?? "active" });
};

export const create_term = async (b: Record<string, unknown>) => {
  validate_term(b);
  return save(terms_repo, { school_year: b.school_year, semester: b.semester, start_date: b.start_date ?? null, end_date: b.end_date ?? null, status: b.status ?? "upcoming" });
};

export const create_offering = async (b: Record<string, unknown>) => {
  await validate_offering(b);
  return save(offerings_repo, {
    course_id: b.course_id,
    academic_term_id: b.academic_term_id,
    instructor_id: b.instructor_id ?? null,
    section: b.section,
    schedule: b.schedule ?? null,
    capacity: b.capacity ?? 40,
    status: b.status ?? "open",
  });
};
