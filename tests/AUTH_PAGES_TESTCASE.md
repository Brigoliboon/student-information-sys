# Auth pages test cases (`/login`, guard, sidebar)

- [ ] C1: Logged-out visit to `/login` shows the form
- [ ] C2: Wrong credentials show inline error, no redirect
- [ ] C3: Valid login redirects to `/dashboard`; session persists on refresh
- [ ] C4: Logged-in visit to `/login` redirects to `/dashboard`
- [ ] C5: Logged-out visit to `/dashboard` or `/students` redirects to `/login`
- [ ] C6: Sidebar shows links per role (Users only for admin; My Record for students)
- [ ] C7: Sign out returns to `/login`; back-button doesn't restore the session
- [ ] C8: Submit button shows loading state while signing in
