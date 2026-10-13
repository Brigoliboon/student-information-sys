# Demo Recording — Test Cases (ffmpeg + Playwright, per-role interactive demo)

## Prerequisites
- [ ] D1: `ffmpeg` present (`ffmpeg -version` ok), node 18+
- [ ] D2: `DEMO_PASSWORD` set to seeded account password; never committed
- [ ] D3: Dev server boots on `$PORT` and `/login` returns 200
- [ ] D4: `npx playwright install chromium` succeeds (first run downloads browser)

## Recording (`bash demo/run.sh`)
- [ ] D5: `demo/out/manifest.txt` lists scenes in order: public, admin, registrar, instructor, student
- [ ] D6: `demo/out/raw/<scene>.webm` exists for every manifest entry (1600x900)
- [ ] D7: Console shows `ok:` for core steps (login per role, creates, enroll, grade); failures log as `SKIP:` and never abort the run
- [ ] D8: Unique `TAG` suffix used for program/course/student creates (re-runs never collide)
- [ ] D9: `SCENES=admin,student bash demo/run.sh` records only the requested subset

## Required-action coverage (REQUIREMENTS.md §20)
- [ ] D10: public — unauthenticated `/dashboard` redirects to `/login`; landing `#docs` shown
- [ ] D11: admin — users browsed; program created; duplicate student rejected (alert); valid student created; search/filter applied
- [ ] D12: admin — course + term created; enrollment created; duplicate enrollment rejected; grades opened; 404 shown
- [ ] D13: registrar — student search + pagination exercised; offering created; `/users` redirects to `/dashboard`
- [ ] D14: instructor — offerings + enrollments browsed; grade recorded; `/users` redirects to `/dashboard`
- [ ] D15: student — lands on own `/students/<id>` with academic record; `/users` and foreign student id redirect to `/dashboard`
- [ ] D16: Every scene ends with Sign out back at `/login`

## Final cut (ffmpeg)
- [ ] D17: `demo/sims-demo.mp4` exists, 1920x1080, yuv420p, plays in VLC/Chrome
- [ ] D18: Scene order in final cut matches manifest; title cards present when a TTF font is available
- [ ] D19: No passwords, tokens, or service keys audible/visible in the video
