# IT Helpdesk Dashboard

A full-stack IT Helpdesk Dashboard for Thavorn Hotels Group, built with React, Vite, Tailwind CSS, Node.js, Express, MongoDB, Mongoose, and JWT authentication.

The app provides a clean white-and-purple dashboard experience with light/dark mode, ticket workflows, analytics, reports, asset lifecycle tracking, user management, requester lists, problem types, comments, protected image attachments, toast notifications, pagination, and confirmation modals.

## Features

- Dashboard KPIs, charts, status summary, severity, category, and open-day analysis from real ticket data
- Helpdesk ticket list with search, filter, pagination, detail modal, status update, assignment, delete confirmation, comments, activity log, and protected attachments
- Add Ticket form with required-field validation and role-aware assignment
- Monthly, quarterly, and yearly reports with ticket trends, open/resolved/overdue comparison, category summary, priority summary, and average resolution time
- Asset Management with lifecycle fields, age calculation, recommendation status, detail modal, and admin-only create/edit/delete
- User Management with admin-only create/edit/delete and password-safe user listing
- Request Users page for requester/user review and search
- Problem Types page with default categories and admin-only add
- JWT authentication, role-based access, CORS restrictions, Helmet security headers, and login/register rate limiting
- Lazy-loaded pages to keep production chunks smaller

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

## Project Structure

```txt
helpdesk-react-node/
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
cd helpdesk-react-node
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

## Roles And Access

- `Admin`: full user management, asset create/edit/delete, problem type create, ticket assign/delete, and all ticket access
- `Manager`: can view all tickets, assign tickets, and delete tickets
- `Agent`: can work on tickets assigned to them
- `User`: can request tickets and can only see tickets assigned to them in the ticket table

Dashboard and report summary data are available to authenticated users because they are system-level summaries.

Tickets can only be assigned by `Admin` or `Manager`, and assignment targets must be staff-like roles such as `Admin`, `Manager`, or `Agent`. Ordinary `User` accounts are requester-only.

## Security Notes

- All API feature routes are JWT protected.
- Login and register routes are rate-limited.
- Helmet is enabled for common HTTP security headers.
- CORS is restricted by `CORS_ORIGIN`.
- Passwords are hashed with bcrypt before storage.
- User API responses exclude password fields.
- `JWT_SECRET` must be strong; production should use at least 32 random characters.
- `ADMIN_PASSWORD` must be set to at least 12 characters in production.
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
GET    /api/auth/users
POST   /api/auth/users          Admin only
PATCH  /api/auth/users/:id      Admin only
DELETE /api/auth/users/:id      Admin only
```

### Tickets

```txt
GET    /api/tickets                         Permission-limited ticket table data
GET    /api/tickets/summary                 Authenticated dashboard/report summary data
GET    /api/tickets/insights                Authenticated analytics data
GET    /api/tickets/:id                     Admin/Manager or assigned user
POST   /api/tickets
PATCH  /api/tickets/:id                     Admin/Manager or assigned user
PATCH  /api/tickets/:id/status              Admin/Manager or assigned user
PATCH  /api/tickets/:id/assign              Admin/Manager only
POST   /api/tickets/:id/comment             Admin/Manager or assigned user
POST   /api/tickets/:id/attachments         Admin/Manager or assigned user, image only, max 5 MB
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
POST   /api/problem-types   Admin only
DELETE /api/problem-types/:id
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
```

Backend syntax check example:

```bash
node -c index.js
```

## Validation Status

Latest local checks:

- `client`: `npm run lint`
- `client`: `npm run build`
- `server`: selected `node -c` syntax checks for main controllers, routes, middleware, and startup file

## Screenshots

[Dashboard Screenshot]<img width="1899" height="938" alt="Dashboard" src="https://github.com/user-attachments/assets/9a39118b-f0fe-471e-b862-ca373f371595" />

[Ticket Management Screenshot]<img width="1897" height="936" alt="Ticket Management" src="https://github.com/user-attachments/assets/d812a41d-354a-4ad6-b2c3-f2d83bc65277" />

[User Management Screenshot]<img width="1888" height="932" alt="User Management" src="https://github.com/user-attachments/assets/ec799f92-4421-4ee4-9a3d-fe4c709243c2" />

## Author

Created by Manasak Srisuk.

## License

This project is for educational and portfolio purposes.
