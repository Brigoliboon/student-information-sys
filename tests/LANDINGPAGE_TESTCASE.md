# Landing page test cases (`/(public)`)

Manual + `npm run build` must pass.

- [ ] C1: `/` renders Header (logo, Features/Roles/API Docs anchors, Sign in → `/login`)
- [ ] C2: Hero shows headline, subcopy, both CTAs, and the 3 stat figures
- [ ] C3: Features section renders 4 cards with icons
- [ ] C4: Roles section renders all 4 roles with correct access blurbs
- [ ] C5: Docs section shows OpenAPI/Postman references and the curl example
- [ ] C6: Footer renders tagline
- [ ] C7: Light and dark mode both readable (no invisible text)
- [ ] C8: Mobile: nav collapses, CTAs stack, grids go single-column
- [ ] C9: No console errors; `npm run lint` clean
- [ ] C10: Unauthenticated visit to any future `/(authenticated)` page redirects to `/login`
