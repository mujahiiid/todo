# Ritual

Ritual is a mobile-first, bilingual personal routine tracker built with Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase, and dnd-kit. It uses a calm notes-inspired interface, dynamic recurring occurrences, Saturday–Friday weeks, archived weekly summaries, structured PDF reports, and a PWA/web-push foundation.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. When Supabase variables are blank, the app intentionally starts in local demo mode and persists changes in `localStorage`. This makes the complete interaction model reviewable without credentials. With Supabase configured, `/app` is protected and `/login` uses email/password authentication.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/202609210001_initial_schema.sql` in the SQL editor or with `supabase db push`.
3. Copy the project URL and anon key into `.env.local`.
4. Add the service-role key only to the server/deployment environment. Never expose it with a `NEXT_PUBLIC_` prefix.
5. Add `http://localhost:3000/auth/callback` and the production callback URL to the Supabase authentication redirect allowlist.

The migration creates profiles, user settings, pages, blocks, tasks, task slots, completion logs, push subscriptions, notification logs, weekly archives, and a per-user offline-sync snapshot. RLS is enabled on every user-owned table. Direct ownership policies use `auth.uid()`; child tables verify ownership through their parent page/task. The snapshot lets the optimistic editor sync atomically while normalized task/history tables remain available for reporting and scheduled work.

## Environment variables

See `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: public Supabase client configuration.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only cron access.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`: Web Push credentials.
- `CRON_SECRET`: bearer token required by both cron routes.

Generate VAPID keys with `npx web-push generate-vapid-keys`. Store private values only in local/deployment secrets.

## Recurrence and week model

Tasks store one recurrence definition (`daily`, selected weekdays, weekly, one-time, or interval) and any number of labeled time slots. The UI derives occurrences for the visible date range; it does not create future task rows. Only a non-pending completion is stored, identified by task, occurrence date, and slot.

Weeks default to Saturday through Friday. `lib/week.ts` calculates the containing week for any date and covers month/year transitions in `tests/week.test.ts`. Starting a new week changes the active view logically, so old status never leaks into it. The weekly cron writes idempotent archive rows using the unique `(user_id, week_start)` constraint.

## Reports

`GET /api/reports` creates a real PDF with `pdf-lib`; it does not screenshot the interface. The bundled Noto Sans Arabic variable font supports English and Arabic text. Use `?pageId=<uuid>` for one page or omit it for all pages, and `?week=YYYY-MM-DD` to regenerate an archived week. Production data can replace the included demo projection through the same report boundary.

## PWA and notifications

`app/manifest.ts`, `public/sw.js`, and the maskable SVG icon make the site installable. The service worker caches the app shell and handles push notifications. Notification permission is requested only after the user presses Enable in Settings.

Subscriptions are validated and upserted through `POST /api/push/subscribe`. `GET /api/cron/reminders` is protected by `Authorization: Bearer $CRON_SECRET`, evaluates due work in each user's timezone, and delivers it with VAPID. Delivery attempts are keyed per task/slot/date to prevent duplicates.

## Cron setup

The included GitHub Actions workflow calls `/api/cron/reminders` every five minutes. Add these encrypted repository secrets under **Settings → Secrets and variables → Actions**:

- `APP_URL`: the stable production origin, for example `https://your-project.vercel.app` (without a trailing path).
- `CRON_SECRET`: exactly the same value configured in the Vercel production environment.

The workflow sends `Authorization: Bearer $CRON_SECRET`, has a three-minute job timeout, retries transient failures twice, prevents overlapping runs, and can also be started manually from the Actions tab. Scheduled GitHub Actions may start a few minutes late during periods of high platform load.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deploy to Vercel

1. Import the repository into Vercel.
2. Add every required environment variable in Project Settings.
3. Apply the Supabase migration before the first production login.
4. Add the production `/auth/callback` URL to Supabase.
5. Deploy, verify PWA installation over HTTPS, then schedule the two protected cron routes.

The app is designed around narrow client islands: Next.js handles routing, metadata, auth callback, PDFs, push subscriptions, and cron endpoints; the interactive editor uses a focused client provider for optimistic local interactions. Supabase RLS remains the production security boundary.
"# todo" 
