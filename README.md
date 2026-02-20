# EVRCadins CRM

A secure CRM and activity tracker for a Medicare insurance agency, built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM, and NextAuth.js.

## Features

- **Authentication**: Google OAuth + email/password credentials
- **RBAC**: Admin, Manager, Agent roles with route and action protection
- **Contacts**: Create/edit/view Medicare prospects with encrypted sensitive data
- **Tasks**: Calendar-oriented task management grouped by due date
- **Activities**: Log calls, meetings, emails per contact
- **Enrollments**: Track Medicare plan enrollments
- **Time Clock**: Clock in/out with browser geolocation capture
- **Audit Logging**: Full audit trail for contacts, tasks, activities, enrollments, and time entries
- **Security**: AES-256-GCM field-level encryption for Medicare numbers, masked UI, secure HTTP headers

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A Google Cloud project (for OAuth)

### 1. Clone and Install

```bash
git clone https://github.com/dmoney25632/evrcadins.git
cd evrcadins
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE evrcadins_dev;
```

### 3. Environment Variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in all values:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/evrcadins_dev"

# NextAuth secret – generate with: npx auth secret
AUTH_SECRET="your-secret-here"

# Google OAuth credentials (see Google OAuth Setup below)
AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# App URL
AUTH_URL="http://localhost:3000"

# AES-256-GCM encryption key – 64 hex characters (32 bytes)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="your-64-char-hex-key"
```

### 4. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output as your `ENCRYPTION_KEY`. **Keep this secret and never commit it.**

### 5. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables: users, accounts, sessions, contacts, tasks, activities, enrollments, time\_entries, audit\_logs.

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Select **Web application**
6. Add **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret** to `.env.local`

---

## Required Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URL | ✅ |
| `AUTH_SECRET` | NextAuth.js secret (min 32 chars) | ✅ |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | For Google sign-in |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | For Google sign-in |
| `AUTH_URL` | Application base URL | ✅ |
| `ENCRYPTION_KEY` | 64-char hex AES-256 key | ✅ |

---

## Security Architecture

### Field-Level Encryption

Medicare numbers are encrypted with **AES-256-GCM** before storage. The encryption key is never stored in the database. Format: `base64(iv):base64(authTag):base64(ciphertext)`.

### Role-Based Access Control

| Feature | Admin | Manager | Agent |
|---|---|---|---|
| View contacts | ✅ | ✅ | Own only |
| Reveal Medicare # | ✅ | ✅ | ❌ |
| User management | ✅ | ❌ | ❌ |

### Sensitive Data Policy

- **Full SSN**: Never stored
- **SSN last 4**: Stored plaintext
- **Medicare number**: Stored AES-256-GCM encrypted; masked in UI for Agents

### Security Headers

Configured via `next.config.ts`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (HSTS)
- `Permissions-Policy: geolocation=(self)` (allows geolocation only from same origin)

### Rate Limiting

Rate limiting is recommended at the infrastructure layer (e.g., nginx, Cloudflare, or Vercel Edge). For application-level rate limiting, consider adding `@upstash/ratelimit` with Redis on the `/api/auth` and sensitive API routes.

### CSRF

NextAuth.js handles CSRF protection for auth flows. API routes use `Authorization` via session cookies with `SameSite` settings managed by NextAuth.

---

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm test          # Run unit tests
npx prisma studio        # Open Prisma Studio (DB GUI)
npx prisma migrate dev   # Run pending migrations
npx prisma generate      # Regenerate Prisma client
```

---

## Project Structure

```
src/
  app/
    (auth)/          # Sign-in, sign-up pages (unauthenticated)
    (protected)/     # App pages (require authentication)
      dashboard/     # Overview with stats and due tasks
      contacts/      # Contact list, detail, create, edit
      tasks/         # Task list grouped by due date
      time-clock/    # Clock in/out with geolocation
    api/             # API routes
      auth/          # NextAuth handlers + register
      contacts/      # Contact CRUD
      tasks/         # Task creation
      time-entries/  # Clock in/out
  components/
    layout/          # Sidebar, AppShell
    ContactForm.tsx  # Shared contact create/edit form
  lib/
    encryption.ts    # AES-256-GCM encrypt/decrypt utilities
    rbac.ts          # Role-based access control helpers
    prisma.ts        # Prisma client singleton
    audit.ts         # Audit log helper
  auth.ts            # NextAuth configuration
  middleware.ts      # Route protection
  __tests__/         # Unit tests
prisma/
  schema.prisma      # Database schema
```

