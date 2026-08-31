# Job Application Tracker

A full-stack job application tracker with JWT authentication, refresh token rotation, and AI-powered job posting extraction.

**Live demo:** https://job-tracker-one-sable.vercel.app
**API:** https://job-tracker-backend-v5mn.onrender.com

> The backend runs on Render's free tier and sleeps after 15 minutes of inactivity. The first request after idle time may take 30–60 seconds while it wakes up.

## Features

- JWT authentication with short-lived access tokens and rotating refresh tokens
- Full CRUD for job applications
- Search, filter by status, and sort
- AI-powered job import — paste a URL, Gemini extracts company, position, location, salary, and skills; user reviews and confirms before saving
- Dockerized backend + Postgres for one-command local setup

## Tech stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router    |
| Backend  | FastAPI, PostgreSQL, psycopg                           |
| Auth     | JWT (access + rotating refresh tokens)                 |
| AI       | Google Gemini API                                      |
| Infra    | Docker, Render (backend + Postgres), Vercel (frontend) |

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
│   │   └── ai_import.py     # Job posting fetch + Gemini extraction
│   ├── sql/                 # Schema + migrations
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── pages/            # Route-level components
│       ├── components/       # Reusable UI
│       ├── services/api.ts   # Backend API client
│       └── types/            # Shared TypeScript types
└── docker-compose.yml
```

## API reference

| Method | Endpoint                   | Description                             | Auth |
| ------ | -------------------------- | --------------------------------------- | ---- |
| POST   | `/api/users`               | Register a new user                     | No   |
| POST   | `/api/login`               | Log in, returns access + refresh tokens | No   |
| POST   | `/api/refresh`             | Exchange a refresh token for a new pair | No   |
| POST   | `/api/logout`              | Revoke a refresh token                  | No   |
| GET    | `/api/applications`        | List the current user's applications    | Yes  |
| POST   | `/api/applications`        | Create an application                   | Yes  |
| GET    | `/api/applications/{id}`   | Get one application                     | Yes  |
| PATCH  | `/api/applications/{id}`   | Update an application                   | Yes  |
| DELETE | `/api/applications/{id}`   | Delete an application                   | Yes  |
| POST   | `/api/applications/import` | AI-extract job details from a URL       | Yes  |

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
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```
