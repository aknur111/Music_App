---
name: Payment System Architecture
description: Provider-based payment/subscription system added May 2026 — Halyk ePay primary, local dev fallback, gRPC-based
type: project
---

Full payment system built and wired into the music app.

**Why:** Product directive to add subscription billing (Free / Premium Monthly / Premium Yearly).

**Architecture:**
- New microservice: `backend/payment-service` on gRPC port 50056, Postgres port 5438
- Module: `github.com/music-app/payment-service`
- Provider interface: `CreateCheckout / VerifyPayment / RefundPayment`
- Providers: Halyk ePay (production, needs credentials) + local (dev mode, no credentials needed)
- Config: `PAYMENT_PROVIDER=local` (default) or `halyk` when `HALYK_CLIENT_ID` is set

**Plans seeded:**
- free — 0 ₸, unlimited
- premium_monthly — 1990 ₸, 30 days
- premium_yearly — 19990 ₸, 365 days

**API routes (via api-gateway):**
- `GET  /api/v1/payments/plans` — list plans (public)
- `POST /api/v1/payments/checkout` — create checkout (auth required)
- `GET  /api/v1/payments/subscription` — current user subscription (auth required)
- `GET  /api/v1/payments/` — list my payments (auth required)
- `GET  /api/v1/payments/:id` — get payment (auth required)
- `POST /api/v1/payments/callback/:provider` — provider webhook (no auth)

**Local dev flow:**
1. POST /checkout → returns `checkout_url = http://localhost:5173/billing/dev-checkout?payment_id=xxx`
2. Frontend DevCheckoutPage shows Confirm/Cancel buttons
3. Click Confirm → POST /api/v1/payments/callback/local with success=true
4. Payment verified → subscription activated → redirect to /billing/success

**Frontend pages added:**
- `/premium` — PremiumPage with plan comparison and checkout
- `/billing/success` — polls payment status, shows success
- `/billing/failure` — shows failure with retry
- `/billing/dev-checkout` — dev-only mock checkout simulator

**Files created:**
- backend/proto/payment/payment.proto
- backend/payment-service/** (full service)
- backend/api-gateway/internal/client/payment.go
- frontend/src/types/payment.ts
- frontend/src/services/payment.service.ts
- frontend/src/store/subscriptionStore.ts
- frontend/src/pages/app/PremiumPage.tsx
- frontend/src/pages/billing/{SuccessPage,FailurePage,DevCheckoutPage}.tsx

**How to apply:** When adding Kaspi later, implement `provider.Provider` interface in `internal/provider/kaspi/kaspi.go`, register in main.go `buildProviders()`, set `PAYMENT_PROVIDER=kaspi`.
