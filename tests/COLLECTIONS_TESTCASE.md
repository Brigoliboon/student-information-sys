# Collections test cases (search / filter / sort / pagination)

- [ ] C1: `?search=` matches student number, first/last name, email
- [ ] C2: `?program_id=` + `?status=` + `?year_level=` filter correctly
- [ ] C3: `?sort=last_name:asc` orders ascending; `:desc` orders descending
- [ ] C4: `?page=&per_page=` returns `meta {page, per_page, total, last_page}`
- [ ] C5: `per_page` above 100 is capped at 100
- [ ] C6: `/courses?search=CS` matches code/title
- [ ] C7: `/enrollments?student_id=` + `?status=` filter correctly
