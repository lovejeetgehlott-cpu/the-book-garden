# The Book Garden — Library / Student Management System (MERN)

A full-stack Library Management System for tracking student admissions and
membership/fee expiry, with WhatsApp renewal reminders.

**Stack:** MongoDB · Express.js · React (Vite) · Node.js · JWT auth · bcrypt

## Features

- **Dashboard** — clickable summary cards: Total Students, 3 Days Left, 2 Days Left, Last Day
- **Admission Form** — add students (name, WhatsApp phone with country code, email, address, course/membership, admission date, fee, due date, status)
- **Student List** — searchable table with days-left badges, Edit and Delete
- **3 Days / 2 Days / Last Day** — reminder lists filtered by exact days until `dueDate`, each row with a green **Send WhatsApp** button that opens `wa.me` in a new tab with a pre-filled, URL-encoded message (different template per list)
- **Users** — super-admin-only page to create / edit / delete admin accounts
- JWT-protected API (every route except login), bcrypt-hashed passwords, role-based access
- Loading spinners and error banners throughout the UI
- One default **super-admin** seeded automatically on first server start

## Project structure

```
The-book-garden/
├── client/               # React frontend (Vite)
│   └── src/
│       ├── api/          # Axios instance with JWT interceptors
│       ├── components/   # Sidebar, Header, Layout, StudentForm, ...
│       ├── context/      # AuthContext (login/logout/session)
│       ├── pages/        # Dashboard, AdmissionForm, StudentList, ReminderList, Users, Login
│       └── utils/        # date + WhatsApp helpers
└── server/               # Express REST API
    ├── config/           # MongoDB connection
    ├── middleware/       # JWT protect + superAdminOnly
    ├── models/           # Student, User (Mongoose)
    ├── routes/           # auth, students, dashboard, users
    ├── seed/             # default super-admin seeder
    └── utils/            # date-range helpers
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) **or** a MongoDB Atlas URI

## Setup & run

### 1. Server

```bash
cd server
npm install
```

Edit `server/.env` if needed:

```
MONGO_URI=mongodb://127.0.0.1:27017/library_management
JWT_SECRET=change_this_super_secret_key_in_production
PORT=5000
SEED_ADMIN_NAME=Super Admin
SEED_ADMIN_EMAIL=tbg1884@gmail.com
SEED_ADMIN_PASSWORD=tbG@hrdk2026
```

Start the API:

```bash
npm start
```

(or `npm run dev` for auto-reload with nodemon)

On first run the server seeds a default super-admin.

### 2. Client

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:3000** — API calls to `/api` are proxied to the
Express server on port 5000.

### 3. Login

| Email | Password | Role |
| --- | --- | --- |
| `tbg1884@gmail.com` | `tbG@hrdk2026` | super-admin |

> Change these in `server/.env` **before** the first run, or change the
> password later from the Users page.

## API reference

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Super-admin |
| GET | `/api/auth/me` | Any admin |
| GET/POST | `/api/students` | Any admin (`GET` supports `?search=`) |
| GET/PUT/DELETE | `/api/students/:id` | Any admin |
| GET | `/api/students/reminders/:days` | Any admin (`days` = 3, 2 or 0) |
| GET | `/api/dashboard/stats` | Any admin |
| GET/POST | `/api/users` | Super-admin |
| PUT/DELETE | `/api/users/:id` | Super-admin |

All protected routes expect `Authorization: Bearer <token>`.

## WhatsApp reminders

Buttons open `https://wa.me/<phone>?text=<encoded message>` in a new tab.
Phone numbers must include the country code (e.g. `919876543210`); any
spaces, `+` or dashes are stripped automatically. Message templates:

- **3 days:** "Dear {name}, your membership/fee is due in 3 days ({dueDate}). Please renew soon."
- **2 days:** "Dear {name}, your membership/fee is due in 2 days ({dueDate})."
- **Last day:** "Dear {name}, today is the last day for your membership/fee ({dueDate}). Please renew today."
