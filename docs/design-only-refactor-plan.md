# Design-Only Refactor Plan

## Goal
Refresh the full Helpdesk UI into a soft operations console while preserving the existing product flow.

## Non-Negotiable Guardrails
- Do not change API calls, request payloads, response handling, or service files.
- Do not change route names, navigation flow, role logic, permissions, or ticket actions.
- Do not change validation rules, database schema, auth, or backend behavior.
- Do not rename existing public props unless the call sites are presentation-only and updated together.
- UI libraries may be added only when they reduce repeated presentation code and do not add heavy runtime cost.

## Target Visual Direction
- Soft Operations Console: demo-like softness with hotel operations clarity.
- Palette: deep violet ops shell, off-white/slate background, white soft glass surfaces, purple primary actions, rose/amber/emerald status accents.
- Typography: Inter, Noto Sans Thai, system fallback.
- Shapes: 8-12px radius for work surfaces, tighter density for operational pages.
- Effects: subtle borders and light shadows, no heavy card nesting.

## Execution Phases
1. Design tokens and UI primitives.
2. App shell, sidebar, header, and mobile navigation.
3. Role dashboards and analytics.
4. Ticket queue, table rows, mobile cards, drawer, and action menu.
5. Add ticket form and ticket detail modal.
6. Admin, reporting, asset, audit, hotel, department, and user pages.
7. Remove stale presentation code and verify bundle, lint, build, dark mode, and mobile.

## Polish Roadmap
1. Dashboard + Work Queue:
   - Reduce repeated purple surfaces by using neutral glass for inactive/zero states.
   - Add KPI hierarchy so non-zero operational signals stand out without animation.
   - Use status accents intentionally: emerald for healthy/assigned, amber for due soon, rose for overdue/critical, purple for primary workflow only.
   - Add quiet row/card contrast for ticket lists through thin accents, hover states, and clearer selected/active states.
2. Reports:
   - Balance purple charts with emerald/amber/rose data series where the metric meaning supports it.
   - Keep cards neutral and reserve purple for selected controls and primary chart lines.
   - Prefer meaningful series color: emerald for closed/healthy, amber for assigned/due-soon, rose for risk/destructive, slate for neutral active volume.
3. Management pages:
   - Keep CRUD surfaces mostly neutral and use color for state, risk, and destructive actions.
   - Vary empty states by page context while preserving shared structure.
   - Keep identifiers and metadata neutral or amber/emerald by domain, instead of repeating purple on every code, email, and badge.
4. Drawer/modal polish:
   - Group detail fields tighter, keep action footer sticky, and use status color for key decision points.

## Dependency Policy
- Keep Tailwind, lucide-react, and Recharts as the primary UI stack.
- Prefer local primitives before adding a UI library.
- Consider small helper dependencies only if they clearly reduce weight or duplication, such as class composition helpers.
- Avoid heavy component libraries that would duplicate the existing app shell and styling.
