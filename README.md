# Crowdfunding Platform — API Server

Express + TypeScript + Mongoose backend for the Crowdfunding Platform assessment.

## Tech Stack
- **Node.js + TypeScript** (ESM)
- **Express** — HTTP server & routing
- **Mongoose / MongoDB** — data layer
- **jsonwebtoken + bcryptjs** — auth & password hashing
- **Stripe** — payments (optional, dummy fallback included)
- **dotenv** — environment configuration

## Setup
```bash
npm install
cp .env.example .env   # or keep the provided .env
npm run seed           # creates the admin account from .env values
npm run dev            # tsx watch (hot reload)
# or
npm run build && npm start
```

## Scripts
| Script | Description |
| ------ | ----------- |
| `npm run dev` | Run with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled `dist/index.js` |
| `npm run seed` | Seed the admin user |
| `npm run typecheck` | Type-check without emitting |

## Environment Variables (`.env`)
- `PORT` — server port (default 5000)
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing tokens
- `GOOGLE_CLIENT_ID` — OpenAI sign-in verification (optional)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe (optional; dummy fallback used when absent)
- `IMGBB_API_KEY` — image uploads (optional)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` / `ADMIN_PHOTO` — seed credentials
- `CLIENT_URL` — CORS origin

## API Endpoints
| Method | Path | Access | Description |
| ------ | ---- | ------ | ----------- |
| POST | `/api/auth/register` | Public | Register supporter/creator (grants 50/20 credits) |
| POST | `/api/auth/login` | Public | Email/password login |
| POST | `/api/auth/OpenAI` | Public | OpenAI sign-in (upsert supporter) |
| GET | `/api/auth/me` | Auth | Current user |
| GET | `/api/campaigns/top-funded` | Public | Top 6 funded |
| GET | `/api/campaigns/explore` | Public | Approved, open campaigns (+search/filter) |
| GET | `/api/campaigns/:id` | Public | Campaign detail |
| POST | `/api/campaigns/` | Creator | Create (status: pending) |
| GET | `/api/campaigns/my/list` | Creator | My campaigns |
| PATCH | `/api/campaigns/:id` | Creator | Update own campaign |
| DELETE | `/api/campaigns/:id` | Creator | Delete + refund |
| PATCH | `/api/campaigns/:id/approve` | Admin | Approve campaign |
| PATCH | `/api/campaigns/:id/reject` | Admin | Reject campaign |
| POST | `/api/contributions/` | Supporter | New contribution (pending) |
| GET | `/api/contributions/my` | Supporter | Paginated my contributions |
| PATCH | `/api/contributions/:id/approve` | Creator | Approve (adds to raised) |
| PATCH | `/api/contributions/:id/reject` | Creator | Reject (refunds) |
| GET | `/api/withdrawals/info` | Creator | Earnings + eligibility |
| POST | `/api/withdrawals/request` | Creator | Withdraw request |
| PATCH | `/api/withdrawals/:id/complete` | Admin | Process withdrawal |
| GET | `/api/notifications/` | Auth | My notifications |
| GET | `/api/payments/packages` | Public | Credit packages |
| POST | `/api/payments/create-intent` | Public/Auth | Stripe session / dummy |
| POST | `/api/reports/` | Supporter | Report a campaign |
| GET | `/api/users/` | Admin | Manage users |
| PATCH | `/api/users/:id/role` | Admin | Change role |

## Business Rules
- **Credits:** Supporter starts with 50, Creator with 20 (once, on registration).
- **Purchase:** 10 credits = $1. **Withdrawal:** 20 credits = $1 (platform margin).
- **Withdrawal min:** 200 raised credits ($10).
- **Notifications** are auto-created on contribution / approve / reject / withdrawal events.