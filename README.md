01Blog

01Blog is a social blogging platform where users can share posts, follow other users, like and comment on posts, receive notifications, and report inappropriate content.

There is also an admin dashboard for managing users, posts, and reports.

Tech Stack

Backend: Java 21, Spring Boot 3, Spring Security, JWT, JPA

Frontend: Angular 19, Angular Material, RxJS

Database: PostgreSQL 16

Build: Maven, npm

Containers: Docker / Podman Compose

Project Structure
01Blog/
├── backend/          # Spring Boot API
├── frontend/         # Angular application
├── docker-compose.yml
└── README.md

Requirements

Make sure you have:

Java 21+

Maven 3.8+

Node.js 20+

npm

Docker or Podman with Compose

Running the Project
1. Start PostgreSQL

From the project root:

docker compose up -d postgres


PostgreSQL will be available on:

localhost:5434

2. Start the Backend
cd backend
mvn spring-boot:run


The API will run on:

http://localhost:8080/api

3. Start the Frontend

In another terminal:

cd frontend
npm install
npm start


The frontend will be available at:

http://localhost:4200

Docker / Podman

You can also run the whole project with Compose:

docker compose up --build


or with Podman:

podman-compose up --build


This starts:

PostgreSQL → 5434

Backend → 8080

Frontend → 4200

Environment Variables

Main Features
Users

Register and login

JWT authentication

User profiles

Follow / unfollow users

Edit your own posts

Like and comment on posts

Notifications

Posts

Create posts

Add media

Edit and delete your own posts

Infinite scrolling feed

Like and comment

Reports

Users can report:

Other users

Posts

Admins can review and resolve reports.

Admin

Admins have access to:

Dashboard statistics

User management

Post management

User banning

Report management

API

The main API routes are:

/api/auth
/api/posts
/api/users
/api/subscriptions
/api/notifications
/api/reports
/api/files
/api/admin

Database

The project uses PostgreSQL.

The main tables are:

users
posts
comments
likes
subscriptions
notifications
reports

