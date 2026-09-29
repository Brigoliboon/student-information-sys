// One-off: create the 5 demo Auth users and link public.users profiles.
// Run: node --env-file=.env.local scripts/seed_auth_users.mjs
// Requires database/migration/*.sql + database/seeds/001_seed.sql already run.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !serviceKey || !anonKey) throw new Error("Missing Supabase env vars");

const PASSWORD = process.argv[2] ?? "demo123";
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const ACCOUNTS = [
  { email: "admin@example.edu", role: "administrator", display_name: "System Administrator" },
  { email: "registrar@example.edu", role: "registrar", display_name: "Registrar Staff" },
  { email: "instructor@example.edu", role: "instructor", display_name: "Prof. Instructor" },
  { email: "student1@example.edu", role: "student", display_name: "Student One", student_number: "2021-00001" },
  { email: "student2@example.edu", role: "student", display_name: "Student Two", student_number: "2021-00002" },
];

const find_id = async (email) => {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data?.users?.find((u) => u.email === email)?.id ?? null;
};

const ids = {};
for (const a of ACCOUNTS) {
  let id = await find_id(a.email);
  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({
      email: a.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: a.display_name, role: a.role },
    });
    if (error) throw new Error(`${a.email}: ${error.message}`);
    id = data.user.id;
    console.log(`created ${a.email}`);
  } else {
    console.log(`exists  ${a.email}`);
  }
  ids[a.email] = id;
}

// Replace placeholder profile rows with real auth ids.
await admin.from("users").delete().in("email", ACCOUNTS.map((a) => a.email));
const { error: ins_err } = await admin.from("users").insert(
  ACCOUNTS.map((a) => ({
    id: ids[a.email],
    email: a.email,
    display_name: a.display_name,
    role: a.role,
    status: "active",
  }))
);
if (ins_err) throw new Error(`users insert: ${ins_err.message}`);
console.log("linked public.users profiles");

// Point demo student profiles at seeded student rows.
for (const a of ACCOUNTS.filter((x) => x.student_number)) {
  const { data: s } = await admin
    .from("students")
    .select("id")
    .eq("student_number", a.student_number)
    .maybeSingle();
  if (s) {
    await admin.from("users").update({ student_id: s.id }).eq("id", ids[a.email]);
    console.log(`linked ${a.email} -> ${a.student_number}`);
  } else {
    console.log(`WARN no student row ${a.student_number} (run seeds first)`);
  }
}

// Re-point seeded instructor refs from the placeholder id to the real one.
const instructor_id = ids["instructor@example.edu"];
const PLACEHOLDER = "33333333-3333-3333-3333-333333333333";
await admin.from("course_offerings").update({ instructor_id }).eq("instructor_id", PLACEHOLDER);
await admin.from("grades").update({ graded_by: instructor_id }).eq("graded_by", PLACEHOLDER);
console.log("re-pointed instructor refs");

// Verify every account can sign in.
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
for (const a of ACCOUNTS) {
  const { error } = await anon.auth.signInWithPassword({ email: a.email, password: PASSWORD });
  console.log(`${error ? "FAIL " : "ok   "} login ${a.email}${error ? ` (${error.message})` : ""}`);
  await anon.auth.signOut();
}
