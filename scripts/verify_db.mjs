// One-off DB verification: row counts vs REQUIREMENTS.md + integrity checks.
// Run: node --env-file=.env.local scripts/verify_db.mjs
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

let fail = 0;
const check = (label, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);
  if (!cond) fail++;
};

const count = async (table) => {
  const { count, error } = await admin.from(table).select("id", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return count;
};

// Required seed counts.
const expected = {
  users: 5,
  programs: 3,
  students: 100,
  courses: 20,
  academic_terms: 2,
  course_offerings: 20,
  enrollments: 200,
  grades: 100,
};
for (const [t, want] of Object.entries(expected)) {
  const got = await count(t);
  check(`count ${t} == ${want}`, got === want, `got ${got}`);
}

// users: one per role set, all active, students linked.
const { data: users } = await admin.from("users").select("email, role, status, student_id");
const roles = [...new Set(users.map((u) => u.role))].sort();
check("roles cover admin/registrar/instructor/student", ["administrator", "instructor", "registrar", "student"].every((r) => roles.includes(r)), roles.join(","));
check("all users active", users.every((u) => u.status === "active"));
check("student users linked to student rows", users.filter((u) => u.role === "student").every((u) => !!u.student_id));

// Integrity: no orphans.
const orphans = async (child, fk, parent) => {
  const { data: rows } = await admin.from(child).select(fk);
  const ids = [...new Set(rows.map((r) => r[fk]).filter(Boolean))];
  if (!ids.length) return 0;
  const { data: found } = await admin.from(parent).select("id").in("id", ids);
  return ids.length - found.length;
};
check("students.program_id valid", (await orphans("students", "program_id", "programs")) === 0);
check("offerings.course_id valid", (await orphans("course_offerings", "course_id", "courses")) === 0);
check("offerings.academic_term_id valid", (await orphans("course_offerings", "academic_term_id", "academic_terms")) === 0);
check("enrollments.student_id valid", (await orphans("enrollments", "student_id", "students")) === 0);
check("enrollments.course_offering_id valid", (await orphans("enrollments", "course_offering_id", "course_offerings")) === 0);
check("grades.enrollment_id valid", (await orphans("grades", "enrollment_id", "enrollments")) === 0);

// Every seeded enrollment pair unique (constraint would have failed the seed, double-check).
const { data: enr } = await admin.from("enrollments").select("student_id, course_offering_id");
const pairs = new Set(enr.map((e) => `${e.student_id}|${e.course_offering_id}`));
check("no duplicate enrollments", pairs.size === enr.length, `${enr.length} rows`);

// Grades reference distinct enrollments (one grade per enrollment).
const { data: grd } = await admin.from("grades").select("enrollment_id");
check("one grade per enrollment", new Set(grd.map((g) => g.enrollment_id)).size === grd.length);

// Offerings have an instructor assigned.
const { count: with_instructor } = await admin.from("course_offerings").select("id", { count: "exact", head: true }).not("instructor_id", "is", null);
check("offerings have instructor", with_instructor === 20, `got ${with_instructor}`);

console.log(fail === 0 ? "ALL DB CHECKS PASSED" : `${fail} CHECKS FAILED`);
process.exit(fail === 0 ? 0 : 1);
