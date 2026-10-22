# PlzKart

A full-stack e-commerce store built as a college project with **Next.js 15 (App Router)** and **PostgreSQL**.

**Catalog:** Men's shirts and watches, women's beauty products and perfumes (24 products, original SVG artwork).

## Features

- Email + password signup and login (bcrypt hashes, database-backed http-only session cookies)
- Forgot-password flow with single-use, 1-hour email reset links
- Email verification link and welcome email after verification
- Order confirmation email
- Browse by gender / category, search, sort
- Wishlist (add, remove, move to cart)
- Shopping cart with quantity controls and free-shipping threshold
- Demo checkout with address validation (no card data collected, no money charged)
- Order history and per-order detail pages (only visible to the owner)
- Responsive layout

## Tech

| Layer | Choice |
|---|---|
| Framework | Next.js 15, React 19 (server components + route handlers) |
| Database | PostgreSQL via `pg` (Neon / Vercel Postgres / Supabase). Local dev falls back to embedded PGlite |
| Auth | bcryptjs + session table |
| Email | Resend HTTP API or any SMTP server (nodemailer) |
| Hosting | Vercel |

Tables are created and products seeded automatically on first request (`lib/db.js`).

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000, uses embedded PGlite, no setup needed
```

Without an email provider, the verification link is shown on the account page in development.

## Environment variables

See `.env.example`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (required in production) |
| `RESEND_API_KEY` + `EMAIL_FROM` | Send email through Resend |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` | Or send through SMTP (e.g. Gmail App Password) |
| `APP_URL` | Optional base URL for email links |

## Tests

`scripts/e2e.mjs` runs 18 end-to-end checks over HTTP (catalog, signup, verification + welcome email, login, wishlist, cart, checkout, order history, access control) with a built-in SMTP sink:

```bash
npm run build
SMTP_HOST=127.0.0.1 SMTP_PORT=2525 SMTP_USER=test SMTP_PASS=test EMAIL_FROM="PlzKart <no-reply@plzkart.test>" npm start
npm run test:e2e
```

## Project structure

```
app/            pages and API route handlers
  api/          auth, cart, wishlist, checkout, health
  verify/       email verification endpoint
components/     UI (product art, cards, client forms)
lib/            db, auth, email, catalog, store queries
scripts/e2e.mjs end-to-end test
```

> PlzKart is a demo. Payments are simulated.
