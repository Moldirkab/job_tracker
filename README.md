# Job Application Tracker

A full-stack job application tracker with JWT authentication, refresh token rotation, and AI-powered job posting extraction.

**Live demo:** https://job-tracker-one-sable.vercel.app
**API:** https://job-tracker-backend-v5mn.onrender.com

> Note: the backend is hosted on Render's free tier, which sleeps after 15 minutes of inactivity. The first request after a period of inactivity may take 30-60 seconds to respond while it wakes up.

## Features

- User registration and login with JWT access tokens + rotating refresh tokens
- Full CRUD for job applications (create, view, edit, delete)
- Search, filter by status, and sort
- AI-powered job import — paste a URL, Google Gemini extracts company/position/location/salary/skills, you review and confirm before saving
- Dockerized backend for consistent local development

## Tech stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
**Backend:** FastAPI, PostgreSQL, psycopg
**Auth:** JWT (access + refresh token rotation)
**AI:** Google Gemini API
**Infra:** Docker, Render (backend + Postgres), Vercel (frontend)

## Running locally

### Backend

\`\`\`bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Add a .env file with DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, SECRET_KEY, GEMINI_API_KEY

uvicorn app.main:app --reload
\`\`\`

### Frontend

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### Or, with Docker

\`\`\`bash
docker-compose up --build
\`\`\`
