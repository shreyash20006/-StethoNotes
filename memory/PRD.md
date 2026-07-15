# StethoNotes — PRD & Implementation Log

**Project:** StethoNotes  
**Website:** https://www.stethonotes.store  
**Mission:** India's largest student-powered digital marketplace for Medical & Paramedical notes.

**Stack:**
- Frontend: React + Vite + TypeScript + TailwindCSS + Framer Motion
- Backend: Supabase (Postgres, Storage, Edge Functions in Deno)
- Payments: Razorpay
- Emails: Brevo
- Hosting: Vercel

---

## Existing Architecture (baseline before Phase 1)

**Frontend pages:** Landing, Login (student/seller/admin + Google OAuth), Cart, Checkout, Courses, Product Detail, Student Dashboard, Seller Dashboard, Admin Panel, Order Confirmation/Lookup, Download, Privacy/Terms.

**Admin modules:** RevenueAnalytics, EmailCenter, NoteUploadWizard, NotesManager, PayoutManager, SellerManager, ReviewsCoupons, SettingsLogs, StorageSEO, LeakInvestigator.

**Edge Functions:**
- `razorpay` — create-order, verify-payment, webhook, resend-email
- `send-order-email` — standalone Brevo dispatcher
- `download-notes` — signed URL + **PDF watermarking** (pdf-lib) with buyer name/email/order#/date

**Buckets:** `notes-pdfs` (private, signed), `previews` (public), `thumbnails` (public).

---

## PHASE 1 — Payment & Security Hardening (Jan 18, 2026)

### What was implemented

**1. Refund System (end-to-end)**
- New DB table `refunds` with RLS: owner can read/insert own; admin can update all.
- Student "Request Refund" button + modal in `DashboardPage.tsx` (only shown for orders ≤ 7 days old, not already refunded).
- Admin `RefundsManager.tsx` component under sidebar → **"Refund Requests"** tab. Filters by status, one-click Approve (calls Razorpay refund API), Reject with notes.
- New Edge Function action `create-refund` in `razorpay` function. Calls Razorpay `/payments/:id/refund`, updates DB, sends Brevo confirmation email.
- Refund events (`refund.processed`, `refund.failed`) now handled in webhook.

**2. Payment/Webhook/Refund Logging**
- New tables: `payment_logs`, `webhook_logs`, `refunds`. All with admin-only RLS read.
- `webhook_logs` has idempotency via `x-razorpay-event-id` (prevents duplicate processing).
- New Admin component `PaymentLogsViewer.tsx` — 3 tabs (Payment / Webhook / Email logs), 200 latest, JSON details modal.
- New sidebar tab: **"Payment & Webhook Logs"**.

**3. Enhanced Webhook Handler**
- All events now logged to `webhook_logs` (received/processed/failed/duplicate).
- Handles: `order.paid`, `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`.
- Auto-recovery: if `verify-payment` missed (e.g. user closed tab), webhook creates the order.
- Idempotency via event ID prevents double-processing on Razorpay retries.

**4. Frontend Bug Fix**
- Cart.tsx no longer silently claims "email delivered successfully" when `email_delivery_failed=true` is returned from server. Now surfaces a proper info toast pointing user to Dashboard → Orders.

**5. Order Type Extension**
- `Order.payment_status` now includes `'refunded'`.
- `Order.refund_status` added: `'none' | 'requested' | 'approved' | 'rejected' | 'processed'`.
- New `Refund` type exported.

### Files changed / created

| File | Change |
|------|--------|
| `supabase/migrations/20260118000000_phase1_payment_hardening.sql` | **NEW** — creates `webhook_logs`, `payment_logs`, `refunds` tables + RLS + trigger + adds `orders.refund_status` |
| `supabase/functions/razorpay/index.ts` | Added `create-refund` action; extended webhook to log to `webhook_logs`, handle refund/payment.failed events, idempotency; added `payment_logs` inserts in verify-payment |
| `src/pages/DashboardPage.tsx` | Added refund request modal + button on order cards + refund state tracking |
| `src/pages/Cart.tsx` | Fixed silent email-failure bug; now surfaces `email_delivery_failed` |
| `src/pages/AdminPage.tsx` | Added `RefundsManager` and `PaymentLogsViewer` tabs to sidebar |
| `src/components/admin/RefundsManager.tsx` | **NEW** — full refund review UI (approve/reject) |
| `src/components/admin/PaymentLogsViewer.tsx` | **NEW** — 3-tab log viewer with JSON detail modal |
| `src/types/index.ts` | Extended `Order`, added `Refund` interface |
| `src/pages/PrivacyPolicyPage.tsx` | Rewritten for Google OAuth verification (Limited Use disclosure, data deletion) |
| `src/pages/LandingPage.tsx` | Image URL swap (Cloudinary) |

### Migration to apply (Supabase Dashboard → SQL editor)

Run: `/app/supabase/migrations/20260118000000_phase1_payment_hardening.sql`

### Env vars required (already in place from earlier setup — verify)

Edge Function secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `BREVO_API_KEY`, `FROM_EMAIL`, `FROM_NAME`, `SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

### Webhook endpoint (Razorpay Dashboard config)

**URL:** `https://<PROJECT-REF>.supabase.co/functions/v1/razorpay/webhook`  
**Secret:** value of `RAZORPAY_WEBHOOK_SECRET`  
**Events to subscribe:** `order.paid`, `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`

---

## Backlog (future phases)

### Phase 2 — Seller Trust & Payouts
- P0: Wallet system (`wallets`, `wallet_transactions`, `withdrawal_requests`) + Seller Wallet UI
- P0: Seller KYC document upload (`seller_documents`) + admin verification
- P1: Invoice PDF generation (GST-compliant)

### Phase 3 — Growth & Retention
- P1: Support Tickets (`tickets`, `ticket_messages`)
- P1: Referral system (unique codes, coin rewards, leaderboard)
- P2: Failed Email retry queue (pg_cron)
- P2: UI polish — glassmorphism, dark mode toggle, richer animations

### Deferred (evaluate demand first)
- CMS Homepage builder
- Blog + Newsletter
- Gamification (XP, streaks, achievements)
- Product versioning
- Bulk note upload (CSV)
- Multi-language support
- PWA
