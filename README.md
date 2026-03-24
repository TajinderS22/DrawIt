# ✏️ DrawIt - Real-time Collaborative Whiteboard

DrawIt is a full-stack, real-time collaborative whiteboard application built with TypeScript, Next.js, Express, and WebSockets. Multiple users can join shared canvas rooms, draw together in real-time, and persist their work to a PostgreSQL database using Prisma ORM.

## ✨ Features

- 🧑‍🤝‍🧑 **Real-time Collaboration** - Work with multiple users simultaneously on shared canvases
- 🎨 **Drawing Tools** - Multiple drawing tools and shape support for creative expression
- 💾 **Persistent Storage** - All canvas data automatically saved to database
- 🔐 **User Authentication** - JWT-based authentication with secure password hashing (bcrypt)
- 📊 **Room-based Architecture** - Create and join rooms with unique slugs for organization
- ⚡ **WebSocket Communication** - Native WebSocket implementation (not Socket.IO) for efficient real-time sync
- 🎯 **Monorepo Structure** - Scalable turborepo setup with shared utilities and configurations

## 📋 Prerequisites

- **Node.js** 18+, **PNPM** 8+, **PostgreSQL** 12+

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd DrawIt
pnpm install
```

PNPM will automatically install dependencies for all workspaces and link internal packages.

### 2. Environment Configuration

Create `.env` files in the following locations:

**`packages/db/.env`** - Database connection:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/drawit_db"
```

**`apps/http-backend/.env`** - REST API configuration:

```env
HTTP_SEVER_PORT=3030
JWT_SECRET=your_jwt_secret_key_here
DATABASE_URL="postgresql://username:password@localhost:5432/drawit_db"
```

**`apps/ws-backend/.env`** - WebSocket server configuration:

```env
WS_PORT=8090
JWT_SECRET=your_jwt_secret_key_here
DATABASE_URL="postgresql://username:password@localhost:5432/drawit_db"
```

**`apps/web/.env.local`** - Frontend configuration:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3030
NEXT_PUBLIC_WS_URL=ws://localhost:8090
```

### 3. Database Setup

Initialize the PostgreSQL database and run migrations:

```bash
# Create the database
createdb drawit_db

# Navigate to the db package
cd packages/db

# Run Prisma migrations
pnpm run db:migrate

# Seed the database (optional - if seed script exists)
pnpm run db:seed
```

### 4. Start Development Servers

Run all services concurrently using Turborepo:

```bash
# From the root directory, start all dev servers
pnpm run dev
```

This will start:

- **Frontend** (Next.js) - `http://localhost:3000`
- **HTTP Backend** (Express) - `http://localhost:3030`
- **WebSocket Server** - `ws://localhost:8090`

Alternatively, start individual services:

```bash
# Start only the frontend
pnpm --filter web dev

# Start only the HTTP backend
pnpm --filter http-backend dev

# Start only the WebSocket backend
pnpm --filter ws-backend dev

# Start database package (for Prisma commands)
pnpm --filter db run db:migrate
```

Visit `http://localhost:3000` in your browser and authenticate to start collaborating.

## 📁 Project Architecture

**Monorepo Structure:** Turborepo managing 3 apps and 5 packages.

```
DrawIt/
├── apps/
│   ├── http-backend/          # Express REST API (port 3030)
│   ├── web/                   # Next.js frontend (port 3000)
│   └── ws-backend/            # WebSocket server (port 8090)
├── packages/
│   ├── db/                    # Prisma + PostgreSQL
│   ├── backend-common/        # Shared utilities
│   ├── ui/                    # React components
│   ├── eslint-config/         # Linting rules
│   └── typescript-config/     # TS configs
└── turbo.json
```

## 🛠️ Tech Stack

**Frontend:** Next.js 15, React 19, TypeScript, Redux, TailwindCSS, Axios, JWT

**Backend:** Node.js, Express 5, WebSocket (ws), Prisma, PostgreSQL, bcrypt

**Build:** Turborepo, PNPM, ESLint

## 🏃 Development Workflow

**Start all services:**

```bash
pnpm run dev
```

**Services running:**

- Frontend: `http://localhost:3000`
- HTTP Backend: `http://localhost:3030`
- WebSocket: `ws://localhost:8090`

**Individual services:**

```bash
pnpm --filter web dev
pnpm --filter http-backend dev
pnpm --filter ws-backend dev
```

**Database operations:**

```bash
cd packages/db
pnpm run db:migrate -- --name migration_name
pnpm run db:studio
```

**Code quality:**

```bash
pnpm run lint              # Lint all packages
pnpm run type-check        # Type check
pnpm run build             # Build all
pnpm --filter web build    # Build specific package
```

## 🔐 Authentication

1. Register/Login → Hash password (bcrypt) → Generate JWT
2. API requests include JWT in Authorization header
3. Middleware verifies JWT signature → Extract user ID
4. WebSocket connection passes JWT as query param → Verified on connection

## 📡 Real-time Sync

WebSocket server maintains rooms and broadcasts drawing events:

```
Client A draws → sends event to ws-backend → broadcasts to all clients in room
```

## 📝 License

MIT
