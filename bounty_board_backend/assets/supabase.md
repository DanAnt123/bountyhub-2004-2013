# Supabase Integration for Bounty Board Backend

## Project
- Supabase Project: **bounty_board**
- URL: `https://daxokjfnhmiaanrjdlor.supabase.co`

## Environment Configuration

Add the following environment variables to your backend (and frontend, if directly accessing Supabase from client):

```
SUPABASE_URL=https://daxokjfnhmiaanrjdlor.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRheG9ramZuaG1pYWFucmpkbG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODg2ODksImV4cCI6MjA2NzU2NDY4OX0.CWcsZiwKlxPfRBUgoS7W2Y0jGH_7NkM_lYKayEcShIo
```

> ⚠️ **Do not commit secret keys to public source control!**

## Authentication

- **Email/password** authentication should be enabled in your Supabase project (can be configured via Supabase dashboard > Authentication > Providers).
- The users table here refers to a user profile extension. Supabase Auth will auto-manage the core authenticated users.

## Required Database Schema

Supabase API access for schema modification is currently failing for this particular project due to a missing required Postgres function (`public.run_sql`). Please use the Supabase dashboard SQL editor to manually create the following tables and relationships:

### Table: users

(Serves as user profile extension, not as the main auth table.)

| Column       | Type          | Constraints           |
|--------------|---------------|----------------------|
| id           | uuid          | PK, default gen_random_uuid() |
| email        | varchar(255)  | NOT NULL, UNIQUE     |
| username     | varchar(50)   | NOT NULL, UNIQUE     |
| display_name | varchar(100)  |                      |
| created_at   | timestamp     | NOT NULL, default now() |

### Table: bounties

| Column           | Type          | Constraints           |
|------------------|---------------|----------------------|
| id               | uuid          | PK, default gen_random_uuid()|
| title            | varchar(255)  | NOT NULL             |
| description      | text          |                      |
| github_repo_link | varchar(255)  |                      |
| amount           | numeric       | NOT NULL             |
| status           | varchar(32)   | NOT NULL, default 'open' |
| created_by       | uuid          | FK -> users(id)      |
| created_at       | timestamp     | NOT NULL, default now() |

### Table: claims

| Column        | Type        | Constraints                    |
|---------------|-------------|-------------------------------|
| id            | uuid        | PK, default gen_random_uuid() |
| bounty_id     | uuid        | FK -> bounties(id), NOT NULL  |
| user_id       | uuid        | FK -> users(id), NOT NULL     |
| claimed_at    | timestamp   | NOT NULL, default now()       |
| completed_at  | timestamp   |                               |
| status        | varchar(32) | NOT NULL                      |

#### Foreign Key Setup

- bounties.created_by → users.id
- claims.bounty_id → bounties.id
- claims.user_id → users.id

> **Note:** The actual (core) Auth users table is managed by Supabase Auth and cannot be redefined. Only "profile"-type extra fields (like `username`, `display_name`) should be stored in a custom `users` table.

## Troubleshooting

### Known Limitation for This Project

- The Supabase API and automation tools cannot list or modify tables directly for this project because the required Postgres function `public.run_sql` is not available (attempting table listing results in "missing function public.run_sql" errors).  
- **To view, create, or modify tables:**  
  Use the [Supabase Dashboard SQL Editor](https://app.supabase.com/project/daxokjfnhmiaanrjdlor/sql) and manage all schema changes manually.
- Contact Supabase support if this limitation needs to be lifted or for further troubleshooting.

---

_Last updated: [2024-06-16]_
