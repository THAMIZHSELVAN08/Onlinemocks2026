

# OnlineMocks2026

### Scalable Mock Placement Interview Management Platform

OnlineMocks2026 is a **full-stack web platform** designed to manage and conduct **large-scale mock placement interviews** for college students.

The platform helps placement organizers coordinate **students, HR volunteers, resumes, and interview allocations** efficiently in a single system.

This system was designed to support **900+ students and 180+ HR interviewers** during a campus-level mock placement event.

---

# Key Features

## Student Module

* Student registration and profile management
* Resume upload and storage
* View assigned HR interviewer
* Access mock interview details
* Receive interview feedback

## HR / Interviewer Module

* View allocated student list
* Access student resumes
* Conduct mock interviews
* Submit evaluation and feedback

## Admin / Organizer Module

* Manage student database
* Allocate HR volunteers to students
* Monitor mock placement progress
* Track interview completion
* Maintain resume repository

---

# Tech Stack

## Frontend

* React.js
* TypeScript
* Vite
* CSS

## Backend

* Node.js
* Express.js

## Database

* MongoDB

## Development Tools

* Git
* GitHub
* REST APIs

---

# System Architecture

```
Students / HR / Admin
        │
        │
   React Frontend
        │
    REST API
        │
 Node.js + Express
        │
      Database
```

The frontend communicates with the backend through REST APIs.
The backend processes requests and interacts with the database to manage student and interview data.

---

# Project Structure

```
Onlinemocks2026
│
├── frontend
│   ├── src
│   ├── public
│   ├── components
│   └── package.json
│
├── backend
│   ├── controllers
│   ├── routes
│   ├── models
│   └── server.js
│
└── README.md
```

---

# Installation

## 1 Clone the Repository

```
git clone https://github.com/THAMIZHSELVAN08/Onlinemocks2026.git
```

---

## 2 Navigate to Project

```
cd Onlinemocks2026
```

---

## 3 Setup Frontend

```
cd frontend
npm install
npm run dev
```

Frontend will run on:

```
http://localhost:5173
```

---

## 4 Setup Backend

```
cd backend
npm install
npm start
```

Backend will run on:

```
http://localhost:5000
```

---

# Example Workflow

1. Admin uploads student data.
2. HR volunteers are allocated to students.
3. HR conducts mock interviews.
4. HR submits feedback.

---


