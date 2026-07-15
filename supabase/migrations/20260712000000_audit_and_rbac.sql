-- ============================================================
-- STETHONOTES — DATABASE MIGRATION (AUDIT, ALLOWLIST & RBAC)
-- Run this script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ==========================================
-- SECTION 1: PROFILES & LEGACY TABLE FIXES
-- ==========================================

-- 1.1 Add missing columns to profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
        CHECK (status IN ('active', 'pending', 'approved', 'rejected')),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 1.2 Update role column check constraint in profiles
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('student', 'seller_pending', 'seller', 'admin', 'super_admin'));

-- 1.3 Add seller_id reference to notes table
ALTER TABLE public.notes
    ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();


-- ==========================================
-- SECTION 2: NEW TABLES
-- ==========================================

-- 2.1 Admin Allowlist
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL UNIQUE,
    role       TEXT NOT NULL CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Subjects (Lookup lookup table)
CREATE TABLE IF NOT EXISTS public.subjects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (name, course_id)
);

-- 2.3 Seller Requests
CREATE TABLE IF NOT EXISTS public.seller_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    full_name   TEXT,
    status      TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2.4 Seller Profiles
CREATE TABLE IF NOT EXISTS public.seller_profiles (
    id            UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_name    TEXT UNIQUE,
    bio           TEXT,
    upi_id        TEXT,
    bank_details  JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 Wishlist
CREATE TABLE IF NOT EXISTS public.wishlist (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note_id     UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, note_id)
);

-- 2.6 Cart Items (Database-persisted cart fallback)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note_id     UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, note_id)
);

-- 2.7 Payments Log
CREATE TABLE IF NOT EXISTS public.payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    razorpay_payment_id TEXT NOT NULL UNIQUE,
    razorpay_order_id   TEXT,
    razorpay_signature  TEXT,
    amount              NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    status              TEXT NOT NULL CHECK (status IN ('pending', 'captured', 'failed')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 Downloads Log
CREATE TABLE IF NOT EXISTS public.downloads (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note_id       UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    ip_address    TEXT,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.10 Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    table_name  TEXT NOT NULL,
    record_id   UUID,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.11 Settings
CREATE TABLE IF NOT EXISTS public.settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL,
    description TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.12 Coupon Codes
CREATE TABLE IF NOT EXISTS public.coupon_codes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code           TEXT NOT NULL UNIQUE,
    discount_type  TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    expiry_date    TIMESTAMPTZ,
    usage_limit    INTEGER,
    used_count     INTEGER NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.13 Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type  TEXT NOT NULL,
    properties  JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ==========================================
-- SECTION 3: PERFORMANCE INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_subjects_course     ON public.subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_seller_requests_usr ON public.seller_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_usr ON public.seller_profiles(id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user       ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_note       ON public.wishlist(note_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user     ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order      ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_rzp_id     ON public.payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user      ON public.downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_note      ON public.downloads(note_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user  ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read  ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notes_seller        ON public.notes(seller_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user     ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_code   ON public.coupon_codes(code);


-- ==========================================
-- SECTION 4: TRIGGER FUNCTIONS & SECURITY
-- ==========================================

-- Helper function to check if user has admin privileges (admin or super_admin)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role IN ('admin', 'super_admin')
    ) OR EXISTS (
        SELECT 1 FROM public.admin_allowlist a
        JOIN auth.users u ON a.email = u.email
        WHERE u.id = user_id
    );
END;
$$;

-- 4.1 Update New User trigger function to sync new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_role TEXT;
    default_status TEXT;
BEGIN
    default_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    IF default_role = 'seller_pending' THEN
        default_status := 'pending';
    ELSE
        default_status := 'active';
    END IF;

    INSERT INTO public.profiles (id, name, full_name, email, avatar_url, phone, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Student'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Student'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'phone',
        default_role,
        default_status
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 4.2 Prevent non-admins from changing their role or status
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if role or status is being modified by an unauthorized user
    IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Allow the transitioning from 'student' to 'seller_pending' status 'pending' (application submission)
        IF NEW.role = 'seller_pending' AND NEW.status = 'pending' AND OLD.role = 'student' THEN
            RETURN NEW;
        END IF;

        -- For all other changes, verify caller is admin or super_admin
        IF NOT public.is_admin(auth.uid()) THEN
            RAISE EXCEPTION 'Privilege Escalation Blocked: You cannot modify your role or status details.';
        END IF;
    END IF;
    
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();


-- 4.3 Trigger to handle automatic updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_seller_profiles_updated_at BEFORE UPDATE ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- SECTION 5: SECURE ADMINISTRATIVE AUTHORIZATION RPC
-- ============================================================

-- Secure check_admin_allowlist RPC to verify admin status on the backend
CREATE OR REPLACE FUNCTION public.check_admin_allowlist(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    matched_role TEXT;
    is_allowed BOOLEAN := false;
BEGIN
    SELECT role INTO matched_role
    FROM public.admin_allowlist
    WHERE LOWER(email) = LOWER(TRIM(p_email));

    IF matched_role IS NOT NULL THEN
        is_allowed := true;
    END IF;

    RETURN jsonb_build_object(
        'allowed', is_allowed,
        'role', matched_role
    );
END;
$$;


-- ==========================================
-- SECTION 6: ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on new tables
ALTER TABLE public.admin_allowlist      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_codes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events   ENABLE ROW LEVEL SECURITY;


-- Helper function to check if user is an approved seller
CREATE OR REPLACE FUNCTION public.is_seller(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'seller' AND status = 'approved'
    );
END;
$$;

-- 6.1 admin_allowlist: read-only for admin/super_admin, write-only for super_admin
CREATE POLICY "admin_allowlist: admin view" ON public.admin_allowlist FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "admin_allowlist: super_admin manage" ON public.admin_allowlist FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
    ));

-- 6.2 Update Legacy Table RLS to support super_admin role
-- 6.2.1 public.courses
DROP POLICY IF EXISTS "courses: admin write" ON public.courses;
CREATE POLICY "courses: admin write" ON public.courses FOR ALL
    USING (public.is_admin(auth.uid()));

-- 6.2.2 public.profiles
DROP POLICY IF EXISTS "profiles: admin full access" ON public.profiles;
CREATE POLICY "profiles: admin full access" ON public.profiles FOR ALL
    USING (public.is_admin(auth.uid()));

-- Allow public read of profiles (required so students can view seller profiles)
DROP POLICY IF EXISTS "profiles: public read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
CREATE POLICY "profiles: public read" ON public.profiles FOR SELECT
    USING (true);

-- 6.2.3 public.notes
DROP POLICY IF EXISTS "notes: admin write" ON public.notes;
CREATE POLICY "notes: admin write" ON public.notes FOR ALL
    USING (public.is_admin(auth.uid()));

-- Allow approved sellers to manage their own notes
CREATE POLICY "notes: seller manage" ON public.notes FOR ALL
    USING (public.is_seller(auth.uid()) AND (seller_id = auth.uid() OR seller_id IS NULL))
    WITH CHECK (public.is_seller(auth.uid()) AND seller_id = auth.uid());

-- 6.2.4 public.orders
DROP POLICY IF EXISTS "orders: admin full access" ON public.orders;
CREATE POLICY "orders: admin full access" ON public.orders FOR ALL
    USING (public.is_admin(auth.uid()));

-- 6.2.5 public.order_items
DROP POLICY IF EXISTS "order_items: admin full access" ON public.order_items;
CREATE POLICY "order_items: admin full access" ON public.order_items FOR ALL
    USING (public.is_admin(auth.uid()));

-- 6.2.6 public.email_logs
DROP POLICY IF EXISTS "email_logs: admin full access" ON public.email_logs;
CREATE POLICY "email_logs: admin full access" ON public.email_logs FOR ALL
    USING (public.is_admin(auth.uid()));


-- 6.3 RLS Policies for New Tables
-- 6.3.1 subjects
CREATE POLICY "subjects: public read" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "subjects: staff write" ON public.subjects FOR ALL USING (public.is_admin(auth.uid()));

-- 6.3.2 seller_requests
CREATE POLICY "seller_requests: own view" ON public.seller_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "seller_requests: admin view" ON public.seller_requests FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "seller_requests: own insert" ON public.seller_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "seller_requests: admin write" ON public.seller_requests FOR ALL USING (public.is_admin(auth.uid()));

-- 6.3.3 seller_profiles
CREATE POLICY "seller_profiles: public read" ON public.seller_profiles FOR SELECT USING (true);
CREATE POLICY "seller_profiles: own update" ON public.seller_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "seller_profiles: own insert" ON public.seller_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "seller_profiles: admin manage" ON public.seller_profiles FOR ALL USING (public.is_admin(auth.uid()));

-- 6.3.4 wishlist
CREATE POLICY "wishlist: own access" ON public.wishlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6.3.5 cart_items
CREATE POLICY "cart_items: own access" ON public.cart_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6.3.6 payments
CREATE POLICY "payments: admin view" ON public.payments FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "payments: user view" ON public.payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = payments.order_id AND o.user_id = auth.uid()
    )
);

-- 6.3.7 downloads
CREATE POLICY "downloads: admin view" ON public.downloads FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "downloads: user own view" ON public.downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "downloads: log download" ON public.downloads FOR INSERT WITH CHECK (true);

-- 6.3.8 notifications
CREATE POLICY "notifications: own access" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications: own update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications: admin manage" ON public.notifications FOR ALL USING (public.is_admin(auth.uid()));

-- 6.3.9 audit_logs
CREATE POLICY "audit_logs: admin view" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));

-- 6.3.10 settings
CREATE POLICY "settings: public read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings: admin manage" ON public.settings FOR ALL USING (public.is_admin(auth.uid()));

-- 6.3.11 coupon_codes
CREATE POLICY "coupon_codes: public read" ON public.coupon_codes FOR SELECT USING (true);
CREATE POLICY "coupon_codes: admin manage" ON public.coupon_codes FOR ALL USING (public.is_admin(auth.uid()));

-- 6.3.12 analytics_events
CREATE POLICY "analytics_events: log event" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "analytics_events: admin view" ON public.analytics_events FOR SELECT USING (public.is_admin(auth.uid()));


-- ==========================================
-- SECTION 7: STORAGE BUCKET RLS CORRECTIONS
-- ==========================================

-- Revoke the insecure open select policy on notes-pdfs
DROP POLICY IF EXISTS "notes-pdfs: authenticated read" ON storage.objects;

-- Create highly secure selection policy for private notes-pdfs
CREATE POLICY "notes-pdfs: staff read"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'notes-pdfs'
        AND (
            public.is_admin(auth.uid())
            OR public.is_seller(auth.uid())
        )
    );

-- Support seller uploads on storage buckets
-- 7.1 Private notes-pdfs upload
DROP POLICY IF EXISTS "notes-pdfs: admin upload" ON storage.objects;
CREATE POLICY "notes-pdfs: staff upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'notes-pdfs'
        AND (
            public.is_admin(auth.uid())
            OR public.is_seller(auth.uid())
        )
    );

DROP POLICY IF EXISTS "notes-pdfs: admin delete" ON storage.objects;
CREATE POLICY "notes-pdfs: staff delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'notes-pdfs'
        AND (
            public.is_admin(auth.uid())
            OR public.is_seller(auth.uid())
        )
    );

-- 7.2 Public thumbnails upload
DROP POLICY IF EXISTS "thumbnails: admin upload" ON storage.objects;
CREATE POLICY "thumbnails: staff upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'thumbnails'
        AND (
            public.is_admin(auth.uid())
            OR public.is_seller(auth.uid())
        )
    );

DROP POLICY IF EXISTS "thumbnails: admin delete" ON storage.objects;
CREATE POLICY "thumbnails: staff delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'thumbnails'
        AND (
            public.is_admin(auth.uid())
            OR public.is_seller(auth.uid())
        )
    );

-- 7.3 Public previews upload
DROP POLICY IF EXISTS "previews: admin upload" ON storage.objects;
CREATE POLICY "previews: staff upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'previews'
        AND (
            public.is_admin(auth.uid())
            OR public.is_seller(auth.uid())
        )
    );

DROP POLICY IF EXISTS "previews: admin delete" ON storage.objects;
CREATE POLICY "previews: staff delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'previews'
        AND (
            public.is_admin(auth.uid())
            OR public.is_seller(auth.uid())
        )
    );


-- ==========================================
-- SECTION 8: SEED SEED DATA
-- ==========================================

-- 8.1 Seed admin allowlist
INSERT INTO public.admin_allowlist (email, role)
VALUES
    ('shreyashumedkumarborkar@gmail.com', 'super_admin'),
    ('sb108750@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 8.2 Seed coupon codes
INSERT INTO public.coupon_codes (code, discount_type, discount_value)
VALUES
    ('WELCOME10', 'percentage', 10.00),
    ('MEDFIRST',  'percentage', 15.00),
    ('PHARMA20',  'percentage', 20.00)
ON CONFLICT (code) DO NOTHING;
