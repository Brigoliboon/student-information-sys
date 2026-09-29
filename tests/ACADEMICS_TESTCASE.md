# Academics test cases (programs, courses, terms, offerings)

- [ ] C1: Create program returns 201; duplicate `code` returns 409
- [ ] C2: Create course returns 201; duplicate `course_code` returns 409
- [ ] C3: Create academic term returns 201; bad `semester` returns 422
- [ ] C4: Create offering with bad `course_id` returns 422
- [ ] C5: Create offering with bad `academic_term_id` returns 422
- [ ] C6: `GET /course-offerings/{id}` embeds course + term
- [ ] C7: `GET /course-offerings/{id}/students` lists enrolled students
- [ ] C8: Unknown program/course/term/offering id returns 404
- [ ] C9: Delete program returns 204
