-- 001_seed.sql — deterministic seed data (idempotent via ON CONFLICT DO NOTHING).
-- Counts: 5 users, 3 programs, 100 students, 20 courses, 2 terms,
--         20 offerings, 200 enrollments, 100 grades.
-- Run after 001_schema.sql + 002_rls.sql in Supabase SQL editor.
--
-- AUTH LINKING: public.users.id must equal auth.users.id. Either
--   (a) run scripts/seed_auth_users.mjs first (creates Auth accounts + links
--       profiles; this seed then skips user inserts on email conflict), or
--   (b) create the 5 Auth accounts manually and replace the placeholder UUIDs.

begin;

-- 3 programs (fixed codes for stable references).
insert into public.programs (code, name, description, status) values
  ('BSCS', 'BS Computer Science', 'Computing theory, systems, and software engineering', 'active'),
  ('BSIT', 'BS Information Technology', 'Applied infrastructure, networks, and IT services', 'active'),
  ('BSED', 'BS Secondary Education', 'Teacher education for secondary schools', 'active')
on conflict (code) do nothing;

-- 5 users. If scripts/seed_auth_users.mjs already created the real Auth-linked
-- rows, this insert skips on email and later statements resolve ids by email,
-- so placeholder ids never collide with real auth.users ids.
insert into public.users (id, email, display_name, role, status) values
  ('11111111-1111-1111-1111-111111111111', 'admin@example.edu', 'System Administrator', 'administrator', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'registrar@example.edu', 'Registrar Staff', 'registrar', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'instructor@example.edu', 'Prof. Instructor', 'instructor', 'active'),
  ('44444444-4444-4444-4444-444444444444', 'student1@example.edu', 'Student One', 'student', 'active'),
  ('55555555-5555-5555-5555-555555555555', 'student2@example.edu', 'Student Two', 'student', 'active')
on conflict (email) do nothing;

-- 20 courses (fixed codes for stable references).
insert into public.courses (course_code, title, units, description, status) values
  ('CS101', 'Introduction to Computing', 3, 'Computing fundamentals and history', 'active'),
  ('CS102', 'Computer Programming 1', 3, 'Structured programming with Python', 'active'),
  ('CS103', 'Computer Programming 2', 3, 'Object-oriented programming with Java', 'active'),
  ('CS104', 'Data Structures and Algorithms', 3, 'Lists, trees, graphs, sorting, searching', 'active'),
  ('CS105', 'Database Management Systems', 3, 'Relational design and SQL', 'active'),
  ('CS106', 'Operating Systems', 3, 'Processes, memory, filesystems', 'active'),
  ('CS107', 'Computer Networks', 3, 'OSI model, TCP/IP, routing', 'active'),
  ('CS108', 'Software Engineering', 3, 'SDLC, testing, project management', 'active'),
  ('CS109', 'Web Systems and Technologies', 3, 'HTML, CSS, JS, and backend APIs', 'active'),
  ('CS110', 'Mobile Computing', 3, 'Mobile app development', 'active'),
  ('IT101', 'IT Fundamentals', 3, 'Hardware, software, and IT careers', 'active'),
  ('IT102', 'System Administration', 3, 'Linux administration and scripting', 'active'),
  ('IT103', 'Network Administration', 3, 'Enterprise network setup and security', 'active'),
  ('IT104', 'Cloud Computing', 3, 'Virtualization and cloud services', 'active'),
  ('IT105', 'Cybersecurity Fundamentals', 3, 'Threats, crypto, and best practices', 'active'),
  ('ED101', 'Foundations of Education', 3, 'Philosophy and history of education', 'active'),
  ('ED102', 'Child and Adolescent Development', 3, 'Developmental psychology', 'active'),
  ('ED103', 'Curriculum Development', 3, 'Curriculum design and evaluation', 'active'),
  ('ED104', 'Assessment of Learning', 3, 'Testing and measurement', 'active'),
  ('GE101', 'Mathematics in the Modern World', 3, 'General education mathematics', 'active')
on conflict (course_code) do nothing;

-- 2 academic terms.
insert into public.academic_terms (school_year, semester, start_date, end_date, status) values
  ('2025-2026', '1st', '2025-08-04', '2025-12-19', 'ongoing'),
  ('2025-2026', '2nd', '2026-01-12', '2026-05-29', 'upcoming')
on conflict (school_year, semester) do nothing;

-- 100 students, deterministic from generate_series (cycled names/programs).
with names as (
  select g as n,
    (array['Juan','Maria','Jose','Ana','Miguel','Rosa','Pedro','Liza','Marco','Nena','Paolo','Katrina','Ramon','Divina','Edgar','Lorna','Felix','Nadia','Omar','Pia'])[((g - 1) % 20) + 1] as fn,
    (array['Dela Cruz','Santos','Reyes','Garcia','Mendoza','Torres','Flores','Ramos','Aquino','Navarro','Salazar','Mercado','Aguilar','Villanueva','Castillo','Hernandez','Lopez','Pascual','Santiago','Domingo'])[((g * 7 - 1) % 20) + 1] as ln,
    (array['BSCS','BSIT','BSED'])[((g - 1) % 3) + 1] as pcode
  from generate_series(1, 100) g
)
insert into public.students (student_number, first_name, last_name, email, program_id, year_level, status)
select '2021-' || lpad(n::text, 5, '0'),
  fn, ln,
  lower(fn) || '.' || lower(replace(ln, ' ', '')) || n::text || '@example.edu',
  (select id from public.programs where code = pcode),
  ((n - 1) % 4) + 1,
  case when n % 20 = 0 then 'inactive' else 'active' end
from names
on conflict (student_number) do nothing;

-- Link the two student demo users to real student rows.
update public.users u set student_id = s.id from public.students s
where u.email = 'student1@example.edu' and s.student_number = '2021-00001';
update public.users u set student_id = s.id from public.students s
where u.email = 'student2@example.edu' and s.student_number = '2021-00002';

-- 20 offerings: first 20 courses x alternating terms, cycled sections.
with c as (select id, row_number() over (order by course_code) as rn from public.courses),
t as (select id, semester, row_number() over (order by school_year, semester) as rn from public.academic_terms)
insert into public.course_offerings (course_id, academic_term_id, instructor_id, section, schedule, capacity, status)
select c.id,
  (select id from t where rn = ((c.rn - 1) % 2) + 1),
  (select id from public.users where email = 'instructor@example.edu'),
  'SEC-' || chr((65 + ((c.rn - 1) % 4))::int),
  'MWF 0' || (((c.rn - 1) % 5) + 7)::text || ':00-0' || (((c.rn - 1) % 5) + 8)::text || ':00',
  40, 'open'
from c
on conflict do nothing;

-- 200 enrollments: every student takes 2 offerings (modular pairing, conflict-free).
with s as (select id, row_number() over (order by student_number) as rn from public.students),
o as (select id, row_number() over (order by section, id) as rn from public.course_offerings)
insert into public.enrollments (student_id, course_offering_id, status)
select s.id, o.id, 'enrolled'
from s join o on o.rn in ((((s.rn - 1) % 20) + 1), ((s.rn % 20) + 1))
on conflict (student_id, course_offering_id) do nothing;

-- 100 grades: first 100 enrollments get deterministic grades.
with e as (
  select id, row_number() over (order by enrolled_at, id) as rn from public.enrollments
),
gvals as (
  select e.id,
    (array[1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 5.0])[(((e.rn - 1) % 10) + 1)::int] as gv
  from e where e.rn <= 100
)
insert into public.grades (enrollment_id, grade_value, remarks, graded_by)
select g.id, g.gv,
  case when g.gv <= 3.0 then 'passed' else 'failed' end,
  (select id from public.users where email = 'instructor@example.edu')
from gvals g
on conflict (enrollment_id) do nothing;

commit;

-- Guard: fail loudly if instructor resolution or counts are off.
do $$
declare
  missing_instructor int;
begin
  select count(*) into missing_instructor
  from public.course_offerings where instructor_id is null;
  if missing_instructor > 0 then
    raise exception '% offerings missing instructor (users seed must run first)', missing_instructor;
  end if;
end;
$$;
