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
- Palette: off-white/slate background, white soft surfaces, indigo/trust-blue primary, rose/amber/emerald status accents.
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

## Dependency Policy
- Keep Tailwind, lucide-react, and Recharts as the primary UI stack.
- Prefer local primitives before adding a UI library.
- Consider small helper dependencies only if they clearly reduce weight or duplication, such as class composition helpers.
- Avoid heavy component libraries that would duplicate the existing app shell and styling.
