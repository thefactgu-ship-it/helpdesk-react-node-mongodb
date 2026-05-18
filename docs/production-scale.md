# Multi-Hotel Production Scale Guide

## Architecture

The app now uses a shared MongoDB database with tenant-scoped records. `Hotel` is the tenant boundary for operational records such as users, tickets, and assets. Problem Types are a shared master list used by every hotel.

Group-level roles can query across hotels. Hotel-level roles are restricted to their own hotel scope by backend query filters.

## Roles

- `GroupAdmin`: manages all hotels and sees group dashboards.
- `RegionalManager`: sees hotels in assigned regions.
- `HotelAdmin`: manages users, assets, tickets for one hotel, and shared problem types.
- `Manager`: manages tickets for one hotel.
- `Agent`: works assigned tickets.
- `User`: creates and views allowed tickets.
- `Admin`: legacy alias retained for existing deployments.

## Cloud Managed Baseline

- Frontend: static hosting with CDN.
- Backend: managed Node.js service on Render. Set the health check path to `/healthz`.
- Database: MongoDB Atlas with automated backups and alerts.
- Files: ticket attachment upload is disabled by default in production. Keep `ATTACHMENT_STORAGE_PROVIDER=disabled` unless object storage is deliberately added later.
- Environments: use separate `development`, `staging`, and `production` services and databases.

## Required Production Controls

- Rotate `JWT_SECRET` with a managed secret store.
- Restrict `CORS_ORIGIN` per environment.
- Keep rate limits enabled for login, register, and password changes.
- Keep public registration disabled in production. Only set `ALLOW_PUBLIC_REGISTRATION=true` for a controlled staging environment or a deliberate signup launch.
- User accounts should be created and reset by administrators from User Management. The login screen does not expose public registration or social login.
- Monitor API error rate, latency, request volume, and MongoDB query performance.
- Review `[AUDIT]` logs for login, user, hotel, ticket, and asset changes.
- Run CI on every pull request before deployment.

## Render Environment Checklist

Backend required variables:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=replace_with_at_least_32_random_characters
CORS_ORIGIN=https://your-frontend.onrender.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_password
ADMIN_NAME=System Admin
ATTACHMENT_STORAGE_PROVIDER=disabled
```

Frontend required variable:

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

Do not set `CORS_ORIGIN` to localhost in production. Do not use local attachment storage on Render production unless you have intentionally provisioned and accepted the limitations of a persistent disk.

## Important Indexes

The backend defines tenant-friendly indexes for:

- `tickets`: `hotelId + createdAt`, `hotelId + status`, `hotelId + assignedTo`, `hotelId + createdBy`
- `assets`: `hotelId + serialNumber`
- `problemtypes`: `name`
- `users`: `email + hotelId`

For existing production databases, review old global unique indexes before deploying. Legacy global indexes such as `email_1`, `serialNumber_1`, or `name_1` may need to be dropped after confirming the compound indexes exist.

## Problem Type Index Repair

Problem Types are now a shared master list. Existing Atlas databases may still have the old unique `hotelId_1_name_1` index from hotel-scoped Problem Types, or duplicate names created per hotel.

After deploying the current backend, run this once against the target environment:

```bash
cd server
MONGO_URI="your-atlas-uri" npm run db:fix-problem-type-indexes
```

On Render, run the same npm script from a one-off shell or job with the production `MONGO_URI` environment variable already configured.

The script:

- Stops and reports records if duplicate problem type names already exist across the master list.
- Ensures the unique master index `{ name: 1 }`.
- Drops the legacy unique `{ hotelId: 1, name: 1 }` index.
- Prints final `problemtypes` indexes for verification.

Confirm Atlas shows `name_1` as unique on `problemtypes`, and does not keep `hotelId_1_name_1` as a unique index.

## Post-Deploy Smoke Test

Run this after every Render production deployment:

1. `GET /healthz` returns 200.
2. `GET /readyz` returns 200 and reports MongoDB connected with storage disabled.
3. Admin login succeeds.
4. Admin can create or verify hotel, department, user, and problem type records.
5. Ticket workflow works: create, assign, update status, and comment.
6. Dashboard and reports show hotel-scoped data.
7. Non-admin roles cannot access admin-only pages or APIs.

Useful commands before deploying:

```bash
cd server
npm run check:syntax
npm audit --audit-level=low

cd ../client
npm run lint
npm run build
npm audit --audit-level=low
```
