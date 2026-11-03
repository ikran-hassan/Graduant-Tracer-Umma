# Graduant Tracer — Umma University

Graduant Tracer is a role-based graduation clearance system for Umma University. It provides a shared workspace where graduands can follow their clearance progress, university staff can review requests assigned to their offices, and administrators can manage accounts and monitor clearance activity.

The repository contains the React web application, the Node.js API and SQLite database, and an Android WebView application that opens the hosted web system.

## Application screenshots

The screenshots below are the original screenshots already included in this repository. They are linked directly from the repository; no replacement or generated images have been added.

### Sign-in

![Graduant Tracer sign-in screen](<WhatsApp Image 2026-10-22 at 23.48.15.jpeg>)

### Graduand portal

**Overview and clearance progress**

![Graduand dashboard](<WhatsApp Image 2026-10-22 at 23.48.15 (1).jpeg>)

**My clearance stages**

![Graduand clearance stages](<WhatsApp Image 2026-10-22 at 23.48.15 (2).jpeg>)

### Staff portal

**Office overview**

![Staff overview](<WhatsApp Image 2026-10-22 at 23.48.16.jpeg>)

**Office clearance queue**

![Staff clearance queue](<WhatsApp Image 2026-10-22 at 23.48.16 (1).jpeg>)

### Administrator portal

![Administrator dashboard](<WhatsApp Image 2026-10-22 at 23.48.16 (2).jpeg>)

## Main features

### Graduand
- Sign in to a personal graduand portal.
- View the eight graduation clearance stages and their current statuses.
- Submit the next eligible uncleared stage for review.
- See staff feedback when corrections or further action are required.
- View payment-intent records.

### Office staff
- Sign in with an office-assigned staff account.
- View the clearance queue for the assigned office.
- Mark eligible requests as cleared or request action from the graduand.
- Add a comment when further action is required.

The configured offices are Finance Office, University Library, Department / HoD, ICT Services, Accommodation / Hostel, Student Affairs, Academic Registry, and Final Graduation Approval.

### Administrator
- View graduand records and clearance activity.
- Create and manage user accounts.
- Review requests across offices.
- View audit activity.

## Technology stack

| Area | Technology |
|---|---|
| Web frontend | React 18, Vite 6, JavaScript, Lucide React |
| Backend API | Node.js 20, Express 4 |
| Database | SQLite with better-sqlite3 |
| Authentication | JSON Web Tokens (JWT), bcryptjs password hashing |
| Security middleware | Helmet, CORS |
| Android application | Native Android Java WebView |
| Hosting configuration | Render |

## Repository structure

```text
.
├── android/                 # Android WebView application
│   └── app/
├── server/                  # Express API and SQLite database
│   ├── data/
│   ├── src/
│   │   ├── db.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── web/                     # React + Vite frontend
│   ├── public/
│   ├── src/
│   └── package.json
├── render.yaml              # Render service configuration
├── DEPLOYMENT.md            # Hosting and Android sharing notes
└── README.md
```

## Requirements

- Node.js **20.x** (the repository specifies Node 20.18.0).
- npm.
- Git.
- Android Studio and an Android SDK/Gradle environment if you want to build the Android application.

## Run locally

### 1. Clone the repository

```bash
git clone https://github.com/ikran-hassan/Graduant-Tracer-Umma.git
cd Graduant-Tracer-Umma
```

### 2. Configure the backend

```bash
cd server
npm install
```

Copy the example environment file and edit the values:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux**
```bash
cp .env.example .env
```

Set a strong, private `JWT_SECRET` and configure the account seed variables for your environment. Do not commit your real `.env` file or production secrets to Git.

Start the API:

```bash
npm run dev
```

The API listens on port `4000` by default. Its health endpoint is:

```text
http://localhost:4000/api/health
```

### 3. Run the web frontend

Open a second terminal from the repository root:

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). During local development, Vite proxies `/api` requests to the backend at `http://127.0.0.1:4000`.

### 4. Build the web frontend

From the `web` directory:

```bash
npm run build
```

The production frontend is generated in `web/dist`. When that directory exists, the Express server serves the built frontend as well as the API.

## Environment variables

The example configuration is in `server/.env.example`.

| Variable | Purpose |
|---|---|
| `PORT` | API listening port (defaults to 4000) |
| `JWT_SECRET` | Secret used to sign authentication tokens; set a strong private value |
| `WEB_ORIGIN` | Example frontend origin setting |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seed administrator account configuration |
| `STAFF_EMAIL`, `STAFF_PASSWORD` | Seed Finance Office staff account configuration |
| `GRADUAND_EMAIL`, `GRADUAND_PASSWORD` | Seed graduand account configuration |

The database setup also seeds the configured office staff accounts. Seed accounts are intended for initial/demo setup; change credentials and review account access before using the system with real users.

## API overview

The frontend communicates with the backend through the `/api` prefix. The implemented routes include:

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/health` | API health check | Public |
| POST | `/api/auth/login` | Sign in | Public |
| GET | `/api/auth/me` | Current account profile | Authenticated |
| POST | `/api/auth/change-password` | Change password | Authenticated |
| GET | `/api/workspace` | Load role-specific workspace | Authenticated |
| POST | `/api/clearance/submit` | Submit next eligible clearance stage | Graduand |
| POST | `/api/clearance/decision` | Clear a request or request action | Staff / Admin |
| POST | `/api/payments/intents` | Create a payment intent record | Graduand |
| GET | `/api/admin/users` | List user accounts | Admin |
| POST | `/api/admin/users` | Create a user account | Admin |
| GET | `/api/admin/audit` | View audit events | Admin |

All protected routes require a bearer token. The API checks the signed-in account and enforces role and, for staff decisions, assigned-office permissions on the server.

> **Payment note:** The current payment endpoint records a payment intent. It does not itself charge a mobile-money wallet or confirm a completed payment through a payment provider.

## Android application

The Android project is a native Java WebView wrapper around the hosted web application. Its launch URL is configured in:

`android/app/src/main/java/ke/ac/umma/graduanttracer/MainActivity.java`

Update `PRODUCTION_URL` (and `START_URL`, if required) to the correct HTTPS deployment URL before building an APK for distribution.

The Android project uses application ID `ke.ac.umma.graduanttracer`, minimum SDK 23, and target SDK 35.

Build instructions and the existing hosting notes are also available in [DEPLOYMENT.md](DEPLOYMENT.md).

## Deployment

The repository includes a Render Blueprint at [render.yaml](render.yaml). It configures a Node web service with:

- Root directory: `server`
- Build command: `npm install && cd ../web && npm install && npm run build`
- Start command: `npm start`
- Node version: `20.18.0`
- A generated `JWT_SECRET` environment variable

Review the hosting plan and database-storage requirements before deploying. The application currently uses a local SQLite database file under `server/data`. A host with an ephemeral filesystem can lose local database changes when the service restarts or redeploys. For persistent production data, configure durable storage for the SQLite database or migrate to a managed persistent database, and establish regular backups.

After deployment, set the Android WebView URL to the deployed HTTPS address.

## Security and operational notes

- Keep production secrets in the hosting provider's environment settings, not in source control.
- Use unique, strong passwords for all real accounts and replace any demo credentials.
- Keep HTTPS enabled for public deployments.
- Back up persistent database data and test the restore process.
- Payment intents should not be represented as completed payments until a payment provider integration verifies them.

## Current project status

The repository contains the application source and deployment configuration. The package scripts currently define frontend development, build and preview commands, and backend development and start commands. No automated test script is currently defined in the package manifests.

## License

No license file is currently included in this repository. Contact the repository owner for permission before reusing or distributing the project.
