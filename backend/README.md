Sashvi Backend (Express + Supabase)

Quick scaffold for the backend API used by the Sashvi Studio frontend.

Features included:

- Express server (TypeScript)
- Supabase client wrapper
- Email sending via SMTP (nodemailer)
- JWT access/refresh helpers
- Auth routes: register, verify, resend verification, login

Setup

1. Copy `.env.example` to `.env` and fill values.
2. Create tables in Supabase: `users` table with columns: id (uuid, primary key), name (text), email (text, unique), password_hash (text), is_verified (boolean), verify_token (text), verify_expires (timestamp)
3. From `backend` folder, install dependencies:

```bash
cd backend
npm install
npm run dev
```

Deployment

Deploy to Render as a Docker or Node service. Ensure environment variables are set (SUPABASE_SERVICE_KEY must be the service role key).
