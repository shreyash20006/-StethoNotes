-- ============================================================
-- PHASE 1: PAYMENT HARDENING
-- Migration: Payment Logs, Webhook Logs, Refunds
-- Date: 2026-01-18
-- ============================================================
-- Additive migration only. Does NOT modify existing tables.
-- Safe to run on production — uses IF NOT EXISTS everywhere.
-- ============================================================


-- ------------------------------------------------------------
-- 1. WEBHOOK LOGS
-- Persists every Razorpay webhook event for audit/replay.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'razorpay',
    event_id TEXT,                              -- Razorpay's x-razorpay-event-id header
    event_type TEXT NOT NULL,                   -- e.g. payment.captured, refund.processed
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    razorpay_refund_id TEXT,
    signature_valid BOOLEAN NOT NULL DEFAULT false,
    processing_status TEXT NOT NULL DEFAULT 'received',  -- received | processed | failed | duplicate
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    payload JSONB,
    error_message TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_logs_event_id
    ON public.webhook_logs (event_id)
    WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type
    ON public.webhook_logs (event_type);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_received_at
    ON public.webhook_logs (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_id
    ON public.webhook_logs (order_id);


-- ------------------------------------------------------------
-- 2. PAYMENT LOGS
-- Detailed lifecycle audit trail for each payment attempt.
-- Complements the existing `payments` table (which stores final state).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    stage TEXT NOT NULL,                        -- create-order | verify-payment | webhook | refund | failed
    status TEXT NOT NULL,                       -- initiated | success | failure
    amount NUMERIC(12,2),
    currency TEXT DEFAULT 'INR',
    method TEXT,                                -- upi | card | netbanking | wallet
    ip_address TEXT,
    user_agent TEXT,
    error_code TEXT,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id
    ON public.payment_logs (order_id);

CREATE INDEX IF NOT EXISTS idx_payment_logs_stage
    ON public.payment_logs (stage);

CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at
    ON public.payment_logs (created_at DESC);


-- ------------------------------------------------------------
-- 3. REFUNDS
-- Tracks refund requests and their processing state.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    razorpay_payment_id TEXT NOT NULL,
    razorpay_refund_id TEXT,                    -- filled after Razorpay API call
    amount NUMERIC(12,2) NOT NULL,
    reason TEXT NOT NULL,                       -- user-provided reason
    status TEXT NOT NULL DEFAULT 'requested',   -- requested | approved | rejected | processing | processed | failed
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    razorpay_error JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds (order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON public.refunds (user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds (status);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON public.refunds (created_at DESC);


-- ------------------------------------------------------------
-- 4. RLS POLICIES
-- ------------------------------------------------------------

-- webhook_logs: admin-only read; edge function writes with service role (bypasses RLS)
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_logs_admin_read" ON public.webhook_logs;
CREATE POLICY "webhook_logs_admin_read"
    ON public.webhook_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- payment_logs: admin-only read
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_logs_admin_read" ON public.payment_logs;
CREATE POLICY "payment_logs_admin_read"
    ON public.payment_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- refunds: owner can read + insert their own; admin can read/update all
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "refunds_owner_read" ON public.refunds;
CREATE POLICY "refunds_owner_read"
    ON public.refunds FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "refunds_owner_insert" ON public.refunds;
CREATE POLICY "refunds_owner_insert"
    ON public.refunds FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "refunds_admin_update" ON public.refunds;
CREATE POLICY "refunds_admin_update"
    ON public.refunds FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin')
        )
    );


-- ------------------------------------------------------------
-- 5. TRIGGER: auto-update refunds.updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refunds_updated_at ON public.refunds;
CREATE TRIGGER trg_refunds_updated_at
    BEFORE UPDATE ON public.refunds
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ------------------------------------------------------------
-- 6. Extend `orders` table with refund tracking (safe add-column)
-- ------------------------------------------------------------
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none';
-- values: none | requested | approved | rejected | processed
