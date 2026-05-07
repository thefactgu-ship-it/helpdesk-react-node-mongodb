# HelpDesk React Node MongoDB

A modern full-stack HelpDesk Dashboard project built with React, Node.js, Express, MongoDB, and JWT Authentication.

> This is a portfolio/demo project created for learning, experimentation, and showcasing full-stack web development skills.

---

# Preview

## Features

* Modern Dashboard UI
* Dark / Light Mode
* Ticket CRUD System
* Search & Filter Tickets
* Pagination
* Skeleton Loading
* Toast Notifications
* Confirm Modal
* JWT Authentication
* Protected API Routes
* MongoDB Database Integration
* Responsive Design
* Recharts Data Visualization

---

# Tech Stack

## Frontend

* React
* Vite
* Tailwind CSS
* Axios
* React Hot Toast
* Recharts

## Backend

* Node.js
* Express.js
* JWT Authentication
* bcryptjs
* Mongoose

## Database

* MongoDB

---

# Project Structure

```txt
helpdesk-react-node/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── index.js
│   └── .env
│
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/thefactgu-ship-it/helpdesk-react-node-mongodb.git
```

---

# Backend Setup

```bash
cd server
npm install
```

Create `.env`

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/helpdesk_db
JWT_SECRET=your_secret_key
```

Run server

```bash
npm run dev
```

---

# Frontend Setup

```bash
cd client
npm install
npm run dev
```

---

# Authentication

JWT Authentication is implemented.

Protected routes require:

```txt
Authorization: Bearer YOUR_TOKEN
```

---

# Demo Account

```txt
Email: admin@test.com
Password: 123456
```

---

# API Endpoints

## Auth

```txt
POST /api/auth/register
POST /api/auth/login
```

## Tickets

```txt
GET    /api/tickets
POST   /api/tickets
PATCH  /api/tickets/:id/status
DELETE /api/tickets/:id
```

---

# Learning Goals

This project was built to practice and demonstrate:

* Full Stack Development
* REST API Design
* JWT Authentication Flow
* React Component Architecture
* MongoDB Integration
* State Management
* Async API Handling
* UI/UX Improvements
* Production-style Project Structure

---

# Disclaimer

This project is created for educational and portfolio purposes only.

---

<img width="1903" height="944" alt="image" src="https://github.com/user-attachments/assets/26bcf840-f13c-42e4-b665-5855847243ae" />


# Author

Created by Manasak Srisuk
