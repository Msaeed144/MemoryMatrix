# Hamkar Games - Merged Games Platform

Welcome to Hamkar Games! Two memory games with FastAPI auth and PostgreSQL score storage.

## Quick start (Docker)

```bash
cp .env.example .env
# Edit JWT_SECRET before production use
docker compose up -d --build
```

The full app listens on **`0.0.0.0:1234`** (HTTP).

- Direct: http://127.0.0.1:1234  
- Public: point host nginx at that port (see below)

## Deploy on the server

```bash
# In the project folder on the server:
cp .env.example .env   # set JWT_SECRET + POSTGRES_PASSWORD
docker compose up -d --build

# Check locally on the server:
curl -s http://127.0.0.1:1234/api/health
# → {"status":"ok"}

curl -sI http://127.0.0.1:1234/ | head -1
# → HTTP/1.1 200 OK
```

Host nginx (TLS) should proxy to `http://127.0.0.1:1234` — see
[`deploy/host-nginx.games.kashefteam.org.conf`](deploy/host-nginx.games.kashefteam.org.conf).

Important: use `proxy_set_header Connection "";` (not `"upgrade"`) unless you need WebSockets.

Public checks:
- Site: https://games.kashefteam.org/
- API: https://games.kashefteam.org/api/health
- Docs: https://games.kashefteam.org/docs


## Project structure

```
├── index.html / styles.css / landing.js
├── js/                     # API client + auth modal
├── memory-matrix/ / on-click/
├── backend/                # FastAPI
├── docker-compose.yml      # binds web to 0.0.0.0:1234
├── nginx.conf              # in-container static + /api proxy
└── deploy/                 # host nginx example (NOT served publicly)
```

## API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/signup` | no | `{ name, phone }` |
| POST | `/api/auth/login` | no | `{ phone }` |
| GET | `/api/auth/me` | yes | Current user |
| POST | `/api/scores/` | yes | Save a game result |
| GET | `/api/scores/me` | yes | Your history |
| GET | `/api/scores/leaderboard?game=match\|matrix` | yes | Top scores |
| GET | `/api/health` | no | Health check |

## Auth

- Sign up: name + phone  
- Sign in: phone  
- JWT in browser localStorage  

## Production checklist

- Change `JWT_SECRET` and `POSTGRES_PASSWORD` in `.env` (special characters like `@` are fine)  
- Postgres only reads `POSTGRES_PASSWORD` when the volume is first created. To change it later without losing data:  
  `docker compose exec -T db sh -c 'echo "ALTER USER CURRENT_USER WITH PASSWORD :''pw'';" | psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v pw="$POSTGRES_PASSWORD"'` (after `docker compose up -d db`), then `docker compose restart api`  
- Keep Postgres unpublished (default)  
- Prefer HTTPS on the host nginx  
- Do not open `index.html` as a file — use the Docker URL  
