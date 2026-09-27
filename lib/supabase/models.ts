// Supabase prod schema data type reference. Mirrors database/migration/001_schema.sql.
// Keep in sync with migrations; this file is the TS source of truth for services.

export type user_role = "administrator" | "registrar" | "instructor" | "student";
export type user_status = "active" | "inactive" | "suspended";
export type student_status = "active" | "inactive" | "graduated" | "suspended" | "dropped";
export type generic_status = "active" | "inactive";
export type term_status = "upcoming" | "ongoing" | "closed";
export type offering_status = "open" | "closed" | "cancelled";
export type enrollment_status = "enrolled" | "dropped" | "withdrawn" | "completed";
export type grade_remark = "passed" | "failed" | "incomplete" | "dropped" | "withdrawn" | "no_grade";

export interface user_row {
  id: string;
  email: string;
  display_name: string | null;
  role: user_role;
  status: user_status;
  student_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface program_row {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: generic_status;
  created_at: string;
  updated_at: string;
}

export interface student_row {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string | null;
  program_id: string | null;
  year_level: number | null;
  status: student_status;
  contact_number: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface course_row {
  id: string;
  course_code: string;
  title: string;
  units: number;
  description: string | null;
  status: generic_status;
  created_at: string;
  updated_at: string;
}

export interface academic_term_row {
  id: string;
  school_year: string;
  semester: string;
  start_date: string | null;
  end_date: string | null;
  status: term_status;
  created_at: string;
  updated_at: string;
}

export interface course_offering_row {
  id: string;
  course_id: string;
  academic_term_id: string;
  instructor_id: string | null;
  section: string;
  schedule: string | null;
  capacity: number;
  status: offering_status;
  created_at: string;
  updated_at: string;
}

export interface enrollment_row {
  id: string;
  student_id: string;
  course_offering_id: string;
  status: enrollment_status;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
}

export interface grade_row {
  id: string;
  enrollment_id: string;
  grade_value: number | null;
  remarks: grade_remark;
  graded_by: string | null;
  created_at: string;
  updated_at: string;
}

// Authenticated request context resolved per API call.
export interface request_user {
  auth_id: string;
  email: string;
  profile: user_row;
}
