# UI Card Redesign — Test Cases (light mode, no tables)

## Theme
- [ ] C1: No dark mode — all pages render on light background `#f6f7f9` with white cards, no `dark:` classes remain in app/components
- [ ] C2: `npm run lint` passes with zero errors
- [ ] C3: `npm run build` succeeds, all routes compile

## Navigation
- [ ] C4: Sidebar is light (white bg, indigo active pill), shows profile card + sign out
- [ ] C5: Mobile top nav (pill links) appears below `md` breakpoint
- [ ] C6: Role filtering still works (student sees My Record + Dashboard only; admin sees Users)

## List pages (students, programs, courses, terms, offerings, enrollments, grades, users)
- [ ] C7: No `<table>` element on any list page — card grid only
- [ ] C8: Filter bar renders as a white card with search icon, Apply button, Clear link
- [ ] C9: Cards show icon/avatar + title + status Badge + navigation affordance (chevron / View details)
- [ ] C10: Empty state (dashed card + icon + message) shows when zero results
- [ ] C11: Pagination renders centered pill controls; hidden when single page
- [ ] C12: Create actions open a modal Dialog (not `<details>`), Escape/backdrop closes it, form submits via API

## Detail pages
- [ ] C13: Each detail page has back pill, PageHeader with Edit modal action (where permitted)
- [ ] C14: Student detail shows profile card (avatar, badges, contact tiles) + academic record cards per term
- [ ] C15: Offering detail shows schedule/capacity/status cards + roster as avatar cards (no table)
- [ ] C16: Enrollment detail shows student card + section card + grade card
- [ ] C17: Grade detail shows big grade value panel + remarks badge

## Dashboard
- [ ] C18: Staff view shows gradient welcome banner + 4 stat cards + quick-action buttons + navigation cards
- [ ] C19: Student view shows welcome banner + 3 stat cards, links to own record

## Dialogs / Buttons
- [ ] C20: Dialog traps Escape, locks body scroll, restores on close
- [ ] C21: Buttons have consistent pill shape + variants (primary white-on-indigo, secondary, ghost)
