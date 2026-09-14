# PDF Toolkit

Browser-based PDF tools for merging, splitting, and cropping PDF files.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` after the development server starts.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

The linter currently reports only Next.js image optimization warnings for PDF preview images.

## Deploy to Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, select **Add New Project**, import the repository, and keep the detected Next.js settings.
3. Add the variables from `.env.example` in **Project Settings > Environment Variables**. The three `NEXT_PUBLIC_*` values are optional and have defaults. `DATABASE_URL` is optional unless you want `/api/health` to verify a PostgreSQL connection.
4. Deploy. Vercel will use `npm run build` automatically.

No upload bucket or writable filesystem is required: PDF processing and downloads happen in the browser. Generated results are held in the current browser tab, so a result URL is not intended to survive a full page refresh.

## Health check

`GET /api/health` returns:

- `200` with `{ "ok": true }` when `DATABASE_URL` is configured and PostgreSQL is reachable.
- `503` with `{ "ok": false, "reason": "database_not_configured" }` when no database is configured.
- `500` when the configured database cannot be reached.