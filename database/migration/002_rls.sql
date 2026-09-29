-- 002_rls.sql — lock tables to the API service_role key.
-- The Next.js API enforces RBAC in services/ and talks to Postgres with
-- SUPABASE_SERVICE_ROLE_KEY. Enabling RLS with no permissive policies means
-- anon/authenticated keys cannot read or write directly; all access flows
-- through the API. Run after 001_schema.sql.

alter table public.users enable row level security;
alter table public.programs enable row level security;
alter table public.students enable row level security;
alter table public.courses enable row level security;
alter table public.academic_terms enable row level security;
alter table public.course_offerings enable row level security;
alter table public.enrollments enable row level security;
alter table public.grades enable row level security;

-- No CREATE POLICY statements on purpose: default-deny for anon/authenticated.
-- service_role bypasses RLS, so the API keeps working.
