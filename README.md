# IT Help Desk for Multi-Hotel Operations

A full-stack IT helpdesk system for hotel groups. The system helps hotel staff report IT issues quickly, gives IT teams a clear work queue, and provides managers with operational dashboards and reports across one hotel or multiple properties.

The current product focuses on a lightweight, repeatable daily workflow:

- Staff can submit a ticket in about 30-60 seconds.
- IT teams can work from prioritized queues such as overdue, due soon, unassigned, and assigned to me.
- Managers can monitor KPIs, SLA risk, reports, assets, users, departments, and problem types.
- Notifications update in near realtime through Server-Sent Events (SSE), with polling as a fallback.
- Core workflows support a lightweight Thai/English language toggle without adding an i18n dependency.

## Tech Stack

Frontend:

- React 19
- Vite
- Tailwind CSS
- Axios
- Lucide React
- React Hot Toast
- Recharts

Backend:

- Node.js
- Express 5
- MongoDB
- Mongoose
- JWT authentication
- bcryptjs
- multer
- helmet
- express-rate-limit
- express-validator
- express-mongo-sanitize

## Core Features

### Helpdesk Workflow

- Guided Add Ticket form with quick category suggestions, priority guidance, and a clear submitting state
- Work Queue ticket list with tabs for:
  - Do now
  - Overdue
  - Due soon
  - Unassigned
  - Assigned to me
  - Waiting requester
  - All
- Ticket detail modal with comments, activity log, assignment, status updates, priority updates, protected attachment viewing, and requester satisfaction feedback
- Closed tickets are protected from accidental edits. Assignment, status, priority, and due date controls are disabled in the queue drawer, and the backend rejects direct edits with HTTP 409.
- Closed tickets can be reopened through a dedicated Reopen action instead of the normal status dropdown. Reopen is available to the requester/creator, Manager, and Admin-level ticket managers.
- Problem Types management so Add Ticket categories are controlled by admins
- Department management for cleaner ticket ownership and reporting

### Realtime Notifications

- Notification bell backed by MongoDB as the source of truth
- SSE endpoint: `GET /api/notifications/stream`
- JWT Bearer authentication for the stream
- Events:
  - `notification:new`
  - `notification:sync`
  - `heartbeat`
- Client uses `fetch()` streaming instead of native `EventSource` so the JWT can stay in the `Authorization` header
- Polling fallback remains active at a lower frequency

Current realtime hub is in-memory. It works well for a single server instance. For multiple backend instances, move notification fan-out to Redis pub/sub or a managed realtime service.

### Dashboards And Reports

- Dashboard KPIs for tickets, open, resolved, SLA risk, average open days, success rate, urgent/unassigned, escalation queue, status mix, weekly trend, and severity
- Monthly report for selected month performance
- Quarterly / yearly report for longer-term trends
- Scoped hotel selector for users with cross-hotel access

### Multi-Hotel Access

- Hotel-aware users, tickets, assets, departments, problem types, dashboard data, and report data
- Group-level users can view all authorized hotels or filter to one hotel
- Hotel-level users are scoped to their authorized hotel data

### Language And UX

- Thai is the default language for core staff workflows
- English can be selected from the header with a lightweight `TH / EN` toggle
- Language preference is stored in `localStorage`
- Translation dictionary is plain JavaScript; no extra package is required
- Core translated workflows:
  - Sidebar and page titles
  - Add Ticket
  - Work Queue / Ticket List
  - Ticket Detail comments and actions
  - Notification labels

### Security And Operations

- JWT-protected feature routes
- Role-based access control
- Production CORS restrictions
- Helmet security headers
- Auth and password-change rate limits
- NoSQL key sanitization for body, params, and query
- Password hashing with bcrypt
- Password-change invalidation through `passwordChangedAt`
- Structured audit logs for important hotel, user, ticket, and asset changes
- Production-safe error responses
- Attachment upload disabled by default in production unless explicitly enabled

## Project Structure

```txt
helpdesk-react-node/
|-- client/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- i18n/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   `-- index.css
|   |-- package.json
|   `-- vite.config.js
|-- server/
|   |-- constants/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- scripts/
|   |-- services/
|   |-- tests/
|   |-- uploads/
|   |-- utils/
|   |-- validators/
|   |-- index.js
|   `-- package.json
|-- docs/
|-- tmp/
|-- .gitignore
`-- README.md
```

## Getting Started

This repository does not use a root `package.json`. Install and run the client and server separately.

### 1. Clone

```bash
git clone https://github.com/thefactgu-ship-it/helpdesk-react-node-mongodb.git
cd helpdesk-react-node-mongodb
```

### 2. Server Setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/helpdesk_db
JWT_SECRET=replace_with_at_least_32_random_characters
CORS_ORIGIN=http://localhost:5173
ATTACHMENT_STORAGE_PROVIDER=local
ALLOW_PUBLIC_REGISTRATION=true

ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=replace_with_a_strong_password
ADMIN_NAME=System Admin

DEFAULT_HOTEL_CODE=THG
DEFAULT_HOTEL_NAME=Thavorn Hotels Group
DEFAULT_HOTEL_REGION=Phuket
DEFAULT_HOTEL_TIMEZONE=Asia/Bangkok
```

Run the server:

```bash
npm run dev
```

Health checks:

```txt
http://localhost:5000
http://localhost:5000/healthz
http://localhost:5000/readyz
```

### 3. Client Setup

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Frontend:

```txt
http://localhost:5173
```

The frontend defaults to:

```txt
http://localhost:5000/api
```

To override it, create a client environment variable:

```env
VITE_API_URL=http://localhost:5000/api
VITE_ATTACHMENTS_ENABLED=true
```

## Useful Commands

Client:

```bash
cd client
npm run dev
npm run lint
npm run build
npm run preview
```

Server:

```bash
cd server
npm run dev
npm start
npm run test
npm run check:syntax
npm run db:fix-problem-type-indexes
```

## Roles And Access

- `GroupAdmin`: full cross-hotel management and dashboard visibility
- `HotelAdmin`: can manage users, departments, assets, problem types, and ticket workflow for hotels in `hotelAccess`
- `Manager`: can manage ticket queues, assign work, and update ticket workflow for hotels in `hotelAccess`
- `Agent`: can work on assigned tickets and tickets they created
- `User`: can create tickets, view their own or assigned tickets, add comments, submit satisfaction feedback, and reopen their own closed tickets

`Admin` and `RegionalManager` are legacy roles kept for existing data compatibility. They are hidden from new user creation and should be migrated to `GroupAdmin`, `HotelAdmin`, or `Manager` when possible.

Ticket visibility is permission-limited on the backend. Frontend filters are convenience controls only.

Closed ticket rules are enforced on the backend:

- `PATCH /api/tickets/:id`, `PATCH /api/tickets/:id/status`, and `PATCH /api/tickets/:id/assign` reject edits to closed tickets.
- `PATCH /api/tickets/:id/reopen` is the intentional path for reopening.
- Reopened tickets return to `in_progress` when they still have an assignee, or `open` when unassigned.
- Reopen events are written to audit logs as `ticket.reopened`.

## API Overview

Protected routes require:

```txt
Authorization: Bearer YOUR_JWT_TOKEN
```

### Auth

```txt
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/auth/me
PATCH  /api/auth/me/password
GET    /api/auth/users
POST   /api/auth/users
PATCH  /api/auth/users/:id
DELETE /api/auth/users/:id
```

Public registration is disabled by default in production unless `ALLOW_PUBLIC_REGISTRATION=true`.

### Hotels

```txt
GET    /api/hotels
POST   /api/hotels
PATCH  /api/hotels/:id
DELETE /api/hotels/:id
```

### Departments

```txt
GET    /api/departments
POST   /api/departments
PATCH  /api/departments/:id
DELETE /api/departments/:id
```

### Tickets

```txt
GET    /api/tickets
GET    /api/tickets/summary
GET    /api/tickets/insights
GET    /api/tickets/:id
POST   /api/tickets
PATCH  /api/tickets/:id
PATCH  /api/tickets/:id/status
PATCH  /api/tickets/:id/reopen
PATCH  /api/tickets/:id/assign
POST   /api/tickets/:id/comment
PATCH  /api/tickets/:id/satisfaction
POST   /api/tickets/:id/attachments
GET    /api/tickets/:id/attachments/:attachmentId/view
DELETE /api/tickets/:id
```

### Notifications

```txt
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
GET    /api/notifications/stream
```

The stream endpoint returns `text/event-stream` and uses JWT Bearer auth.

### Assets

```txt
GET    /api/assets
POST   /api/assets
PATCH  /api/assets/:id
DELETE /api/assets/:id
```

### Problem Types

```txt
GET    /api/problem-types
POST   /api/problem-types
DELETE /api/problem-types/:id
```

## Deployment Notes

### Backend On Render

- Root directory: `server`
- Build command: `npm install` or `npm ci`
- Start command: `npm start`
- Health check path: `/healthz`
- Required environment variables:
  - `NODE_ENV=production`
  - `PORT`
  - `MONGO_URI`
  - `JWT_SECRET`
  - `CORS_ORIGIN=https://your-frontend-domain`
  - `ADMIN_PASSWORD`
- Recommended environment variables:
  - `ADMIN_EMAIL`
  - `ADMIN_NAME`
  - `ATTACHMENT_STORAGE_PROVIDER=disabled`

Production requires a strong `JWT_SECRET` and an `ADMIN_PASSWORD` of at least 12 characters.

### Frontend Static Site

- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Required environment variable:
  - `VITE_API_URL=https://your-backend-domain/api`
- Optional environment variable:
  - `VITE_ATTACHMENTS_ENABLED=true`

## Production Database Maintenance

For existing MongoDB Atlas databases, run the Problem Type index repair script once after deploying the current backend:

```bash
cd server
MONGO_URI="your-atlas-uri" npm run db:fix-problem-type-indexes
```

The script checks duplicate problem type names, ensures the unique `{ name: 1 }` index, and removes the legacy unique `{ hotelId: 1, name: 1 }` index if it exists.

## Production Smoke Test

After each deployment:

1. Open `/healthz` and confirm HTTP 200.
2. Open `/readyz` and confirm database readiness.
3. Log in with the seeded admin account.
4. Verify at least one hotel, department, user, and problem type.
5. Create a ticket from Add Ticket.
6. Assign it from Work Queue.
7. Update status and add a comment.
8. Resolve and close the ticket through requester confirmation.
9. Confirm closed ticket controls are disabled, then reopen the ticket from the dedicated Reopen action.
10. Confirm another user receives a notification without waiting for long polling.
11. Check Dashboard, Monthly Report, and Quarterly / Yearly views.
12. Toggle TH/EN and refresh to confirm the language preference is remembered.

## Validation Status

Latest local checks:

- `client`: `npm run lint`
- `client`: `npm run build`
- `server`: `npm run test`
- `server`: `npm run check:syntax`

## Notes For Future Scaling

- SSE notifications currently use an in-memory hub. Use Redis pub/sub or a managed realtime provider before running multiple backend instances.
- MongoDB remains the source of truth for notification history and unread counts.
- The language system intentionally translates only core workflows first. Admin/report pages can be added to the same plain JavaScript dictionary later.
- Attachment storage is local in development and disabled by default in production. Use comments for normal follow-up details unless file uploads are intentionally enabled.

## Author

Created by Manasak Srisuk.

## License

This project is for educational and portfolio purposes.
