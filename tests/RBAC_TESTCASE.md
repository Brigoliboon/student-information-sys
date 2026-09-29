# RBAC test cases (roles + object-level)

Accounts: admin / registrar / instructor / student1 / student2 (seed users).

- [ ] C1: Admin can list `/users` (200)
- [ ] C2: Student `GET /users` returns 403
- [ ] C3: Student `POST /students` returns 403
- [ ] C4: Instructor `POST /students` returns 403
- [ ] C5: Student can `GET /students/{own}` (200) via linked `users.student_id`
- [ ] C6: Student `GET /students/{other}` returns 403 (object-level)
- [ ] C7: Student `GET /students/{own}/grades` works; `/{other}/grades` returns 403
- [ ] C8: Instructor `POST /grades` for own offering enrollment returns 201
- [ ] C9: Instructor `POST /grades` for another instructor's offering returns 403
- [ ] C10: Registrar can create student/program/course/enrollment (201s)
- [ ] C11: Unauthenticated `GET /students` returns 401
- [ ] C12: Error bodies never contain `password` or stack traces
