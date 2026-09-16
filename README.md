# PDF Toolkit

Fast browser-assisted PDF tools for merging, splitting, and cropping PDF files. PDF transforms run locally for immediate interaction. Generated results are also published to PostgreSQL when configured, so a result link can survive refreshes and be opened from another device.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` after the development server starts.

## Result storage

Set `DATABASE_URL` to a PostgreSQL database and create the result table:

```bash
npx drizzle-kit push
```

The result API stores generated PDFs as binary data with a 24-hour default expiry. Configure limits with `PDF_RESULT_MAX_BYTES` and `PDF_RESULT_TTL_MS`. Each result uses a random opaque id; there is no account system yet, so anyone who has a result URL can download that result. Without `DATABASE_URL`, the app remains usable with current-tab fallback storage.

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
3. Add `DATABASE_URL` and optionally `PDF_RESULT_MAX_BYTES`, `PDF_RESULT_TTL_MS`, and the `NEXT_PUBLIC_*` limit values in **Project Settings > Environment Variables**. `DATABASE_URL` enables durable, multi-instance result storage.
4. Deploy. Vercel will use `npm run build` automatically.

No upload bucket or writable filesystem is required: PDF processing happens in the browser and durable results use PostgreSQL.

## Health check

`GET /api/health` returns:

- `200` with `{ "ok": true }` when `DATABASE_URL` is configured and PostgreSQL is reachable.
- `503` with `{ "ok": false, "reason": "database_not_configured" }` when no database is configured.
- `500` when the configured database cannot be reached.