# Student Information Management — REST API (backend-only)

Backend-only REST API for a Student Information Management System.
Next.js 16 Route Handlers (`/api/v1`) + Supabase Postgres + Supabase Auth.
No frontend is included (out of scope).

## Tech stack

- Next.js 16 (App Router Route Handlers), React 19, TypeScript
- Supabase: Postgres + Auth (`@supabase/ssr`, `@supabase/supabase-js`)
- RBAC enforced server-side in `services/`; API uses the `service_role` key

## Prerequisites

- Node.js 20+
- A Supabase project (URL + publishable key + service_role key)

## Installation

```bash
npm install
cp .env.example .env.local   # then fill in real values (never commit them)
npm run dev                  # http://localhost:3000
```

## Environment configuration

| Var | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Connect dialog | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Connect dialog | Public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard > Project Settings > API | Server-only DB access (secret) |

## Database setup

Run in Supabase SQL editor, in order (files are tracked, never pushed by automation):

1. `database/migration/001_schema.sql` — tables, FKs, uniques, indexes, `updated_at` triggers
2. `database/migration/002_rls.sql` — default-deny RLS (API accesses via `service_role`)
3. `database/seeds/001_seed.sql` — 5 users*, 3 programs, 100 students, 20 courses,
   2 terms, 20 offerings, 200 enrollments, 100 grades

\*Seed `public.users` rows use placeholder UUIDs. Create the 5 Auth accounts
(admin/registrar/instructor/student1/student2 `@example.edu`) in
Dashboard > Authentication, then update `public.users.id` to the real
`auth.users` ids and re-point `course_offerings.instructor_id` / `grades.graded_by`.

## How to start the API

```bash
npm run dev     # dev
npm run build && npm start   # prod
```

## Authentication

Supabase Auth email/password. Login returns a JWT access token:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.edu","password":"Admin123!"}'
# -> { success, message, data: { session: { access_token, ... } } }

curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

Roles: `administrator` (full), `registrar` (manage academics/enrollments),
`instructor` (grade own offerings), `student` (read own records only —
object-level checks on every nested route).

## API docs

- OpenAPI: `docs/openapi.yaml`
- Postman: `docs/postman/sims_collection.json` + `docs/postman/sims_environment.json`
  (import both; run **Auth/Login** first — it saves `access_token`)
- ERD: `docs/ERD.md`

Response envelope: `{ success, message, data }` or `{ success: false, message, errors }`.
List endpoints accept `?search=&sort=field:asc&page=&per_page=` and return
`meta { page, per_page, total, last_page }`.

## How to run tests

Curl-based (per project scope; no UI test runner):

```bash
BASE_URL=http://localhost:3000 ADMIN_EMAIL=admin@example.edu ADMIN_PASS='...' bash tests/smoke.sh
```

Checklists: `tests/AUTH_TESTCASE.md`, `tests/STUDENTS_TESTCASE.md`,
`tests/ACADEMICS_TESTCASE.md`, `tests/ENROLLMENTS_GRADES_TESTCASE.md`,
`tests/RBAC_TESTCASE.md`, `tests/COLLECTIONS_TESTCASE.md`.

## Test accounts (usernames only — no real credentials)

`admin@example.edu` (administrator) · `registrar@example.edu` (registrar) ·
`instructor@example.edu` (instructor) · `student1@example.edu`, `student2@example.edu` (students).
Set passwords when creating the Auth accounts; link `users.student_id` for the two students (seed SQL does this by student number).

## AI-assisted workflow

Scaffolded and implemented with an AI coding agent (Muse Spark via OpenCode)
under human direction: schema reviewed against `REQUIREMENTS.md`, Supabase SSR
+ Next 16 `proxy.ts` patterns verified against current official docs, then
`tsc` + `eslint` + `next build` + live 401/400 curl checks. Every file was
read back and can be explained or modified on request.
