# HelpDesk React Node MongoDB

A full-stack IT Helpdesk system built with React, Vite, Tailwind CSS, Node.js, Express, MongoDB, and JWT authentication.

The project includes a helpdesk analytics dashboard, ticket management workflow, role-based user management, file attachments, comments, activity logs, and light/dark mode support.

## Features

- Dashboard analytics for ticket status, trends, severity, issue categories, open days, and derived satisfaction score
- Ticket creation, search, filter, pagination, status updates, and delete confirmation
- Ticket detail modal with comments, attachments, and activity log
- JWT login/register flow with protected API routes
- Admin-only user management
- Default admin account seeding
- Role-based sidebar visibility
- Light mode and dark mode
- Responsive UI with Tailwind CSS
- Toast notifications and confirmation modals
- MongoDB persistence with Mongoose models

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Axios
- React Hot Toast
- Recharts

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- multer

## Project Structure

```txt
helpdesk-react-node-mongodb/
|-- client/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   `-- index.css
|   |-- package.json
|   `-- vite.config.js
|-- server/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- index.js
|   `-- package.json
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
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/helpdesk_db
JWT_SECRET=your_secret_key

# Optional default admin overrides
ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=123456
ADMIN_NAME=System Admin
```

Run the backend:

```bash
npm run dev
```

The API will run at:

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

The web app will run at:

```txt
http://localhost:5173
```

## Default Admin Account

When the backend starts, it automatically ensures a default admin user exists.

```txt
Email: admin@test.com
Password: 123456
Role: Admin
```

You can override this using `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in `server/.env`.

## Roles And Access

- `Admin`: can access User Management and manage system users
- `Manager`, `Agent`, `User`: can use normal helpdesk features, but cannot see admin management menus

Public registration creates users with the `User` role only. Role changes must be done by an admin.

## API Overview

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
GET    /api/tickets
GET    /api/tickets/insights
GET    /api/tickets/:id
POST   /api/tickets
PATCH  /api/tickets/:id
PATCH  /api/tickets/:id/status
PATCH  /api/tickets/:id/assign
POST   /api/tickets/:id/comment
POST   /api/tickets/:id/attachments
DELETE /api/tickets/:id
```

Protected routes require this header:

```txt
Authorization: Bearer YOUR_JWT_TOKEN
```

## Useful Commands

### Client

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Server

```bash
npm run dev
```

## Environment Notes

- Make sure MongoDB is running before starting the backend.
- Uploaded files are stored in `server/uploads/`.
- The frontend expects the API at `http://localhost:5000`.
- The project is designed for local development and portfolio/demo use.

## Screenshots

Add screenshots here after pushing to GitHub:

```md
![Dashboard Screenshot](./docs/dashboard.png)
![Ticket Management Screenshot](./docs/tickets.png)
![User Management Screenshot](./docs/users.png)
```

## Learning Goals

This project demonstrates:

- Full-stack CRUD application structure
- REST API design
- JWT authentication
- Role-based access control
- React component architecture
- Dashboard data visualization
- MongoDB schema design
- Responsive UI design

## Author

Created by Manasak Srisuk.

## License

This project is for educational and portfolio purposes.
