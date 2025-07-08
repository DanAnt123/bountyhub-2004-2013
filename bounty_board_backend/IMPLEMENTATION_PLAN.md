# Implementation Plan (SQLite Pivot – No Supabase)

## Overview

This document describes the revised backend plan for the Bounty Board project. The backend now uses a **local SQLite database** (not Supabase or any external managed DB), and handles **all authentication and business logic** in-house.

---

## 1. Database Layer (SQLite)

- **Database**: Use SQLite (local file, e.g., `bounty_board.sqlite`).
- **ORM/Query Layer**: Node.js can directly use [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), [sqlite3](https://github.com/TryGhost/node-sqlite3), or a minimal ORM like [knex.js](http://knexjs.org/).
- **Schema**:
  - **users**
    - `id` (INTEGER, primary key, auto-increment)
    - `email` (VARCHAR, unique, not null)
    - `username` (VARCHAR, unique, not null)
    - `display_name` (VARCHAR)
    - `password_hash` (VARCHAR, not null) – store securely (bcrypt or argon2)
    - `created_at` (TIMESTAMP, default current timestamp)
  - **bounties**
    - `id` (INTEGER, primary key, auto-increment)
    - `title` (VARCHAR, not null)
    - `description` (TEXT)
    - `github_repo_link` (VARCHAR)
    - `amount` (NUMERIC, not null)
    - `status` (VARCHAR, default 'open')
    - `created_by` (INTEGER, FK to users(id))
    - `created_at` (TIMESTAMP, default current timestamp)
  - **claims**
    - `id` (INTEGER, primary key, auto-increment)
    - `bounty_id` (INTEGER, FK to bounties(id), not null)
    - `user_id` (INTEGER, FK to users(id), not null)
    - `claimed_at` (TIMESTAMP, default current timestamp)
    - `completed_at` (TIMESTAMP)
    - `status` (VARCHAR, not null)
- **Setup**: DB schema can be initialized with a migration script if `sqlite` file is not found.

---

## 2. Authentication (Local)

- **Registration**: `/auth/register` – Receives email, username, password. Stores credentials in `users` with password hashed.
- **Login**: `/auth/login` – Accepts email/username and password. Verifies credentials, returns signed session token (JWT).
- **Session Management**: Issue JWTs on login for stateless authentication. Validate JWT on protected endpoints.
- **Password Security**: Use bcrypt or argon2 to hash user passwords before storing.
- **User Profile**: `/users/me` returns profile of the logged-in user based on JWT.

---

## 3. Backend API Responsibilities

### a. Authentication

- Register new user (`POST /auth/register`)
- Authenticate user & generate session token (`POST /auth/login`)
- Validate/refresh session tokens (JWT)
- Profile access (`GET /users/me`)
- Password change (`POST /users/change-password` – optional)

### b. Bounties

- Create a bounty post (`POST /bounties`)
- List all bounties (`GET /bounties`)
- View details of a bounty (`GET /bounties/:id`)
- Edit a bounty (only creator) (`PUT /bounties/:id`)
- Delete a bounty (only creator) (`DELETE /bounties/:id`)

### c. Claims

- Claim a bounty (`POST /claims`)
- Mark claim as completed (`POST /claims/:id/complete`)
- List my claims (`GET /claims?user_id=me`)
- List claims for bounty (`GET /bounties/:id/claims`)

### d. Users

- Get my profile (`GET /users/me`)
- Get public profile by username or id (`GET /users/:id`)
- (optional: update profile)

---

## 4. Security

- **All state-changing routes** require authentication (JWT bearer token).
- **Input validation** for all user-controlled fields.
- **Password hashing**: never store raw passwords!
- **Rate limiting** (optional, recommended for production).
- **CORS** setup for frontend.

---

## 5. How to Migrate/Switch from Supabase

- **All database code** that referenced Supabase/Postgres must now use SQLite (via chosen Node.js library).
- **Remove Supabase client and its environment dependencies.**
- **All authentication** is now handled in backend.
- **Frontend** should send requests only to backend endpoints (not to Supabase).

---

## 6. Deployment

- All SQLite files and migrations live in the backend repo.
- No external managed DB required.
- Environment: Node.js process, may run locally or on a VM/container.
- DB file path should be configurable via env var.

---

## 7. Next Steps

1. Add SQLite DB adapter and migration/init script.
2. Replace Supabase calls in backend code with local DB logic.
3. Implement authentication endpoints and JWT session handling.
4. Implement CRUD for users, bounties, and claims.
5. Remove all Supabase integration/assets from backend.
6. Update README and API docs.

---

## Appendix: Comparison Table

| Feature    | Supabase                | Final Approach (SQLite + Local Auth)   |
|------------|-------------------------|----------------------------------------|
| DB         | Cloud Postgres          | Local SQLite file                      |
| Auth       | Supabase Auth           | Local (bcrypt + JWT)                   |
| Session    | Supabase tokens         | JWT tokens (express-jwt, jsonwebtoken) |
| Users Tbl  | Profile-only extension  | Single local table                     |
| Migrations | SQL via Supabase        | Node.js migration/init file            |
| API        | Backend & Supabase REST | Backend Express REST                   |

Task completed: Revised plan to use SQLite (local DB), described local authentication and backend responsibilities, preparing for backend migration.
