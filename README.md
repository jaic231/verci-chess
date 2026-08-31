# Verci Chess

A lightweight community chess leaderboard hosted directly on Cloudflare Workers.
Player profiles, match history, and Elo ratings live in a Cloudflare D1 database.
The production site is available at <https://vercichess.com> and
<https://www.vercichess.com>.

## Requirements

- Node.js 22.13 or newer
- A free Cloudflare account
- Wrangler authenticated with `npx wrangler login`

## Local development

```bash
npm install
npm run cf-typegen
npm run dev
```

The local development server uses a local database. Apply the schema locally
before testing match submission:

```bash
npx wrangler d1 migrations apply verci-chess --local
```

## Validation

```bash
npm test
npm run lint
npx tsc --noEmit
```

## Deployment

The Cloudflare configuration is stored in `wrangler.jsonc`. To apply database
migrations and deploy the site:

```bash
npm run db:migrate
npm run deploy
```

GitHub Actions validates every pull request to `main`. A merge or direct push
to `main` automatically deploys the tested build to Cloudflare and checks the
live `/api/state` endpoint. The repository requires these GitHub Actions
secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Static files are served directly by Cloudflare. Dynamic requests under
`/api/state` and `/api/games` use the D1 database binding named `DB`.

## Data model

- `players`: names, profile photos, ratings, wins, and losses
- `games`: each submitted result and both players' ratings before and after it

New players begin at 1200. Their first game uses a K-factor of 40; later games
use 32.
