# Plates

Plates is an offline-first workout tracking app with a React Native/Expo frontend and a Fastify API backend. It is built for fast strength-session logging: start a workout, add sets as you lift, keep notes, sync to the API when available, and review completed training history.

The current UI follows a crisp Uber-inspired design system: black-and-white core surfaces, light gray utility panels, bold type, modest radii, and task-first layouts.

## Features

- Account signup, login, and persisted auth
- Expo Router app shell with Workout, Feed, History, and Analytics tabs
- Live workout session timer with pause/resume
- Fast set logging by exercise, weight, and reps
- Offline-first local persistence with WatermelonDB
- Background sync scaffolding for workout data
- Completed workout history and detail views
- Social/active-session backend routes and WebSocket support
- Responsive web, iOS, and Android targets

## Tech Stack

**Frontend**

- Expo SDK 55
- React 19 and React Native 0.83
- Expo Router
- NativeWind/Tailwind styling
- Zustand for app state
- WatermelonDB for offline local storage
- React Native Reanimated and Worklets

**Backend**

- Fastify 5
- PostgreSQL/TimescaleDB
- Redis
- Prisma client
- JWT auth
- WebSocket support for social activity

## Repository Structure

```text
.
├── backend/              # Fastify API, migrations, Docker services
│   ├── db/               # SQL migrations and seed data
│   ├── prisma/           # Prisma schema
│   └── src/              # API modules and shared infrastructure
├── frontend/             # Expo React Native app
│   ├── app/              # Expo Router screens and routes
│   ├── components/       # Shared UI and app components
│   ├── constants/        # Design tokens and layout constants
│   ├── src/db/           # WatermelonDB schema/models/actions
│   ├── src/sync/         # Offline sync protocol/mappers
│   ├── stores/           # Zustand stores
│   └── utils/            # API/auth utilities
└── package.json          # Convenience scripts for frontend targets
```

## Prerequisites

- Node.js 24 or compatible modern Node
- npm
- Docker Desktop
- Xcode for iOS simulator builds
- Android Studio for Android emulator builds

## Environment

Create `backend/.env` from `backend/.env.example`:

```bash
cd backend
cp .env.example .env
```

For local host development, the values should look like:

```env
POSTGRES_USER=plates_admin
POSTGRES_PASSWORD=plates_local_pw
POSTGRES_DB=plates
POSTGRES_PORT=5432
POSTGRES_HOST_PORT=5433
DATABASE_URL=postgresql://plates_admin:plates_local_pw@localhost:5433/plates

REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_HOST_PORT=6380
REDIS_PASSWORD=redis_local_pw

API_PORT=3000
API_HOST_PORT=3002
JWT_SECRET=local-dev-jwt-secret-change-in-prod
NODE_ENV=development
```

## Install

Install dependencies at the root and in each package if they are not already installed:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

## Run Locally

### 1. Start Postgres and Redis

```bash
cd backend
docker compose --env-file .env -f docker-compose.yml up -d db redis
```

Check status:

```bash
docker compose --env-file .env -f docker-compose.yml ps
```

### 2. Run migrations

The migration script reads database connection values directly from environment variables. For host-local development:

```bash
cd backend
POSTGRES_HOST=localhost \
POSTGRES_PORT=5433 \
POSTGRES_USER=plates_admin \
POSTGRES_PASSWORD=plates_local_pw \
POSTGRES_DB=plates \
npm run migrate
```

Optional seed:

```bash
POSTGRES_HOST=localhost \
POSTGRES_PORT=5433 \
POSTGRES_USER=plates_admin \
POSTGRES_PASSWORD=plates_local_pw \
POSTGRES_DB=plates \
npm run seed
```

### 3. Start the API

If port `3000` is free:

```bash
cd backend
npm run dev
```

If another app is already using `3000`, run the API on `3002`:

```bash
cd backend
POSTGRES_HOST=localhost \
POSTGRES_PORT=5433 \
POSTGRES_USER=plates_admin \
POSTGRES_PASSWORD=plates_local_pw \
POSTGRES_DB=plates \
REDIS_HOST=localhost \
REDIS_PORT=6380 \
REDIS_PASSWORD=redis_local_pw \
API_PORT=3002 \
JWT_SECRET=local-dev-jwt-secret-change-in-prod \
NODE_ENV=development \
npm run dev
```

Health check:

```bash
curl http://localhost:3002/health
```

### 4. Start the frontend

For iOS:

```bash
cd frontend
EXPO_PUBLIC_API_URL=http://localhost:3002 npm run ios
```

For web:

```bash
cd frontend
EXPO_PUBLIC_API_URL=http://localhost:3002 npm run web -- --port 8082
```

For Android:

```bash
cd frontend
EXPO_PUBLIC_API_URL=http://localhost:3002 npm run android
```

Root convenience scripts are also available:

```bash
npm run ios
npm run android
npm run web
```

When you need to pass Expo CLI flags, prefer running from `frontend/` directly.

## Demo Account

For local development, create or use:

```text
username: alex_lifts
password: password123
```

If the account does not exist yet:

```bash
curl -X POST http://localhost:3002/auth/signup \
  -H 'content-type: application/json' \
  --data '{"username":"alex_lifts","email":"alex@example.com","password":"password123","displayName":"Alex Johnson"}'
```

## Frontend Design System

The UI is intentionally functional and restrained:

- `#000000` for primary text and CTAs
- `#FFFFFF` for main surfaces
- `#F6F6F6` for utility backgrounds and inputs
- `#E2E2E2` for borders/dividers
- `#545454` for secondary text
- `#0A7F5A` for success states
- Modest `10px` buttons/inputs and `16px` panels
- Dense, task-first screens with large tap targets

Shared primitives live in:

```text
frontend/components/ui.tsx
```

Key screens:

```text
frontend/app/(auth)/login.tsx
frontend/app/(auth)/signup.tsx
frontend/app/(tabs)/index.tsx
frontend/app/workout/active.tsx
```

## API Overview

Base URL in local development:

```text
http://localhost:3002
```

Routes:

```text
GET  /health

POST /auth/signup
POST /auth/login
GET  /auth/me

GET  /exercises

POST /routines
GET  /routines
GET  /routines/:id

POST  /workouts/start
POST  /workouts/:id/sets
PATCH /workouts/:id/finish

GET  /sync/pull
POST /sync/push

GET  /social/active
POST /social/hype/:friendId
GET  /ws
```

Most app routes use JWT auth. The frontend stores auth state and sends bearer tokens through `frontend/utils/api.ts`.

## Offline-First Data Flow

1. The user starts a workout.
2. The frontend writes the session to WatermelonDB first.
3. Zustand keeps the active workout state responsive in memory and persisted through AsyncStorage.
4. The app attempts to sync with the API.
5. If the API is unavailable, local state remains usable and sync can happen later.

Important frontend files:

```text
frontend/stores/workout.ts
frontend/src/db/index.ts
frontend/src/sync/sync.ts
frontend/src/sync/mappers.ts
```

## Useful Commands

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm run start
npm run ios
npm run android
npm run web
```

Backend:

```bash
cd backend
npm run dev
npm run build
npm run migrate
npm run seed
```

Docker:

```bash
cd backend
docker compose --env-file .env -f docker-compose.yml up -d db redis
docker compose --env-file .env -f docker-compose.yml ps
docker compose --env-file .env -f docker-compose.yml logs -f db redis
```

## Troubleshooting

### Port 3000 is already in use

Run the API on `3002` and set:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3002
```

### Migration tries to connect to `db:5432`

Pass the host-local Postgres variables explicitly:

```bash
POSTGRES_HOST=localhost POSTGRES_PORT=5433 POSTGRES_USER=plates_admin POSTGRES_PASSWORD=plates_local_pw POSTGRES_DB=plates npm run migrate
```

### Web build errors on `import.meta`

The frontend imports Zustand middleware through `zustand/middleware.js` and declares its types in:

```text
frontend/zustand-middleware-js.d.ts
```

Keep that import unless Metro's ESM handling changes.

### iOS build and Xcode compatibility

This project currently includes Expo 55 native dependencies. If Xcode is older than the iOS SDK used by the latest Expo packages, native compilation may require package patch updates or a newer Xcode. Run:

```bash
cd frontend
npx expo install --fix
npx pod-install ios
```

Then retry:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3002 npm run ios
```

## Current Status

Plates is an active local-development app. The core workout logging loop is functional, with backend sync scaffolding and a polished responsive UI. Routine selection, richer analytics, and social feed data are natural next areas to deepen.
