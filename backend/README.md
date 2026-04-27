# ⚙️ OnlineMocks 2026 - Backend

The powerhouse behind the **OnlineMocks 2026** ecosystem, providing robust APIs, real-time data synchronization, and secure data persistence.

## 🚀 Core Engine
- **Node.js & TypeScript:** Type-safe, high-performance server-side logic.
- **Express.js:** Scalable routing and middleware management.
- **Prisma & PostgreSQL:** Enterprise-grade relational data management with type-safe queries.
- **Socket.io:** Low-latency real-time updates for dashboards and notifications.
- **Zod:** Strict schema validation for incoming requests.
- **Swagger/OpenAPI:** Automated API documentation (available at `/api-docs`).

## 🧱 Key Components
- `/src/server.ts`: Entry point and server configuration.
- `/src/controllers`: Request handlers and business logic.
- `/src/routes`: API endpoint definitions.
- `/src/models`: Shared types and database schemas.
- `/prisma`: Database schema definitions and migrations.
- `/scripts`: Custom tools for data seeding and system maintenance.

## 🛠️ Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file with the following variables:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/onlinemocks"
JWT_SECRET="your_secret_key"
PORT=5000
```

### 3. Database Migration
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Seed Initial Data
```bash
node seed.js
```

---

Engineered for stability and scale.
