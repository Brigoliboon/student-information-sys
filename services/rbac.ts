import type { request_user, user_role } from "@/lib/supabase/models";
import { create_admin_client } from "@/lib/supabase/admin";

export type resource =
  | "users"
  | "students"
  | "programs"
  | "courses"
  | "terms"
  | "offerings"
  | "enrollments"
  | "grades"
  | "academic_record";

const STAFF: user_role[] = ["administrator", "registrar"];

export const can_list = (u: request_user, r: resource): boolean => {
  if (u.profile.role === "administrator") return true;
  if (r === "users") return false;
  if (STAFF.includes(u.profile.role)) return true;
  if (u.profile.role === "instructor") return ["students", "offerings", "enrollments", "grades", "courses", "terms", "programs"].includes(r);
  return r === "academic_record"; // students use nested own-only routes
};

export const can_write = (u: request_user, r: resource): boolean => {
  if (u.profile.role === "administrator") return true;
  if (r === "users") return false;
  if (u.profile.role === "registrar") {
    return ["students", "programs", "courses", "terms", "offerings", "enrollments", "grades"].includes(r);
  }
  if (u.profile.role === "instructor") return r === "grades";
  return false;
};

export const can_read_student = (u: request_user, student_id: string): boolean => {
  if (u.profile.role === "administrator" || u.profile.role === "registrar") return true;
  if (u.profile.role === "student") return u.profile.student_id === student_id;
  return true; // instructors read via assigned offerings; object check happens in grades/enrollment flow
};

// Instructor may only touch enrollments/grades inside offerings they teach.
export const instructor_owns_offering = async (instructor_auth_id: string, offering_id: string) => {
  const admin = create_admin_client();
  const { data } = await admin
    .from("course_offerings")
    .select("id")
    .eq("id", offering_id)
    .eq("instructor_id", instructor_auth_id)
    .maybeSingle();
  return !!data;
};

export const offering_of_enrollment = async (enrollment_id: string) => {
  const admin = create_admin_client();
  const { data } = await admin
    .from("enrollments")
    .select("course_offering_id")
    .eq("id", enrollment_id)
    .maybeSingle();
  return (data?.course_offering_id as string | undefined) ?? null;
};
