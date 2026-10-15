# Graduant Tracer — Umma University

Full-stack source project with three connected portals:
- Graduand portal: view clearance stages, submit the next stage, create payment intents, view status.
- Staff portal: review requests for the office assigned to the signed-in staff account.
- Administrator portal: shared dashboard, manage account roles/offices, review all clearance requests.

The frontend, backend, and Android Studio wrapper are in this repository. The three portals use the same SQLite database and API; role permissions are checked by the backend.

## Requirements
- Node.js 20 or newer
- Android Studio (for the Android wrapper)
- Android SDK / an emulator or Android device

## 1. Start the full-stack web app locally
From the project root:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

In a second terminal:

```bash
cd ../web
npm install
npm run dev
```

Open http://localhost:5173.

Vite proxies `/api` calls to the backend on port 4000. The database is created at `server/data/clearance.sqlite` on first start.

## 2. Development sign-in accounts
These are local-development accounts created on first server start. Change passwords before any real deployment.

| Portal | Email | Password |
|---|---|---|
| Administrator | admin@umma.local | ChangeMeAdmin123! |
| Staff — Finance Office | finance@umma.local | ChangeMeStaff123! |
| Graduand | graduand@umma.local | ChangeMeStudent123! |

The backend reads the seeded accounts from environment variables. Update `server/.env` before starting the server. If the database already exists, changing seed variables does not reset existing passwords; delete `server/data/clearance.sqlite` only if you intentionally want to reset the local development database.

## 3. Run in Android Studio
The Android app is a WebView shell for the local web frontend. Keep the backend and frontend running on your development computer.

1. Open Android Studio.
2. Select **Open** and choose the `android/` folder.
3. Let Gradle sync and install an emulator (or connect a phone).
4. Run the `app` configuration.
5. The Android emulator loads `http://10.0.2.2:5173`, which maps to your computer's localhost from the emulator.

For a physical Android phone, edit `android/app/src/main/java/ke/ac/umma/graduanttracer/MainActivity.java` and replace `10.0.2.2` with your computer's LAN IP address. Ensure both devices are on the same trusted network and the computer firewall permits ports 5173 and 4000.

For production, deploy the frontend and backend to HTTPS hosting, then change `START_URL` in `MainActivity.java` to the HTTPS frontend URL. Do not publish the local development accounts.

## 4. Production security checklist
- Replace all development passwords and use a long random `JWT_SECRET`.
- Use HTTPS, secure hosting, database backups, and access monitoring.
- Configure real university identity/SSO only with an approved integration contract.
- Payment records created here are **payment intents only**. This project does not charge M-Pesa or confirm payments. Add an approved provider integration and verify signed callbacks before recording a payment as paid.
- Confirm the official clearance offices and order with Umma University before using the proposed default workflow.
- Configure approved email addresses and role assignments; do not give staff accounts broader permissions than required.

## Structure
- `web/` — React + Vite frontend
- `server/` — Express API, JWT authentication, SQLite persistence
- `android/` — Android Studio WebView shell
