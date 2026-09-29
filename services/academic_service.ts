import { create_admin_client } from "@/lib/supabase/admin";
import { service_error } from "@/services/errors";
import { in_enum, exists_in, ENROLLMENT_STATUSES, GRADE_REMARKS, err } from "@/utils/validation";

export const validate_enrollment = async (b: Record<string, unknown>) => {
  const errors: Array<{ message: string }> = [];
  if (!b.student_id) errors.push(err("student_id is required"));
  else if (!(await exists_in("students", String(b.student_id)))) errors.push(err("student_id does not exist"));
  if (!b.course_offering_id) errors.push(err("course_offering_id is required"));
  else if (!(await exists_in("course_offerings", String(b.course_offering_id)))) errors.push(err("course_offering_id does not exist"));
  if (b.status !== undefined && !in_enum(b.status, ENROLLMENT_STATUSES)) errors.push(err("invalid enrollment status"));
  if (errors.length) throw new service_error(422, "Validation failed", errors);
};

export const create_enrollment = async (b: Record<string, unknown>) => {
  await validate_enrollment(b);
  const admin = create_admin_client();
  const { data, error } = await admin
    .from("enrollments")
    .insert({ student_id: b.student_id, course_offering_id: b.course_offering_id, status: b.status ?? "enrolled" })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw new service_error(409, "Student is already enrolled in this offering");
    throw new service_error(500, "Internal server error");
  }
  return data;
};

export const validate_grade = async (b: Record<string, unknown>, partial = false) => {
  const errors: Array<{ message: string }> = [];
  if (!partial || b.enrollment_id !== undefined) {
    if (!b.enrollment_id) errors.push(err("enrollment_id is required"));
    else if (!(await exists_in("enrollments", String(b.enrollment_id)))) errors.push(err("enrollment_id does not exist"));
  }
  if (b.grade_value !== undefined && b.grade_value !== null) {
    const g = Number(b.grade_value);
    if (Number.isNaN(g) || g < 1.0 || g > 5.0) errors.push(err("grade_value must be between 1.0 and 5.0"));
  }
  if (b.remarks !== undefined && !in_enum(b.remarks, GRADE_REMARKS)) errors.push(err("invalid grade remarks"));
  if (errors.length) throw new service_error(422, "Validation failed", errors);
};

export const create_grade = async (b: Record<string, unknown>, graded_by: string | null) => {
  await validate_grade(b);
  const admin = create_admin_client();
  const { data, error } = await admin
    .from("grades")
    .insert({ enrollment_id: b.enrollment_id, grade_value: b.grade_value ?? null, remarks: b.remarks ?? "no_grade", graded_by })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw new service_error(409, "A grade already exists for this enrollment");
    throw new service_error(500, "Internal server error");
  }
  return data;
};

export const student_academic_record = async (student_id: string) => {
  const admin = create_admin_client();
  const { data: student, error: s_err } = await admin
    .from("students")
    .select("*, programs(id, code, name)")
    .eq("id", student_id)
    .maybeSingle();
  if (s_err) throw new service_error(500, "Internal server error");
  if (!student) throw new service_error(404, "Student not found");

  const { data: enrollments, error: e_err } = await admin
    .from("enrollments")
    .select(
      "id, status, course_offerings(id, section, schedule, courses(id, course_code, title, units), academic_terms(id, school_year, semester)), grades(id, grade_value, remarks)"
    )
    .eq("student_id", student_id);
  if (e_err) throw new service_error(500, "Internal server error");

  const by_term = new Map<string, { term: unknown; records: unknown[]; total_units: number }>();
  for (const e of enrollments ?? []) {
    const offering = (e as Record<string, unknown>).course_offerings as Record<string, unknown>;
    const term = offering?.academic_terms as Record<string, unknown>;
    const key = String((term as Record<string, unknown>)?.id ?? "unassigned");
    if (!by_term.has(key)) by_term.set(key, { term, records: [], total_units: 0 });
    const course = offering?.courses as Record<string, unknown>;
    by_term.get(key)!.records.push({
      enrollment_id: (e as Record<string, unknown>).id,
      enrollment_status: (e as Record<string, unknown>).status,
      course,
      section: offering?.section,
      grades: (e as Record<string, unknown>).grades,
    });
    by_term.get(key)!.total_units += Number(course?.units ?? 0);
  }
  return { student, terms: [...by_term.values()] };
};
