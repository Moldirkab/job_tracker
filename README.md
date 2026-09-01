# Job Application Tracker

A full-stack job application tracker with JWT authentication, refresh token rotation, and AI-powered job posting extraction.

**Live demo:** https://job-tracker-one-sable.vercel.app
**API:** https://job-tracker-backend-v5mn.onrender.com

> The backend runs on Render's free tier and sleeps after 15 minutes of inactivity. The first request after idle time may take 30–60 seconds while it wakes up.

> Password reset emails are sent via Resend's sandbox sender, which only delivers to the email address the Resend account was created with. A verified custom domain would be needed to send to arbitrary recipients.

## Features

- JWT authentication with short-lived access tokens and rotating refresh tokens
- Password reset via email (single-use, time-limited reset tokens)
- Full CRUD for job applications
- Search, filter by status, and sort
- AI-powered job import — paste a URL, Gemini extracts company, position, location, salary, and skills; user reviews and confirms before saving
- Dockerized backend + Postgres for one-command local setup
- Automated backend tests (pytest) and CI on every push (GitHub Actions)

## Tech stack

| Layer    | Technology                                                             |
| -------- | ---------------------------------------------------------------------- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router                    |
| Backend  | FastAPI, PostgreSQL, psycopg                                           |
| Auth     | JWT (access + rotating refresh tokens)                                 |
| AI       | Google Gemini API                                                      |
| Email    | Resend                                                                 |
| Infra    | Docker, Render (backend + Postgres), Vercel (frontend), GitHub Actions |

## Project structure

```

job-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + routes
│   │   ├── models.py        # Pydantic schemas
│   │   ├── security.py      # Password hashing, JWT, refresh tokens
│   │   ├── auth.py          # Auth dependency
│   │   ├── database.py      # Postgres connection
│   │   ├── email.py         # Password reset email sending (Resend)
│   │   └── ai\_import.py     # Job posting fetch + Gemini extraction
│   ├── tests/                # pytest suite
│   ├── sql/                  # Schema + migrations
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── pages/            # Route-level components
│       ├── components/       # Reusable UI
│       ├── services/api.ts   # Backend API client
│       └── types/            # Shared TypeScript types
├── .github/workflows/        # CI (tests + build on push)
└── docker-compose.yml

```

## API reference

| Method | Endpoint                      | Description                             | Auth |
| ------ | ----------------------------- | --------------------------------------- | ---- |
| POST   | `/api/users`                  | Register a new user                     | No   |
| POST   | `/api/login`                  | Log in, returns access + refresh tokens | No   |
| POST   | `/api/refresh`                | Exchange a refresh token for a new pair | No   |
| POST   | `/api/logout`                 | Revoke a refresh token                  | No   |
| POST   | `/api/password-reset/request` | Request a password reset email          | No   |
| POST   | `/api/password-reset/confirm` | Reset password using a valid token      | No   |
| GET    | `/api/applications`           | List the current user's applications    | Yes  |
| POST   | `/api/applications`           | Create an application                   | Yes  |
| GET    | `/api/applications/{id}`      | Get one application                     | Yes  |
| PATCH  | `/api/applications/{id}`      | Update an application                   | Yes  |
| DELETE | `/api/applications/{id}`      | Delete an application                   | Yes  |
| POST   | `/api/applications/import`    | AI-extract job details from a URL       | Yes  |

## Running locally

### Docker (recommended)

```bash
docker-compose up --build
```

### Manual

**Backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Requires a `.env` file in `backend/` with:

```
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
SECRET_KEY=
GEMINI_API_KEY=
RESEND_API_KEY=
FRONTEND_URL=
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

### Tests

```bash
cd backend
pytest
```

Requires a separate `job_tracker_test` database (see `sql/000_initial_schema.sql`) and a `LOCAL_TEST_DB_PASSWORD` value in `.env`.
