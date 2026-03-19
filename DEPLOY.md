# Deploy

## Backend -> Render

Repo ichida `render.yaml` tayyor. Render dashboardda:

1. `New +` -> `Blueprint`
2. GitHub repo: `Jamshidjalolov/web-game`
3. Blueprint sync qiling

Render quyidagilarni yaratadi:

- `game-web-api` web service

Blueprint endi Render Postgres yaratmaydi. `DATABASE_URL` ga o'zingizning PostgreSQL
connection string'ingizni kiritasiz.

Masalan:

```env
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST:5432/DB_NAME
```

Backend URL odatda:

`https://game-web-api.onrender.com`

## Frontend -> Vercel

Repo ichida `vercel.json` tayyor.

Vercel dashboardda:

1. `Add New` -> `Project`
2. GitHub repo: `Jamshidjalolov/web-game`
3. Framework: `Vite`
4. Root directory: `.`

Vercel env vars:

```env
VITE_API_BASE_URL=https://game-web-api.onrender.com
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## CORS

Backend `https://*.vercel.app` uchun default tayyorlangan. Agar custom domain ishlatsangiz,
Render env ichida `CORS_ORIGINS`ga o'sha domainni ham qo'shing.
