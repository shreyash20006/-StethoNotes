-- ============================================================
-- STETHONOTES — COMPLETE SUPABASE SQL SETUP
-- Run this entire script in: Supabase Dashboard → SQL Editor
-- ============================================================


-- ============================================================
-- SECTION 1 — TABLES
-- ============================================================

-- 1.1 Courses
CREATE TABLE IF NOT EXISTS public.courses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 User Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    phone       TEXT,
    role        TEXT NOT NULL DEFAULT 'student'
                    CHECK (role IN ('student', 'admin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.3 Notes (PDFs for sale)
CREATE TABLE IF NOT EXISTS public.notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    description     TEXT,
    course_id       UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    subject         TEXT NOT NULL,
    semester        TEXT,
    price           NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    pdf_url         TEXT NOT NULL,
    thumbnail_url   TEXT NOT NULL,
    preview_images  TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    status          TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'draft')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.4 Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name       TEXT NOT NULL,
    customer_email      TEXT NOT NULL,
    customer_phone      TEXT NOT NULL,
    total_amount        NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    razorpay_payment_id TEXT,
    payment_status      TEXT NOT NULL DEFAULT 'pending'
                            CHECK (payment_status IN ('pending', 'completed', 'failed')),
    email_status        TEXT NOT NULL DEFAULT 'pending'
                            CHECK (email_status IN ('pending', 'sent', 'failed')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    note_id     UUID NOT NULL REFERENCES public.notes(id) ON DELETE RESTRICT,
    price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    UNIQUE (order_id, note_id)
);

-- 1.6 Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id     UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (note_id, user_id)
);

-- 1.7 Email Logs
CREATE TABLE IF NOT EXISTS public.email_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id      UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    email         TEXT NOT NULL,
    status        TEXT NOT NULL CHECK (status IN ('success', 'failure')),
    error_message TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- SECTION 2 — INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_notes_course_id   ON public.notes(course_id);
CREATE INDEX IF NOT EXISTS idx_notes_status       ON public.notes(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id     ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email       ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id  ON public.orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order  ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_note   ON public.order_items(note_id);
CREATE INDEX IF NOT EXISTS idx_reviews_note_id    ON public.reviews(note_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id    ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_order   ON public.email_logs(order_id);


-- ============================================================
-- SECTION 3 — ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs  ENABLE ROW LEVEL SECURITY;


-- 3.1 courses
DROP POLICY IF EXISTS "courses: public read" ON public.courses;
DROP POLICY IF EXISTS "courses: admin write" ON public.courses;

CREATE POLICY "courses: public read"
    ON public.courses FOR SELECT USING (true);

CREATE POLICY "courses: admin write"
    ON public.courses FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));


-- 3.2 profiles
DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own update" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin full access" ON public.profiles;

CREATE POLICY "profiles: own read"
    ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: own update"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: admin full access"
    ON public.profiles FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    ));


-- 3.3 notes
DROP POLICY IF EXISTS "notes: public read" ON public.notes;
DROP POLICY IF EXISTS "notes: admin write" ON public.notes;

CREATE POLICY "notes: public read"
    ON public.notes FOR SELECT USING (true);

CREATE POLICY "notes: admin write"
    ON public.notes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));


-- 3.4 orders
DROP POLICY IF EXISTS "orders: own read" ON public.orders;
DROP POLICY IF EXISTS "orders: own insert" ON public.orders;
DROP POLICY IF EXISTS "orders: guest insert" ON public.orders;
DROP POLICY IF EXISTS "orders: admin full access" ON public.orders;

CREATE POLICY "orders: own read"
    ON public.orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders: own insert"
    ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders: guest insert"
    ON public.orders FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "orders: admin full access"
    ON public.orders FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));


-- 3.5 order_items
DROP POLICY IF EXISTS "order_items: own read" ON public.order_items;
DROP POLICY IF EXISTS "order_items: own insert" ON public.order_items;
DROP POLICY IF EXISTS "order_items: guest insert" ON public.order_items;
DROP POLICY IF EXISTS "order_items: admin full access" ON public.order_items;

CREATE POLICY "order_items: own read"
    ON public.order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    ));

CREATE POLICY "order_items: own insert"
    ON public.order_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    ));

CREATE POLICY "order_items: guest insert"
    ON public.order_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id AND orders.user_id IS NULL
    ));

CREATE POLICY "order_items: admin full access"
    ON public.order_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));


-- 3.6 reviews
DROP POLICY IF EXISTS "reviews: public read" ON public.reviews;
DROP POLICY IF EXISTS "reviews: own insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews: own update" ON public.reviews;
DROP POLICY IF EXISTS "reviews: own delete" ON public.reviews;

CREATE POLICY "reviews: public read"
    ON public.reviews FOR SELECT USING (true);

CREATE POLICY "reviews: own insert"
    ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews: own update"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews: own delete"
    ON public.reviews FOR DELETE USING (auth.uid() = user_id);


-- 3.7 email_logs
DROP POLICY IF EXISTS "email_logs: admin full access" ON public.email_logs;

CREATE POLICY "email_logs: admin full access"
    ON public.email_logs FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));


-- ============================================================
-- SECTION 4 — FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Student'),
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Guest order lookup by email (used in OrderLookupPage without login)
CREATE OR REPLACE FUNCTION public.lookup_order_by_email(
    p_email TEXT,
    p_payment_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id                  UUID,
    user_id             UUID,
    customer_name       TEXT,
    customer_email      TEXT,
    customer_phone      TEXT,
    total_amount        NUMERIC,
    razorpay_payment_id TEXT,
    payment_status      TEXT,
    email_status        TEXT,
    created_at          TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.user_id, o.customer_name, o.customer_email,
           o.customer_phone, o.total_amount, o.razorpay_payment_id,
           o.payment_status, o.email_status, o.created_at
    FROM public.orders o
    WHERE o.customer_email = p_email
      AND (p_payment_id IS NULL OR o.razorpay_payment_id = p_payment_id)
    ORDER BY o.created_at DESC
    LIMIT 10;
END;
$$;


-- ============================================================
-- SECTION 5 — STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('notes-pdfs',  'notes-pdfs',  false, 52428800,  ARRAY['application/pdf']),
    ('thumbnails',  'thumbnails',  true,  5242880,   ARRAY['image/jpeg','image/png','image/webp']),
    ('previews',    'previews',    true,  10485760,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;


-- Storage RLS — notes-pdfs (private)
DROP POLICY IF EXISTS "notes-pdfs: admin upload" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: admin delete" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: authenticated read" ON storage.objects;

CREATE POLICY "notes-pdfs: admin upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'notes-pdfs'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "notes-pdfs: admin delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'notes-pdfs'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "notes-pdfs: authenticated read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'notes-pdfs' AND auth.role() = 'authenticated');


-- Storage RLS — thumbnails (public)
DROP POLICY IF EXISTS "thumbnails: public read" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: admin upload" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: admin delete" ON storage.objects;

CREATE POLICY "thumbnails: public read"
    ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails: admin upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'thumbnails'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "thumbnails: admin delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'thumbnails'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );


-- Storage RLS — previews (public)
DROP POLICY IF EXISTS "previews: public read" ON storage.objects;
DROP POLICY IF EXISTS "previews: admin upload" ON storage.objects;
DROP POLICY IF EXISTS "previews: admin delete" ON storage.objects;

CREATE POLICY "previews: public read"
    ON storage.objects FOR SELECT USING (bucket_id = 'previews');

CREATE POLICY "previews: admin upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'previews'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "previews: admin delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'previews'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );


-- ============================================================
-- SECTION 6 — SEED DATA
-- ============================================================

INSERT INTO public.courses (name) VALUES
    ('MBBS'),
    ('BHMS'),
    ('BAMS'),
    ('BSc Nursing'),
    ('B.Pharma'),
    ('BPT'),
    ('Paramedical')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- SECTION 7 — MAKE YOURSELF ADMIN
-- 1. Sign up in the app first
-- 2. Go to: Supabase Dashboard → Authentication → Users
-- 3. Copy your UUID and paste it below, then run this UPDATE
-- ============================================================

-- UPDATE public.profiles
--     SET role = 'admin'
--     WHERE id = 'PASTE-YOUR-USER-UUID-HERE';

-- ============================================================
-- DONE
-- ============================================================

