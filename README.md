# OnlineMocks 2026

OnlineMocks 2026 is a full-stack platform designed to manage and conduct mock placement interviews for college students. It connects students with HR volunteers and helps organizers track progress.

## Features
- **Admin:** Manage students, assign HRs, and track overall progress.
- **HR:** View assigned candidates, access resumes, and submit interview feedback.
- **Volunteer:** Assist with candidate traffic and logistics.
- **Real-time:** Live updates for interview queues and notifications.

## Tech Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS, Zustand.
- **Backend:** Node.js, Express, Socket.io.
- **Database:** PostgreSQL with Prisma ORM.

## Setup Instructions

### 1. Backend
```bash
cd backend
npm install
# Update .env with your DATABASE_URL
npx prisma db push
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.
