# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

IT Help Desk — React 19 + Vite frontend (`client/`), Express 5 + MongoDB backend (`server/`).

## Installed skills

### React best practices

When writing, reviewing, or refactoring React code in `client/`, follow:

`.agents/skills/react-best-practices/SKILL.md`

For the full rule set (70 rules), read:

`.agents/skills/react-best-practices/AGENTS.md`

Individual rules live under `.agents/skills/react-best-practices/rules/`.

**When to apply:** new components, auth flows, data fetching, bundle size, re-render optimization, and performance reviews.

**Source:** copied from `agent-skills-main/skills/react-best-practices` (Vercel Engineering).

## Auth notes

- Password login: `POST /api/auth/login`
- Google login: `POST /api/auth/google` with `{ credential }` (Google ID token)
- Frontend Google button: `client/src/components/LoginPage.jsx` (loads GIS script on demand)
- Backend verification: `server/controllers/authController.js`
- Env: `GOOGLE_CLIENT_ID` (server), `VITE_GOOGLE_CLIENT_ID` (client), optional `GOOGLE_ALLOWED_EMAIL_DOMAIN`, `GOOGLE_AUTO_CREATE`
