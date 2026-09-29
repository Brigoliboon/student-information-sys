# Enrollments + grades + academic record test cases

- [ ] C1: Valid enrollment returns 201
- [ ] C2: Duplicate enrollment (same student + offering) returns 409
- [ ] C3: Enrollment with unknown `student_id` returns 422
- [ ] C4: Enrollment with unknown `course_offering_id` returns 422
- [ ] C5: `GET /students/{id}/enrollments` returns the student's rows
- [ ] C6: Valid grade (`POST /grades`) returns 201
- [ ] C7: Second grade for same enrollment returns 409
- [ ] C8: Grade for unknown enrollment returns 422
- [ ] C9: Grade value 0.5 or 6.0 returns 422
- [ ] C10: `PATCH /grades/{id}` updates value, returns 200
- [ ] C11: `GET /students/{id}/grades` returns grade rows
- [ ] C12: `GET /students/{id}/academic-record` groups rows by term with `total_units`
