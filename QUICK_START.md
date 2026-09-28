# Quick Start

## 1. Start the stack

```bash
cp .env.example .env
docker compose up -d --build
```

App is available at **http://127.0.0.1:1234** (all interfaces: `0.0.0.0:1234`).

## 2. Public domain (server)

Add the host nginx config from [`deploy/host-nginx.games.kashefteam.org.conf`](deploy/host-nginx.games.kashefteam.org.conf) so `games.kashefteam.org` proxies to `127.0.0.1:1234`.

## 3. Play

1. Open the site (local `:1234` or `games.kashefteam.org`)
2. Sign in with phone (new users: name + phone)
3. Play Memory Matrix or Memory Match — scores save to the database

---

## Game tips

### Memory Matrix
Watch the pattern, then replay it. Difficulty rises with level.

### Memory Match
Answer Yes/No if the symbol matches the previous one. Streaks multiply score; 3 lives.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Connection refused on :1234 | `docker compose ps` — ensure `web` is up |
| Domain shows 502 | Host nginx must proxy to `127.0.0.1:1234`; stack must be running |
| Cannot save score | Sign in first; check `/api/health` on the same host |
| Reset database | `docker compose down -v` then `docker compose up -d --build` |
