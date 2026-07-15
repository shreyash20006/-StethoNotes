-- ============================================================
-- PHASE 2 + 3: Wallet + KYC + Invoices + Tickets + Referrals
-- Migration: 2026-01-19
-- ============================================================
-- All additive. Safe on production. No modifications to existing rows.
-- ============================================================


-- ------------------------------------------------------------
-- 1. SELLER WALLETS
-- One wallet per seller. Auto-created on first credit.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    available_balance NUMERIC(12,2) NOT NULL DEFAULT 0,      -- withdrawable
    pending_balance NUMERIC(12,2) NOT NULL DEFAULT 0,        -- e.g. clearing period
    lifetime_credit NUMERIC(12,2) NOT NULL DEFAULT 0,
    lifetime_debit NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets (user_id);


-- ------------------------------------------------------------
-- 2. WALLET TRANSACTIONS
-- Every credit/debit is a row. Wallet balance = sum of these.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,                       -- sale_commission | referral_bonus | withdrawal | refund_adjustment | admin_credit | admin_debit
    amount NUMERIC(12,2) NOT NULL,            -- positive for credits, negative for debits
    balance_after NUMERIC(12,2),
    reference_type TEXT,                      -- order | referral | withdrawal_request
    reference_id UUID,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON public.wallet_transactions (wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON public.wallet_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_ref ON public.wallet_transactions (reference_type, reference_id);


-- ------------------------------------------------------------
-- 3. WITHDRAWAL REQUESTS
-- Sellers request withdrawal → admin approves → offline payout marked processed.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payout_method TEXT NOT NULL,              -- bank | upi
    payout_details JSONB NOT NULL,            -- {account_number, ifsc, upi_id, ...}
    status TEXT NOT NULL DEFAULT 'requested', -- requested | approved | rejected | processing | paid | failed
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    transaction_ref TEXT,                     -- offline UTR/UPI ref
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wd_user ON public.withdrawal_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_wd_status ON public.withdrawal_requests (status);
CREATE INDEX IF NOT EXISTS idx_wd_created ON public.withdrawal_requests (created_at DESC);


-- ------------------------------------------------------------
-- 4. SELLER DOCUMENTS (KYC)
-- Seller uploads → admin verifies → seller eligible for payout.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,                   -- college_id | govt_id | pan | bank_proof | address_proof
    file_url TEXT NOT NULL,                   -- Supabase Storage path
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_docs_user ON public.seller_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_seller_docs_status ON public.seller_documents (status);


-- ------------------------------------------------------------
-- 5. INVOICES
-- Persisted invoice record + Storage URL. Generated on order paid.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,      -- e.g. STN/2026/00001
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    subtotal NUMERIC(12,2),
    discount NUMERIC(12,2) DEFAULT 0,
    gst NUMERIC(12,2) DEFAULT 0,
    platform_fee NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    storage_path TEXT,                        -- e.g. invoices/2026/01/STN_00001.pdf
    generation_status TEXT NOT NULL DEFAULT 'pending', -- pending | generated | failed
    generation_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices (order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON public.invoices (created_at DESC);

-- Sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS public.invoice_seq START 1;


-- ------------------------------------------------------------
-- 6. SUPPORT TICKETS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT NOT NULL UNIQUE,       -- e.g. TKT-000123
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general', -- general | payment | download | account | seller | other
    priority TEXT NOT NULL DEFAULT 'normal',  -- low | normal | high | urgent
    status TEXT NOT NULL DEFAULT 'open',      -- open | in_progress | awaiting_user | resolved | closed
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_last_msg ON public.tickets (last_message_at DESC);

CREATE SEQUENCE IF NOT EXISTS public.ticket_seq START 1;


CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL,                -- student | admin | seller
    body TEXT NOT NULL,
    attachments JSONB,                        -- array of {url, name, size, mime}
    is_internal BOOLEAN NOT NULL DEFAULT FALSE, -- admin-only notes not visible to student
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_msgs_ticket ON public.ticket_messages (ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_msgs_created ON public.ticket_messages (created_at ASC);


-- ------------------------------------------------------------
-- 7. REFERRALS
-- Referral code lives on profiles; conversions live here.
-- ------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles (referral_code)
    WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'signed_up', -- signed_up | first_purchase | rewarded
    first_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    reward_amount NUMERIC(12,2) DEFAULT 0,
    rewarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (referred_id)                       -- a user can be referred by only ONE person
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals (status);


-- ------------------------------------------------------------
-- 8. TRIGGERS: updated_at
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_wallets_updated_at ON public.wallets;
CREATE TRIGGER trg_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_withdrawals_updated_at ON public.withdrawal_requests;
CREATE TRIGGER trg_withdrawals_updated_at
    BEFORE UPDATE ON public.withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_seller_docs_updated_at ON public.seller_documents;
CREATE TRIGGER trg_seller_docs_updated_at
    BEFORE UPDATE ON public.seller_documents
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tickets_updated_at ON public.tickets;
CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ------------------------------------------------------------
-- 9. RLS POLICIES
-- ------------------------------------------------------------

-- wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallets_owner_or_admin_read" ON public.wallets;
CREATE POLICY "wallets_owner_or_admin_read"
    ON public.wallets FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallet_tx_owner_or_admin_read" ON public.wallet_transactions;
CREATE POLICY "wallet_tx_owner_or_admin_read"
    ON public.wallet_transactions FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wd_owner_read" ON public.withdrawal_requests;
CREATE POLICY "wd_owner_read"
    ON public.withdrawal_requests FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );
DROP POLICY IF EXISTS "wd_owner_insert" ON public.withdrawal_requests;
CREATE POLICY "wd_owner_insert"
    ON public.withdrawal_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "wd_admin_update" ON public.withdrawal_requests;
CREATE POLICY "wd_admin_update"
    ON public.withdrawal_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- seller_documents
ALTER TABLE public.seller_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seller_docs_owner_or_admin_all" ON public.seller_documents;
CREATE POLICY "seller_docs_owner_or_admin_all"
    ON public.seller_documents FOR ALL
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_owner_or_admin_read" ON public.invoices;
CREATE POLICY "invoices_owner_or_admin_read"
    ON public.invoices FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tickets_owner_or_admin_read" ON public.tickets;
CREATE POLICY "tickets_owner_or_admin_read"
    ON public.tickets FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );
DROP POLICY IF EXISTS "tickets_owner_insert" ON public.tickets;
CREATE POLICY "tickets_owner_insert"
    ON public.tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "tickets_admin_or_owner_update" ON public.tickets;
CREATE POLICY "tickets_admin_or_owner_update"
    ON public.tickets FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- ticket_messages
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ticket_msgs_participant_read" ON public.ticket_messages;
CREATE POLICY "ticket_msgs_participant_read"
    ON public.ticket_messages FOR SELECT
    USING (
        NOT is_internal AND EXISTS (
            SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );
DROP POLICY IF EXISTS "ticket_msgs_participant_insert" ON public.ticket_messages;
CREATE POLICY "ticket_msgs_participant_insert"
    ON public.ticket_messages FOR INSERT
    WITH CHECK (
        (sender_id = auth.uid()
         AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()))
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- referrals: public read (leaderboard) but restrict amount aggregation via views, insert only via server-side
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "referrals_participant_or_admin_read" ON public.referrals;
CREATE POLICY "referrals_participant_or_admin_read"
    ON public.referrals FOR SELECT
    USING (
        auth.uid() = referrer_id OR auth.uid() = referred_id
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );


-- ------------------------------------------------------------
-- 10. STORAGE BUCKETS (created idempotently)
-- - seller-documents  : private (KYC docs)
-- - invoices          : private (customer invoices)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
    VALUES ('seller-documents', 'seller-documents', false)
    ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
    VALUES ('invoices', 'invoices', false)
    ON CONFLICT (id) DO NOTHING;

-- Storage RLS (owner upload, admin read all)
DROP POLICY IF EXISTS "seller_docs_owner_upload" ON storage.objects;
CREATE POLICY "seller_docs_owner_upload"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'seller-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "seller_docs_owner_read" ON storage.objects;
CREATE POLICY "seller_docs_owner_read"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'seller-documents'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR EXISTS (
                SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
            )
        )
    );

DROP POLICY IF EXISTS "invoices_owner_read" ON storage.objects;
CREATE POLICY "invoices_owner_read"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'invoices'
        AND EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.storage_path = name
              AND (i.user_id = auth.uid()
                   OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
        )
    );


-- ------------------------------------------------------------
-- 11. HELPER FUNCTION — Auto-generate referral code on profile create
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_code TEXT;
    final_code TEXT;
    attempt INT := 0;
BEGIN
    base_code := UPPER(REGEXP_REPLACE(COALESCE(user_name, 'USER'), '[^A-Za-z]', '', 'g'));
    base_code := SUBSTRING(base_code FROM 1 FOR 5);
    IF LENGTH(base_code) < 3 THEN base_code := 'STETH'; END IF;

    LOOP
        final_code := base_code || LPAD((FLOOR(RANDOM() * 10000))::TEXT, 4, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = final_code);
        attempt := attempt + 1;
        IF attempt > 10 THEN
            final_code := base_code || LPAD((FLOOR(RANDOM() * 1000000))::TEXT, 6, '0');
            EXIT;
        END IF;
    END LOOP;

    RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Backfill referral codes for existing profiles that don't have one
UPDATE public.profiles
SET referral_code = public.generate_referral_code(name)
WHERE referral_code IS NULL;
