-- 001_schema.sql — Student Information Management core schema.
-- Run this in Supabase SQL editor (or psql). Do NOT commit real credentials.
-- Mirrors lib/supabase/models.ts; keep both in sync.

create extension if not exists "pgcrypto";

-- Auto-update updated_at on row changes.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Users & roles. id matches auth.users.id (created via Supabase Auth, then linked).
create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  display_name text,
  role text not null default 'student'
    check (role in ('administrator', 'registrar', 'instructor', 'student')),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'suspended')),
  student_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_number text not null unique,
  first_name text not null,
  last_name text not null,
  middle_name text,
  email text unique,
  program_id uuid references public.programs (id) on delete set null,
  year_level smallint check (year_level between 1 and 6),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'graduated', 'suspended', 'dropped')),
  contact_number text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  course_code text not null unique,
  title text not null,
  units numeric not null default 3 check (units >= 0),
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  school_year text not null,
  semester text not null check (semester in ('1st', '2nd', 'summer')),
  start_date date,
  end_date date,
  status text not null default 'upcoming' check (status in ('upcoming', 'ongoing', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_year, semester)
);

create table if not exists public.course_offerings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  academic_term_id uuid not null references public.academic_terms (id) on delete restrict,
  instructor_id uuid references public.users (id) on delete set null,
  section text not null,
  schedule text,
  capacity integer not null default 40 check (capacity >= 1),
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  course_offering_id uuid not null references public.course_offerings (id) on delete cascade,
  status text not null default 'enrolled'
    check (status in ('enrolled', 'dropped', 'withdrawn', 'completed')),
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, course_offering_id)
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null unique references public.enrollments (id) on delete cascade,
  grade_value numeric check (grade_value between 1.0 and 5.0),
  remarks text not null default 'no_grade'
    check (remarks in ('passed', 'failed', 'incomplete', 'dropped', 'withdrawn', 'no_grade')),
  graded_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- users.student_id link (added after students exists to avoid ordering issues).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_student_id_fkey'
  ) then
    alter table public.users
      add constraint users_student_id_fkey
      foreign key (student_id) references public.students (id) on delete set null;
  end if;
end;
$$;

-- Frequently searched columns.
create index if not exists idx_students_number on public.students (student_number);
create index if not exists idx_students_name on public.students (last_name, first_name);
create index if not exists idx_students_program on public.students (program_id);
create index if not exists idx_students_status on public.students (status);
create index if not exists idx_courses_code on public.courses (course_code);
create index if not exists idx_offerings_course on public.course_offerings (course_id);
create index if not exists idx_offerings_term on public.course_offerings (academic_term_id);
create index if not exists idx_offerings_instructor on public.course_offerings (instructor_id);
create index if not exists idx_enrollments_student on public.enrollments (student_id);
create index if not exists idx_enrollments_offering on public.enrollments (course_offering_id);
create index if not exists idx_grades_enrollment on public.grades (enrollment_id);
create index if not exists idx_users_role on public.users (role);

-- updated_at triggers.
drop trigger if exists trg_users_touch on public.users;
create trigger trg_users_touch before update on public.users
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_programs_touch on public.programs;
create trigger trg_programs_touch before update on public.programs
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_students_touch on public.students;
create trigger trg_students_touch before update on public.students
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_courses_touch on public.courses;
create trigger trg_courses_touch before update on public.courses
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_terms_touch on public.academic_terms;
create trigger trg_terms_touch before update on public.academic_terms
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_offerings_touch on public.course_offerings;
create trigger trg_offerings_touch before update on public.course_offerings
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_enrollments_touch on public.enrollments;
create trigger trg_enrollments_touch before update on public.enrollments
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_grades_touch on public.grades;
create trigger trg_grades_touch before update on public.grades
  for each row execute function public.touch_updated_at();
