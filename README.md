# IT Help Desk System

A full-stack IT Help Desk System for multi-hotel operations, built with React, Vite, Tailwind CSS, Node.js, Express, MongoDB, Mongoose, and JWT authentication.

The app supports helpdesk ticket workflows, dashboard analytics, reports, asset tracking, user management, requester review, problem type management, protected ticket comments and attachments, self-service profile updates, and production-focused security hardening.

## Features

- Multi-hotel tenant scoping with hotel-aware users, tickets, assets, problem types, and dashboard filtering
- Dashboard KPIs, charts, status summary, severity, category, and open-day analysis from scoped ticket data
- Permission-limited Helpdesk Tickets table with search, filter, pagination, detail modal, assignment, status updates, comments, activity log, and protected image attachments
- Add Ticket form with role-aware assignment and issue categories loaded from backend Problem Types
- Monthly, quarterly, and yearly reports using all ticket data for authenticated users
- Asset Management with lifecycle fields, age calculation, recommendation status, detail modal, and admin-only create/edit/delete
- User Management with admin-only create/edit/delete and password-safe user listing
- Self-service Profile page for all users with profile update and current-password-protected password change
- Sidebar user-card menu for Update Profile, Change Password, and Logout
- Problem Types page with admin-only create/delete and Add Ticket integration
- JWT authentication, role-based access, CORS restrictions, Helmet headers, NoSQL key sanitization, rate limiting, and protected uploads
- Lazy-loaded pages for smaller production chunks

## Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- Axios
- React Hot Toast
- Recharts

Backend:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- multer
- helmet
- express-rate-limit
- express-validator
- express-mongo-sanitize

## Project Structure

```txt
helpdesk-react-node-mongodb/
|-- client/
|   |-- src/
|   |   |-- components/
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
|   |-- uploads/
|   |-- utils/
|   |-- validators/
|   |-- index.js
|   `-- package.json
|-- .gitignore
`-- README.md
```

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/thefactgu-ship-it/helpdesk-react-node-mongodb.git
cd helpdesk-react-node-mongodb
```

### 2. Backend Setup

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

ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=replace_with_a_strong_password
ADMIN_NAME=System Admin
```

Run the backend:

```bash
npm run dev
```

API health check:

```txt
http://localhost:5000
```

Expected response:

```json
{"message":"HelpDesk API Running","status":"ok"}
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

Frontend URL:

```txt
http://localhost:5173
```

For local frontend API calls, `client/src/services/api.js` falls back to:

```txt
http://localhost:5000/api
```

## Render Deployment

Backend service:

- Root directory: `server`
- Build command: `npm install` or `npm ci`
- Start command: `npm start`
- Required environment variables:
  - `NODE_ENV=production`
  - `PORT`
  - `MONGO_URI`
  - `JWT_SECRET`
  - `CORS_ORIGIN=https://your-frontend.onrender.com`
  - `ADMIN_PASSWORD` with at least 12 characters
  - `ATTACHMENT_STORAGE_PROVIDER=local` for development-style disk storage or `s3` for object storage
- Optional admin seed variables:
  - `ADMIN_EMAIL`
  - `ADMIN_NAME`
  - `S3_ENDPOINT`
  - `S3_BUCKET`
  - `S3_REGION`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`

Frontend static site:

- Root directory: `client`
- Build command: `npm install && npm run build` or `npm ci && npm run build`
- Publish directory: `dist`
- Required environment variable:
  - `VITE_API_URL=https://your-backend.onrender.com/api`

## Roles And Access

- `GroupAdmin`: full cross-hotel management, hotel administration, and dashboard visibility
- `RegionalManager`: dashboard and ticket visibility for assigned regions
- `HotelAdmin`: hotel-level user, asset, problem type, and ticket management
- `Admin`: legacy group-admin-compatible role retained for existing deployments
- `Manager`: can view all tickets, assign tickets, delete tickets, and access the staff/user list needed for assignment
- `Agent`: can view tickets they created or tickets assigned to them; can work on assigned tickets
- `User`: can create tickets, view tickets they created or are assigned to, view assignee/detail/comments, and add comments

Ticket table data is permission-limited:

- GroupAdmin/Admin can see all authorized hotels; HotelAdmin/Manager see their hotel tickets.
- Agent/User see tickets where they are `createdBy` or `assignedTo`.

Dashboard and report summary data are scoped by hotel access. Group-level users can use the hotel selector to view one hotel or all authorized hotels.

Tickets can only be assigned by Admin or Manager. Assignment targets must be staff-like roles such as Admin, Manager, or Agent.

## Profile And Password

- Click the logged-in user card in the Sidebar to open the account menu.
- `Update Profile` lets every role update their own `name`, `email`, and `team`.
- `Change Password` requires the current password and a new password.
- After a successful password change, the frontend logs the user out.
- Existing JWTs issued before the password change are rejected by the backend using `passwordChangedAt`.
- Roles can only be changed through Admin User Management.

## Security Notes

- All API feature routes are JWT protected.
- Login, register, and password change routes are rate-limited.
- Helmet is enabled for common HTTP security headers.
- CORS is restricted by `CORS_ORIGIN`.
- Request body, params, and query keys are sanitized against MongoDB operator-style input.
- Passwords are hashed with bcrypt before storage.
- User API responses exclude password fields.
- `JWT_SECRET` must be strong; production should use at least 32 random characters.
- `ADMIN_PASSWORD` must be set to at least 12 characters in production.
- Production 500 errors avoid returning internal error details.
- Every hotel-scoped API filters by authorized hotel access on the backend; frontend filters are convenience controls only.
- User, hotel, ticket, and asset changes emit structured `[AUDIT]` logs with request IDs.
- Ticket attachments are limited to JPG, PNG, GIF, or WEBP images and a maximum size of 5 MB.
- Uploaded files are not served through public static hosting; they are viewed through protected ticket attachment routes.
- `server/uploads/*` is ignored by Git to avoid committing user-uploaded files.
- Delete actions use confirmation modals before destructive requests.

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
GET    /api/auth/users          Admin/Manager only
POST   /api/auth/users          Admin only
PATCH  /api/auth/users/:id      Admin only
DELETE /api/auth/users/:id      Admin only
```

### Hotels

```txt
GET    /api/hotels
POST   /api/hotels          GroupAdmin/Admin only
PATCH  /api/hotels/:id      GroupAdmin/Admin only
DELETE /api/hotels/:id      GroupAdmin/Admin only, soft deactivates
```

### Tickets

```txt
GET    /api/tickets                         Permission-limited ticket table data
GET    /api/tickets/summary                 Authenticated all-ticket dashboard/report data
GET    /api/tickets/insights                Authenticated all-ticket analytics data
GET    /api/tickets/:id                     Admin/Manager, creator, or assignee
POST   /api/tickets                         Requires an active Problem Type category
PATCH  /api/tickets/:id                     Admin/Manager or assigned Agent
PATCH  /api/tickets/:id/status              Admin/Manager or assigned Agent
PATCH  /api/tickets/:id/assign              Admin/Manager only
POST   /api/tickets/:id/comment             Admin/Manager, creator, or assignee
POST   /api/tickets/:id/attachments         Admin/Manager or assigned Agent, image only, max 5 MB
GET    /api/tickets/:id/attachments/:attachmentId/view
DELETE /api/tickets/:id                     Admin/Manager only
```

### Assets

```txt
GET    /api/assets
POST   /api/assets          Admin only
PATCH  /api/assets/:id      Admin only
DELETE /api/assets/:id      Admin only
```

### Problem Types

```txt
GET    /api/problem-types
POST   /api/problem-types       Admin only
DELETE /api/problem-types/:id   Admin only
```

## Useful Commands

Client:

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

Server:

```bash
npm run dev
npm start
```

Backend syntax check examples:

```bash
node --check index.js
node --check controllers/authController.js
node --check controllers/ticketController.js
```

Dependency security checks:

```bash
cd client
npm audit --audit-level=low

cd ../server
npm audit --audit-level=low
```

## Validation Status

Latest local checks:

- `client`: `npm run lint`
- `client`: `npm run build`
- `server`: selected `node --check` syntax checks for startup, controllers, routes, middleware, models, and validators
- `client/server`: `npm audit --audit-level=low`

## Screenshots

[Dashboard Screenshot]<img width="1899" height="938" alt="Dashboard" src="https://github.com/user-attachments/assets/9a39118b-f0fe-471e-b862-ca373f371595" />

[Ticket Management Screenshot]<img width="1897" height="936" alt="Ticket Management" src="https://github.com/user-attachments/assets/d812a41d-354a-4ad6-b2c3-f2d83bc65277" />

[User Management Screenshot]<img width="1888" height="932" alt="User Management" src="https://github.com/user-attachments/assets/ec799f92-4421-4ee4-9a3d-fe4c709243c2" />

## Author

Created by Manasak Srisuk.

## License

This project is for educational and portfolio purposes.
