# FundHorizon API

Express, TypeScript, and MongoDB API for the FundHorizon crowdfunding platform.

## Stack

- Node.js, Express, TypeScript, and Mongoose
- JWT authentication and bcrypt password hashing
- Google ID-token verification
- Stripe Checkout with a development fallback
- Role authorization for supporter, creator, and admin accounts

## Setup

```bash
npm install
copy .env.example .env
npm run seed
npm run dev
```

The seed command creates the admin configured by `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, and `ADMIN_PHOTO`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Run with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run compiled API |
| `npm run seed` | Seed/update the configured admin |
| `npm run typecheck` | Type-check without emitting |

## Environment

Copy `.env.example` and configure MongoDB, JWT, Google, Stripe, imgBB, admin credentials, the client origin, and the server port. Never commit the real `.env` file.

## Main API capabilities

- Registration, login, Google login, JWT profile restoration, and starter credits
- Approved/open campaign discovery, top-funded campaigns, and creator campaign management
- Paginated campaign discovery with category, funding-goal, and deadline filtering
- Public platform statistics for database-backed landing-page metrics
- Paginated supporter contributions and atomic approve/reject/refund processing
- Stripe or fallback credit purchases with payment history
- Creator withdrawal requests and admin processing
- Admin statistics, users, roles, campaign approval, and campaign deletion
- Fraud reports and campaign suspension/deletion
- User-scoped notifications sorted newest-first

## Business rules

- Supporters receive 50 credits and creators receive 20 credits exactly once at registration.
- Credit purchase packages are fixed server-side; clients cannot choose arbitrary prices.
- Purchases use 10 credits per dollar; creator withdrawals use 20 credits per dollar.
- Creators need at least 200 available raised credits to begin withdrawing.
- Pending withdrawals reserve raised credits to prevent duplicate over-withdrawal requests.
- The seed command synchronizes both the assessment admin and demo supporter accounts.
- Dummy credit purchases are limited to development; production requires Stripe configuration.

## Verification

```bash
npm run typecheck
npm run build
```
