# Dokploy Deployment

## Application

- Provider: Dockerfile
- Branch: `7-Pulse`
- Dockerfile path: `./Dockerfile`
- Port: `3000`

## Required Environment Variables

Set these in Dokploy before deploying:

```env
DATABASE_URL=
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=
EMAIL_FROM=AudioRent <noreply@your-domain.com>
ADMIN_EMAIL=
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=AudioRent
```

## Database

Create a PostgreSQL service in Dokploy, then use its internal connection string for `DATABASE_URL`.

The container runs:

```sh
npx prisma db push
npx tsx prisma/seed.ts
node server.js
```

That means the database schema is applied when the container starts, not while the Docker image is being built.
