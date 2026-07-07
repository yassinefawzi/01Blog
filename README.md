# 01Blog — Social Learning Platform

A fullstack social blogging platform where 01talents share posts, follow each other, interact through likes and comments, receive notifications, and report inappropriate content. Admins manage users, posts, and reports through a secure dashboard.

## Architecture Overview

```
┌─────────────────┐     REST + WebSocket      ┌──────────────────────────────┐
│  Angular 19     │ ◄──────────────────────► │  Spring Boot 3 REST API       │
│  (Material UI)  │     JWT Bearer Auth       │  Spring Security + JWT        │
└─────────────────┘                           └──────────────┬───────────────┘
                                                             │
                                                    ┌────────▼────────┐
                                                    │  PostgreSQL 16   │
                                                    └─────────────────┘
```

### Backend layers
- **Controllers** — REST endpoints (`/auth`, `/posts`, `/users`, `/admin`, …)
- **Services** — business logic
- **Repositories** — Spring Data JPA
- **Entities** — JPA domain model
- **DTOs** — request/response objects
- **Security** — JWT filter, BCrypt, role-based access (`USER`, `ADMIN`)

### Frontend modules
- **auth** — login, register
- **feed** — home feed, create post (infinite scroll)
- **profile** — user blocks, subscribe/unsubscribe
- **notifications** — dropdown in navbar
- **admin** — dashboard with stats, user/report management
- **shared** — post card, report dialog

## Technologies

| Layer    | Stack |
|----------|-------|
| Backend  | Java 21, Spring Boot 3.3, Spring Security, JWT (jjwt), JPA, PostgreSQL, WebSocket (STOMP) |
| Frontend | Angular 19, Angular Material, RxJS, SockJS/STOMP |
| DevOps   | Docker Compose (PostgreSQL), Maven, npm |

## Prerequisites

- Java 21+
- Maven 3.8+
- Node.js 20+ and npm
- Docker & Docker Compose (for PostgreSQL)

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

PostgreSQL runs on **port 5434** (to avoid conflict with other local Postgres instances on 5432/5433).

### 2. Run the backend

```bash
cd backend
mvn spring-boot:run
```

API base URL: `http://localhost:8080/api`

Default admin account (created on first startup):
- **Username:** `admin`
- **Password:** `admin123`

### 3. Run the frontend

```bash
cd frontend
npm install
npm start
```

App URL: `http://localhost:4200`

## Environment Variables

### Backend (`application.yml` or env vars)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_USERNAME` | `blog01` | PostgreSQL username |
| `DB_PASSWORD` | `blog01_secret` | PostgreSQL password |
| `SERVER_PORT` | `8080` | API port |
| `JWT_SECRET` | (see yml) | JWT signing key (min 256 bits) |
| `JWT_EXPIRATION_MS` | `86400000` | Token TTL (24h) |
| `CORS_ORIGINS` | `http://localhost:4200` | Allowed CORS origins |
| `UPLOAD_DIR` | `uploads` | Local media storage path |
| `STORAGE_BASE_URL` | `http://localhost:8080/api/files` | Public URL prefix for uploads |
| `STORAGE_TYPE` | `local` | `local` (S3-ready interface available) |

### Frontend (`src/environments/environment.ts`)

| Key | Default | Description |
|-----|---------|-------------|
| `apiUrl` | `http://localhost:8080/api` | Backend REST base URL |
| `wsUrl` | `http://localhost:8080/api/ws` | WebSocket endpoint |

## API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login (returns JWT) |
| GET | `/files/{filename}` | Serve uploaded media |

### Authenticated (USER)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/posts/feed` | Subscribed users' feed |
| POST | `/posts` | Create post |
| PUT/DELETE | `/posts/{id}` | Edit/delete own post |
| POST | `/posts/{id}/likes` | Toggle like |
| GET/POST | `/posts/{id}/comments` | Comments |
| GET | `/users/{username}` | Profile |
| POST | `/subscriptions/{username}` | Follow/unfollow |
| GET | `/notifications` | Notifications |
| POST | `/reports` | Report user/post |
| POST | `/files/upload` | Upload media |

### Admin only
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Dashboard analytics |
| GET | `/admin/users` | List users |
| PATCH | `/admin/users/{id}/ban` | Ban/unban |
| DELETE | `/admin/users/{id}` | Delete user |
| DELETE | `/admin/posts/{id}` | Delete post |
| GET/PATCH | `/admin/reports` | Review reports |

## Database Schema

- **users** — accounts, roles, profiles
- **posts** — blog posts with optional media
- **comments** — post comments
- **likes** — unique (post, user) pairs
- **subscriptions** — follower/following relationships
- **notifications** — in-app alerts
- **reports** — moderation queue

Schema is auto-generated via Hibernate `ddl-auto: update`.

## Project Structure

```
blog01/
├── backend/                 # Spring Boot API
│   └── src/main/java/com/blog01/
│       ├── controller/
│       ├── service/
│       ├── repository/
│       ├── entity/
│       ├── dto/
│       ├── security/
│       ├── storage/
│       └── config/
├── frontend/                # Angular SPA
│   └── src/app/
│       ├── core/            # guards, interceptors, services
│       ├── features/        # auth, feed, profile, admin
│       ├── shared/          # reusable components
│       └── layout/          # navbar
├── docker-compose.yml
└── README.md
```

## Bonus Features Included

- WebSocket support (STOMP) for real-time feed/comments/notifications
- Infinite scroll on feed
- Admin analytics dashboard
- S3-ready storage abstraction (`StorageService` interface)

## Git Workflow

Recommended branches:
- `main` — stable releases
- `develop` — integration
- `feature/*` — feature branches

## License

MIT — for educational use.
