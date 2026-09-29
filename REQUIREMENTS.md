# Student Information Management REST API — Requirements Checklist

## 🎯 Goal
Design, build, secure, test, and document a **backend-only REST API** for a Student Information Management System, using AI assistance responsibly (you must be able to explain and modify every part of the code).

---

## 🧩 Core Domain Modules
- [ ] Authentication (login, logout/token invalidation, current user)
- [ ] Users & Roles (accounts, roles, status, authorization rules)
- [ ] Students (profile, student number, program, year level, status, contact info)
- [ ] Programs (code, name, description, status)
- [ ] Courses (code, title, units, description, status)
- [ ] Academic Terms (year, semester, dates, status)
- [ ] Course Offerings (course, term, instructor, section, schedule, capacity, status)
- [ ] Enrollments (student ↔ course offering, status)
- [ ] Grades (linked to enrollment, remarks/status)
- [ ] Academic Record (aggregated per student, grouped by term)

## 👥 Roles
- [ ] Administrator — full access to all resources
- [ ] Registrar / Staff — manage students, programs, courses, enrollments
- [ ] Instructor — view assigned offerings, manage grades for their enrollments
- [ ] Student — view only their own profile, enrollments, grades

---

## 🗄️ Database Requirements
- [ ] Relational DB (PostgreSQL, MySQL, MariaDB, SQL Server, or SQLite)
- [ ] Migrations/schema files (reproducible on another machine)
- [ ] Correct relationships:
  - [ ] Program → many Students
  - [ ] Course → many Course Offerings
  - [ ] Academic Term → many Course Offerings
  - [ ] Instructor → many Course Offerings
  - [ ] Student → many Enrollments
  - [ ] Course Offering → many Enrollments
  - [ ] Enrollment → one Grade record
- [ ] `student_number` unique
- [ ] `course_code` unique
- [ ] Valid foreign key constraints
- [ ] Duplicate enrollment prevention
- [ ] Indexes on frequently searched columns
- [ ] Seed data / seeders (not manually inserted):
  - [ ] 5 Users
  - [ ] 3 Programs
  - [ ] 100 Students
  - [ ] 20 Courses
  - [ ] 2 Academic Terms
  - [ ] 20 Course Offerings
  - [ ] 200 Enrollments
  - [ ] 100 Grades

---

## 🌐 REST API Design
- [ ] Versioned base path (e.g. `/api/v1`)
- [ ] Resource-oriented, noun-based URLs (no `/getStudents`-style RPC endpoints)
- [ ] Correct HTTP methods (GET/POST/PUT/PATCH/DELETE) per operation
- [ ] Correct HTTP status codes: 200, 201, 204, 400, 401, 403, 404, 409, 422, 500
- [ ] Consistent JSON success/error response format (`success`, `message`, `data`/`errors`)

### Required Endpoint Groups
- [ ] `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- [ ] `/students` (GET, POST, GET/{id}, PUT/PATCH/{id}, DELETE/{id})
- [ ] `/programs` (full CRUD)
- [ ] `/courses` (full CRUD)
- [ ] `/academic-terms` (full CRUD)
- [ ] `/course-offerings` (full CRUD)
- [ ] `/enrollments` (GET, POST, GET/PATCH/DELETE/{id}) + `/students/{id}/enrollments` + `/course-offerings/{id}/students`
- [ ] `/grades` (GET, POST, GET/PUT/PATCH/{id}) + `/students/{id}/grades`
- [ ] `/students/{id}/academic-record`

---

## ✅ Validation
- [ ] `student_number` required & unique
- [ ] `first_name`/`last_name` required
- [ ] Valid email format when supplied
- [ ] Foreign key references validated (`program_id`, `course_id`, `academic_term_id`, `instructor_id`, `student_id`, `course_offering_id`)
- [ ] Restricted/enum values (year level, status, grade values)
- [ ] All validation enforced server-side

## 🔍 Search / Filter / Sort / Pagination
- [ ] Search (e.g. `?search=`)
- [ ] Filtering (e.g. `?program_id=&year_level=&status=`)
- [ ] Sorting (e.g. `?sort=`)
- [ ] Pagination (`?page=&per_page=`) with metadata (current page, page size, total records, last page)

---

## 🔐 Security
- [ ] Passwords hashed (framework-supported hashing mechanism)
- [ ] Protected routes require valid session/token
- [ ] Current-user endpoint implemented
- [ ] Logout/token invalidation implemented
- [ ] Role-based authorization enforced
- [ ] **Object-level authorization** enforced (e.g., student can't access another student's record via URL ID)
- [ ] Secrets via environment variables (never committed)
- [ ] Parameterized queries / ORM safeguards (no SQL injection)
- [ ] No raw DB errors/stack traces exposed in responses
- [ ] No password hashes or sensitive fields returned in API responses
- [ ] CORS configured deliberately
- [ ] Operational logs exclude passwords/tokens

---

## 🧪 Testing
- [ ] Authentication: valid login, invalid password, missing/invalid auth
- [ ] Students: create, retrieve, update, duplicate student number, invalid email, not found
- [ ] Authorization: permitted admin action, forbidden student/instructor actions, object-level access control
- [ ] Enrollment: valid enrollment, invalid references, duplicate prevention
- [ ] Grades: valid grade, invalid enrollment, unauthorized modification
- [ ] Collections: search, filtering, sorting, pagination behavior
- [ ] Automated test suite present (Pest/PHPUnit, Jest/Vitest, Pytest, JUnit, xUnit, Go testing, etc.)

---

## 📚 Documentation & Reproducibility
- [ ] OpenAPI/Swagger docs (or equivalent) covering: path/method, description, auth requirement, parameters, request/response schemas + examples, error examples, status codes
- [ ] `.env.example` (safe, no real secrets)
- [ ] ERD (Entity Relationship Diagram)
- [ ] README.md including:
  - [ ] Project title & description
  - [ ] Tech stack
  - [ ] Prerequisites
  - [ ] Installation instructions
  - [ ] Environment configuration
  - [ ] Database setup
  - [ ] Migration instructions
  - [ ] Seeder instructions
  - [ ] How to start the API
  - [ ] Authentication instructions
  - [ ] API doc location
  - [ ] How to run tests
  - [ ] Test accounts (without real credentials)
  - [ ] Summary of AI tool usage & verification process
- [ ] API client collection (Postman/Insomnia/Bruno) organized by resource group, with success + failure examples

---

## 🎬 Final Demonstration (20 Required Actions)
1. [ ] Start API & connect to database
2. [ ] Authenticate successfully
3. [ ] Show protected endpoint rejecting unauthenticated request
4. [ ] Create a program
5. [ ] Create a valid student
6. [ ] Show validation rejecting invalid/duplicate student
7. [ ] Retrieve and update a student
8. [ ] Search and filter students
9. [ ] Show pagination and sorting
10. [ ] Create a course and academic term
11. [ ] Create a course offering
12. [ ] Enroll a student
13. [ ] Handle duplicate enrollment correctly
14. [ ] Add/update an authorized grade
15. [ ] Retrieve a student academic record
16. [ ] Show forbidden request for unauthorized role
17. [ ] Show a 404/not-found case
18. [ ] Display API documentation
19. [ ] Run/show automated test results
20. [ ] Explain one AI-assisted code contribution

---

## 📦 Final Deliverables Checklist
- [ ] Complete backend source code
- [ ] Database migration/schema files
- [ ] Seeders/fixtures/factories
- [ ] Safe `.env.example`
- [ ] ERD
- [ ] OpenAPI/Swagger documentation
- [ ] API client collection (Postman/Insomnia/Bruno)
- [ ] Automated test suite / test evidence
- [ ] README.md (full content per above)
- [ ] Git repository with meaningful commit history
- [ ] Short technical write-up (architecture, design decisions, security approach, AI-assisted workflow)

---

## 🚦 Final Submission Checklist
- [ ] Backend source code runs successfully
- [ ] No frontend included (not required)
- [ ] DB schema/migrations + seed data included
- [ ] Authentication & authorization functional
- [ ] All required resource & academic transaction endpoints implemented
- [ ] Search, filtering, sorting, pagination work
- [ ] Validation & error handling consistent
- [ ] Secrets excluded from repository
- [ ] README & API docs complete
- [ ] API client collection included
- [ ] Tests executed with evidence available
- [ ] AI-assisted contributions reviewed and can be explained

---

## ⚠️ Critical Deficiencies to Avoid
- No working REST API
- No real database integration
- No authentication
- Plaintext passwords
- Missing server-side authorization
- Static/hardcoded API data
- No validation
- No API demonstration
- Inability to explain AI-generated code

---

## 📊 Grading Rubric (100 pts total)
| Criterion | Points |
|---|---|
| REST API design & HTTP usage | 15 |
| Database design, relationships, migrations, integrity | 15 |
| Core CRUD & academic transaction functionality | 15 |
| Authentication & authorization | 15 |
| Validation & error handling | 10 |
| Search, filtering, sorting, pagination | 10 |
| API documentation & reproducibility | 5 |
| Testing & reliability | 5 |
| Code organization & maintainability | 5 |
| Technical demonstration, AI accountability, understanding | 5 |
