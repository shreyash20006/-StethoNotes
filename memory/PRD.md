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

**Edge Functions (baseline):**
- `razorpay` — create-order, verify-payment, webhook, resend-email
- `send-order-email` — standalone Brevo dispatcher
- `download-notes` — signed URL + **PDF watermarking** (pdf-lib) with buyer name/email/order#/date

**Buckets (baseline):** `notes-pdfs` (private, signed), `previews` (public), `thumbnails` (public).

---

## PHASE 1 — Payment & Security Hardening (Jan 18, 2026) ✅

- **Refund system end-to-end** (Student modal + Admin manager + Razorpay refund API + Brevo email)
- **Enhanced webhook** (idempotency, refund events, failed events, `webhook_logs` persistence)
- **Full audit trail** (`payment_logs`, `webhook_logs`, `refunds` tables + `PaymentLogsViewer` admin UI)
- **Bug fix**: Cart no longer silently claims "email delivered" when it failed
- New migration: `20260118000000_phase1_payment_hardening.sql`

---

## PHASE 2 + 3 — Wallet, KYC, Invoices, Tickets, Referrals (Jan 19, 2026) ✅

### 1. Seller Wallet + Withdrawal System (P0)
- New tables: `wallets`, `wallet_transactions`, `withdrawal_requests`
- **Auto-credit on sale**: `runPostOrderHooks()` in `razorpay` function credits seller at **70% commission rate** (config: `SELLER_COMMISSION_RATE` const). Idempotent via `reference_type='order_item'`.
- **Seller UI**: `SellerWallet.tsx` — balance card, transaction history, withdrawal modal (UPI/bank), request history. Minimum withdrawal ₹500.
- **Admin UI**: `WithdrawalsManager.tsx` — approve/reject/mark-paid flow. Marking paid debits wallet + logs transaction with UTR ref.
- New sidebar tabs: Seller Dashboard → **Wallet**; Admin → **Seller Withdrawals**.

### 2. Seller KYC Documents (P0)
- New table: `seller_documents` (doc_type: `college_id | govt_id | pan | bank_proof | address_proof`)
- New private Storage bucket: `seller-documents` with RLS (owner uploads to their own folder; admin can read all)
- **Seller UI**: `SellerKYC.tsx` — 4 doc cards with drag-drop upload (5MB max, JPG/PNG/PDF), status badges, re-upload on rejection
- **Admin UI**: `SellerKYCReview.tsx` — table view with signed-URL preview link, Approve/Reject with notes
- New sidebar tabs: Seller Dashboard → **KYC**; Admin → **Seller KYC Review**

### 3. Invoice PDF Generation (P0)
- New table: `invoices` (invoice_number sequence, storage_path, generation_status)
- New private Storage bucket: `invoices` with RLS (customer + admin can read via signed URL)
- **New Edge Function**: `generate-invoice` — GST-compliant PDF using pdf-lib with StethoNotes branding, PAID stamp (or REFUNDED), items table, tax breakdown
- **Auto-enqueued** on order paid via `enqueueInvoiceGeneration()` in post-order hooks (idempotent by order_id)
- **Student UI**: "Download Invoice" button on each order card in Dashboard → Order History. Generates on-demand if not yet made, else fetches signed URL.

### 4. Support Tickets (P1)
- New tables: `tickets` (ticket_number, status, priority, category, assigned_to), `ticket_messages` (attachments JSONB, is_internal)
- Reusable `SupportTickets.tsx` component with `mode="student" | "admin"` prop.
- **Student UI**: New Dashboard tab → **Support** — create tickets (subject, category, priority, description), view thread, reply
- **Admin UI**: New sidebar tab → **Support Tickets** — filter by status, reply, mark resolved/closed
- Auto-updates `status = awaiting_user` (admin reply) or `in_progress` (student reply)

### 5. Referral System (P1)
- Added `profiles.referral_code` (UNIQUE), auto-backfilled via `generate_referral_code()` PL/pgSQL function
- New table: `referrals` (referrer_id, referred_id UNIQUE, first_order_id, reward_amount, status)
- **Signup flow**: `LoginPage` accepts `?ref=CODE` query param, shows "Referral Code" input. Creates referral row on successful signup.
- **Auto-reward on first purchase**: `processReferralRewardForOrder()` in post-order hooks credits referrer ₹50 (config: `REFERRAL_REWARD_AMOUNT`) if buyer's first order ≥ ₹199 (config: `REFERRAL_MIN_ORDER_VALUE`)
- **Student UI**: `ReferralCard.tsx` — code display with copy button, native share, stats (signups/rewarded/earnings)
- New Dashboard tab: **Refer & Earn**

### Files created / changed in this phase

| File | Change |
|------|--------|
| `supabase/migrations/20260119000000_phase2_wallet_kyc_invoices_tickets_referrals.sql` | **NEW** — all 7 tables + storage buckets + RLS + `generate_referral_code()` |
| `supabase/functions/razorpay/index.ts` | Added `runPostOrderHooks()`: wallet credit, referral reward, invoice queue; called from verify-payment + webhook |
| `supabase/functions/generate-invoice/index.ts` | **NEW** — pdf-lib GST invoice generator with StethoNotes branding |
| `src/pages/SellerDashboardPage.tsx` | Added `wallet` and `kyc` tabs + imports |
| `src/pages/DashboardPage.tsx` | Added `referral` and `support` tabs, `handleDownloadInvoice()`, Invoice download button on orders |
| `src/pages/AdminPage.tsx` | Added `seller_kyc`, `withdrawals`, `support` sidebar tabs |
| `src/pages/LoginPage.tsx` | Referral code input on signup + `?ref=` query capture + attribution to `referrals` |
| `src/components/seller/SellerWallet.tsx` | **NEW** — full wallet + withdrawal UI |
| `src/components/seller/SellerKYC.tsx` | **NEW** — 4-doc KYC upload with re-upload flow |
| `src/components/support/SupportTickets.tsx` | **NEW** — reusable ticket system (student/admin) |
| `src/components/ReferralCard.tsx` | **NEW** — referral display + share |
| `src/components/admin/SellerKYCReview.tsx` | **NEW** — admin KYC review UI |
| `src/components/admin/WithdrawalsManager.tsx` | **NEW** — admin withdrawal approval + payout flow |

### Actions required before this goes live

1. **Apply migrations in order:**
   - `20260118000000_phase1_payment_hardening.sql`  (from Phase 1)
   - `20260119000000_phase2_wallet_kyc_invoices_tickets_referrals.sql`
2. **Deploy new edge function**: `generate-invoice` (Supabase CLI: `supabase functions deploy generate-invoice`)
3. **Redeploy** `razorpay` edge function (contains new post-order hooks)
4. **Test flow**: 
   - Buy note → check `wallets` table auto-created for seller and credited
   - Sign up with `?ref=CODE` → check `referrals` row created
   - Second user's first purchase ≥ ₹199 → check referrer wallet credited ₹50
   - Download invoice from Dashboard → PDF generated + stored in `invoices` bucket

---

## Backlog (deferred — evaluate demand first)

- **CMS Homepage Builder** (large scope)
- **Blog + Newsletter**
- **Gamification** (XP, streaks, coins, achievements)
- **Product versioning** (`product_versions` table)
- **Bulk note upload** (CSV/Excel)
- **Multi-language**
- **PWA** (installable app)
- **Failed email retry queue** (pg_cron based)
- **Referral leaderboard** UI (data already available)
- **Copyright / DMCA workflow** UI (backend `storage_reports` table already exists)
