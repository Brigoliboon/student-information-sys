# SIMS Entity Relationship Diagram

Source of truth: `database/migration/001_schema.sql`. Regenerate intent, not pixels.

```mermaid
erDiagram
    users ||--o{ course_offerings : teaches
    users }o--o| students : linked_profile
    programs ||--o{ students : has
    courses ||--o{ course_offerings : offered_as
    academic_terms ||--o{ course_offerings : scheduled_in
    students ||--o{ enrollments : takes
    course_offerings ||--o{ enrollments : contains
    enrollments ||--|| grades : graded_by
    users ||--o{ grades : records

    users {
        uuid id PK
        text email UK
        text role
        text status
        uuid student_id FK
    }
    programs {
        uuid id PK
        text code UK
        text name
        text status
    }
    students {
        uuid id PK
        text student_number UK
        text first_name
        text last_name
        text email UK
        uuid program_id FK
        int year_level
        text status
    }
    courses {
        uuid id PK
        text course_code UK
        text title
        numeric units
        text status
    }
    academic_terms {
        uuid id PK
        text school_year
        text semester
        text status
    }
    course_offerings {
        uuid id PK
        uuid course_id FK
        uuid academic_term_id FK
        uuid instructor_id FK
        text section
        int capacity
        text status
    }
    enrollments {
        uuid id PK
        uuid student_id FK
        uuid course_offering_id FK
        text status
    }
    grades {
        uuid id PK
        uuid enrollment_id FK_UK
        numeric grade_value
        text remarks
        uuid graded_by FK
    }
```

Integrity notes:

- `enrollments(student_id, course_offering_id)` is unique — duplicates return 409.
- `grades.enrollment_id` is unique — one grade row per enrollment.
- `students.student_number` and `courses.course_code` are unique.
