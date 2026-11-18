# TrustFlow

A freelance marketplace built on a zero-trust model: clients fund work into escrow, freelancers deliver milestone by milestone, and money is released only after each milestone is approved.

[![CI](https://github.com/aaas72/TrustFlow-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/aaas72/TrustFlow-Platform/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)

## How It Works

```text
Client posts project ─▶ Freelancers bid ─▶ Client accepts a bid
        │
        ▼
Milestone plan agreed ─▶ Client funds milestone (Stripe → escrow)
        │
        ▼
Freelancer submits work ─▶ Client approves or requests revision
        │
        ▼
Funds released to freelancer ─▶ Next milestone unlocks ─▶ Mutual reviews
```

## Features

- **Three roles** — client, freelancer and admin, each with its own dashboard and layout
- **Bidding** — freelancers bid on open projects; accepting a bid locks the project for planning
- **Milestone plans** — work is split into sequential milestones; each one starts only after the previous one is fully approved
- **Escrow payments** — milestones are funded through Stripe payment intents and released on approval, with every movement recorded in a transactions ledger
- **Revisions and attachments** — submissions carry files stored in the database, and clients can request changes
- **Real-time notifications** — Socket.io pushes updates on bids, milestones and payments
- **Reviews** — both sides rate each other when a project completes
- **Security** — JWT authentication, bcrypt password hashing, role checks and centralized error handling

## Architecture

```text
TrustFlow-Platform/
├── client/                 # React 19 + Vite + Tailwind CSS
│   └── src/
│       ├── pages/          # client/ · freelancer/ · admin/ · shared/
│       ├── services/       # API layer (axios)
│       ├── context/ hooks/ components/ types/
├── server/                 # Express 5 REST API + Socket.io
│   ├── routes/             # auth, projects, bids, plans, milestones, payments, reviews, notifications, admin
│   ├── models/             # User, Project, Bid, ProjectPlan, Milestone, Payment, Transaction, Review…
│   ├── middleware/         # auth, errorHandler, logger (Winston)
│   └── migrations/         # incremental SQL migrations (escrow, plans, constraints…)
├── guven_akisi.sql         # base database schema
└── docs/ARCHITECTURE.md    # full design and engineering report
```

The full design rationale — zero-trust escrow, the milestone state machine, file storage strategy and the database model — is documented in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

## Getting Started

**Requirements:** Node.js 20+, MySQL 8, a Stripe test account

### 1. Database

```bash
mysql -u root -p -e "CREATE DATABASE trustflow"
mysql -u root -p trustflow < guven_akisi.sql
# then apply the files in server/migrations/ in date order
```

### 2. API server

```bash
cd server
cp .env.example .env    # DB_*, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
npm install
npm run dev             # http://localhost:3000
```

### 3. Web client

```bash
cd client
npm install
npm run dev
```

## Testing

```bash
cd server && npm test     # Node test runner + Supertest: auth, authorization middleware, error handling
```

The API tests stub the MySQL pool, so no database is needed. Every push and pull request runs the server tests and a full client build in [GitHub Actions](.github/workflows/ci.yml).

## Author

**Abdellah Sheikh** — [abdellahsheikh.dev](https://abdellahsheikh.dev) · [LinkedIn](https://www.linkedin.com/in/abdellahsheikh)
