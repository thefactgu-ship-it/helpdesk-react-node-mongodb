# Multi-Hotel Production Scale Guide

## Architecture

The app now uses a shared MongoDB database with tenant-scoped records. `Hotel` is the tenant boundary, and operational records such as users, tickets, assets, and problem types carry `hotelId`.

Group-level roles can query across hotels. Hotel-level roles are restricted to their own hotel scope by backend query filters.

## Roles

- `GroupAdmin`: manages all hotels and sees group dashboards.
- `RegionalManager`: sees hotels in assigned regions.
- `HotelAdmin`: manages users, assets, problem types, and tickets for one hotel.
- `Manager`: manages tickets for one hotel.
- `Agent`: works assigned tickets.
- `User`: creates and views allowed tickets.
- `Admin`: legacy alias retained for existing deployments.

## Cloud Managed Baseline

- Frontend: static hosting with CDN.
- Backend: managed Node.js service.
- Database: MongoDB Atlas with automated backups and alerts.
- Files: set `ATTACHMENT_STORAGE_PROVIDER=s3` and configure `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` for production attachments. Keep `local` only for development.
- Environments: use separate `development`, `staging`, and `production` services and databases.

## Required Production Controls

- Rotate `JWT_SECRET` with a managed secret store.
- Restrict `CORS_ORIGIN` per environment.
- Keep rate limits enabled for login, register, and password changes.
- User accounts should be created and reset by administrators from User Management. The login screen does not expose public registration or social login.
- Monitor API error rate, latency, request volume, and MongoDB query performance.
- Review `[AUDIT]` logs for login, user, hotel, ticket, and asset changes.
- Run CI on every pull request before deployment.

## Important Indexes

The backend defines tenant-friendly indexes for:

- `tickets`: `hotelId + createdAt`, `hotelId + status`, `hotelId + assignedTo`, `hotelId + createdBy`
- `assets`: `hotelId + serialNumber`
- `problemtypes`: `hotelId + name`
- `users`: `email + hotelId`

For existing production databases, review old global unique indexes before deploying. Legacy global indexes such as `email_1`, `serialNumber_1`, or `name_1` may need to be dropped after confirming the compound indexes exist.

## Problem Type Index Repair

Existing Atlas databases may still have a legacy unique `name_1` index on `problemtypes`. That old global index blocks creating the same problem type name for different hotels.

After deploying the current backend, run this once against the target environment:

```bash
cd server
MONGO_URI="your-atlas-uri" npm run db:fix-problem-type-indexes
```

On Render, run the same npm script from a one-off shell or job with the production `MONGO_URI` environment variable already configured.

The script:

- Stops and reports records if duplicate problem types already exist within the same hotel.
- Ensures the unique compound index `{ hotelId: 1, name: 1 }`.
- Drops only the legacy unique `{ name: 1 }` index.
- Prints final `problemtypes` indexes for verification.

Confirm Atlas shows no unique `name_1` index on `problemtypes`, and does show `hotelId_1_name_1` as unique.
