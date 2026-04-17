# Deployment Guide — Railway

This app is a Next.js server with a file-backed SQLite database
(`better-sqlite3` via Drizzle ORM). Anything you deploy to needs to satisfy two
things: run the Node server, and **persist the SQLite file across deploys**.

Railway is a good fit because it supports Docker builds and attachable Volumes.

---

## 1. Create the Railway project

1. Sign in at <https://railway.app> and click **New Project → Deploy from GitHub Repo**.
2. Pick this repository. Railway will auto-detect the `Dockerfile` at the project root and start building.
3. Wait for the first build to finish (this is the slow one — native `better-sqlite3` compile + Next.js build).

## 2. Attach a Volume at `/data` (critical)

SQLite data lives at `/data/riven.db` inside the container. Without a Volume the
entire `/data` directory is part of the container's ephemeral filesystem and
**your database is wiped on every deploy, crash, or restart**.

1. In the Railway project, open the service → **Settings → Volumes**.
2. Click **New Volume**.
3. Mount path: `/data`
4. Size: 1 GB is plenty for the foreseeable future (can be resized later).
5. Save. Railway will roll the service to attach the volume.

Verify it's attached:

```bash
railway run ls -la /data
```

## 3. Configure environment variables

Service → **Variables** → add:

| Key                             | Value                                   | Notes                                                 |
| ------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| `RIOT_API_KEY`                  | `RGAPI-...`                             | Riot developer or production key                      |
| `DATABASE_PATH`                 | `/data/riven.db`                        | Must point at the mounted volume                      |
| `NODE_ENV`                      | `production`                            | Normally set automatically, set explicitly if unsure  |
| `NEXT_PUBLIC_RIVEN_CHAMPION_ID` | `92`                                    | Riven's champion id — change only if tracking another |

`PORT` is injected by Railway and respected by `next start`.

## 4. Initialize the database schema

On the very first deploy the volume is empty and `better-sqlite3` will create
an empty `riven.db` file, but the Drizzle tables don't exist yet. Push the
schema once:

```bash
railway run npm run db:push
```

Re-run this whenever `src/lib/db/schema.ts` changes. Drizzle Kit will diff
against the live DB and apply additive changes; destructive changes will
prompt for confirmation.

## 5. Health check

Once deployed, hit:

```
https://<your-service>.up.railway.app/api/health
```

You should get:

```json
{
  "status": "ok",
  "dbSizeBytes": 122880,
  "totalRivenGames": 0,
  "totalPlayersTracked": 0,
  "totalMatchupsTracked": 0,
  "uptime": 42.17
}
```

Set this as Railway's healthcheck path (Service → **Settings → Healthcheck
Path** → `/api/health`) so failed deploys roll back automatically.

Watch counts grow as you scan players from the UI — if `dbSizeBytes` or
`totalRivenGames` ever resets to `0` after a deploy, the Volume isn't mounted
correctly.

## 6. Shipping updates

1. Merge to `main` (or whichever branch is connected to the service).
2. Railway picks up the push, rebuilds the Docker image, and performs a rolling
   deploy.
3. If `src/lib/db/schema.ts` changed, run `railway run npm run db:push`
   immediately after the deploy goes live.

The Volume, and therefore `/data/riven.db`, persists across deploys, so all
scanned game history and matchup stats survive.

## Local Docker smoke test

Mirrors the Railway environment:

```bash
docker build -t riven-gg .
docker run --rm \
  -e RIOT_API_KEY=RGAPI-xxx \
  -e DATABASE_PATH=/data/riven.db \
  -v "$(pwd)/data:/data" \
  -p 3000:3000 \
  riven-gg
```

Visit <http://localhost:3000> to verify the container serves the app, and
<http://localhost:3000/api/health> to verify the DB is readable.

## Troubleshooting

**`SqliteError: no such table: riven_games`** — you skipped step 4. Run
`railway run npm run db:push`.

**Counts reset to 0 after every deploy** — the Volume isn't mounted at `/data`,
or `DATABASE_PATH` doesn't point at it. Re-check step 2 and 3.

**`better-sqlite3` native build fails during Docker build** — Docker's build
cache may be stale. Rebuild with `docker build --no-cache .`. The Dockerfile
installs `python3`, `make`, and `g++` so compilation from source will succeed
if the prebuilt binary can't be fetched.
