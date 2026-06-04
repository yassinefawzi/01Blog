# 01Blog

01Blog is a full-stack social blogging platform where students share learning experiences, follow each other, interact with posts, and report inappropriate content. Administrators moderate users, posts, and reports.

## Technologies

| Layer | Stack |
|-------|--------|
| Backend | Java 17, Spring Boot 3.4, Spring Security, JWT, Spring Data JPA |
| Frontend | Angular 21, TypeScript, standalone components |
| Database | MySQL 8 |
| Media | Local filesystem (`uploads/`) |

## Features

- User registration and login with JWT and role-based access (`ROLE_USER`, `ROLE_ADMIN`)
- Public profile pages with post CRUD on your own block
- Follow / unfollow users and a home feed from followed accounts
- Posts with text, optional image/video upload, likes, and comments
- Notifications when followed users publish posts (REST + WebSocket push)
- **Private messaging** with real-time delivery over WebSocket (STOMP)
- Live comment updates on open post threads via WebSocket
- User reports (reason + timestamp), visible to admins only
- Admin dashboard: manage users (ban/delete), posts (hide/delete), and reports

## Prerequisites

- Java 17+
- Node.js 20+ and npm
- Docker (optional, for MySQL + backend container)

## Quick start with Docker

```bash
cd Backend
docker compose up --build
```

MySQL runs on port **3307**. The API runs on **http://localhost:8080**.

## Run backend locally

1. Start MySQL (or use Docker only for the database):

```bash
cd Backend
docker compose up mysql-db -d
```

2. Run the Spring Boot app:

```bash
cd Backend
./mvnw spring-boot:run
```

Default datasource (see `application.properties`):

- URL: `jdbc:mysql://localhost:3307/blogdb`
- User: `bloguser`
- Password: `blogpass`

The first registered user receives the **admin** role automatically.

## Run frontend

```bash
cd FrontEnd
npm install
npm start
```

Open **http://localhost:4200**. The app calls the API at `http://localhost:8080`.

## API overview

| Area | Base path |
|------|-----------|
| Auth | `/api/auth` (login, logout, me) |
| Users | `/api/users` (register, profile, follow) |
| Posts | `/api/posts` (CRUD, feed, likes, comments) |
| Notifications | `/api/notifications` |
| Reports | `/api/reports` |
| Admin | `/api/admin` (requires `ROLE_ADMIN`) |
| Messages | `/api/messages` (conversations, history, send) |
| WebSocket | `ws://localhost:8080/ws` (STOMP, JWT in connect headers) |

### WebSocket destinations

| Destination | Purpose |
|-------------|---------|
| `/app/chat.send` | Send a private message |
| `/user/queue/messages` | Receive private messages |
| `/user/queue/notifications` | Receive notification pushes |
| `/topic/post.{id}.comments` | Live comments on a post |

## Project structure

```
01Blog/
├── Backend/          # Spring Boot REST API
├── FrontEnd/         # Angular SPA
└── README.md
```

## Security notes

- Passwords are hashed with BCrypt
- JWT is sent via `Authorization: Bearer` header (stored in browser `localStorage` on login)
- Admin routes are protected with `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`
- Banned users cannot log in or create posts

## Evaluation checklist

- Authentication and roles
- Profile blocks, subscriptions, feed
- Post media upload, likes, comments
- Reports and admin moderation
- Responsive custom UI with dark mode toggle
