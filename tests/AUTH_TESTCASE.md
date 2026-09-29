# Auth test cases (`POST /auth/login`, `POST /auth/logout`, `GET /auth/me`)

Run: `BASE_URL=http://localhost:3000 bash tests/smoke.sh` (auth section).

- [ ] C1: Valid login returns 201 with `session.access_token` (admin@example.edu)
- [ ] C2: Invalid password returns 401 `Invalid credentials`
- [ ] C3: Missing email/password returns 400
- [ ] C4: `GET /auth/me` with Bearer token returns 200 current profile
- [ ] C5: `GET /auth/me` without token returns 401
- [ ] C6: `GET /auth/me` with garbage token returns 401
- [ ] C7: `POST /auth/logout` with token returns 200; token no longer works for `/auth/me`
- [ ] C8: `/auth/me` response contains no password/hash field
