-- ============================================================
-- STETHONOTES — DATABASE MIGRATION (MARKETPLACE EXPANSION)
-- Run this script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ==========================================
-- SECTION 1: EXTEND LEGACY TABLES
-- ==========================================

-- Add extra metadata bounds to coupon_codes
ALTER TABLE public.coupon_codes
    ADD COLUMN IF NOT EXISTS min_purchase NUMERIC(10, 2) DEFAULT 0.00 CHECK (min_purchase >= 0),
    ADD COLUMN IF NOT EXISTS max_discount NUMERIC(10, 2) DEFAULT NULL CHECK (max_discount > 0);


-- ==========================================
-- SECTION 2: NEW TABLES
-- ==========================================

-- 2.1 Seller Payouts
CREATE TABLE IF NOT EXISTS public.seller_payouts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount         NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    bank_details   JSONB,
    upi_id         TEXT,
    transaction_id TEXT,
    payout_date    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Coupon Usage
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id  UUID NOT NULL REFERENCES public.coupon_codes(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    used_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 Note Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id             UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating              INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment             TEXT,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
    is_pinned           BOOLEAN NOT NULL DEFAULT false,
    is_hidden           BOOLEAN NOT NULL DEFAULT false,
    is_reported         BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (note_id, user_id)
);

-- 2.4 Review Helpfulness Votes
CREATE TABLE IF NOT EXISTS public.review_votes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id  UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote_type  TEXT NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (review_id, user_id)
);

-- 2.5 Product Comments
CREATE TABLE IF NOT EXISTS public.comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id     UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment     TEXT NOT NULL,
    is_reported BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 Comment Replies
CREATE TABLE IF NOT EXISTS public.comment_replies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id  UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reply       TEXT NOT NULL,
    is_reported BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Recently Viewed Notes
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note_id   UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, note_id)
);

-- 2.8 SEO Metadata
CREATE TABLE IF NOT EXISTS public.seo_metadata (
    path             TEXT PRIMARY KEY,
    meta_title       TEXT,
    meta_description TEXT,
    meta_keywords    TEXT,
    og_title         TEXT,
    og_description   TEXT,
    og_image         TEXT,
    twitter_card     TEXT DEFAULT 'summary_large_image',
    canonical_url    TEXT,
    json_ld          JSONB,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 Email Templates
CREATE TABLE IF NOT EXISTS public.email_templates (
    id                TEXT PRIMARY KEY,
    subject           TEXT NOT NULL,
    body_html         TEXT NOT NULL,
    brevo_template_id INTEGER,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.10 Note Tags
CREATE TABLE IF NOT EXISTS public.product_tags (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    tag     TEXT NOT NULL,
    UNIQUE (note_id, tag)
);

-- 2.11 Notes Views Log
CREATE TABLE IF NOT EXISTS public.product_views (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id   UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.12 Daily Analytics Cache
CREATE TABLE IF NOT EXISTS public.analytics_daily (
    date      DATE PRIMARY KEY,
    revenue   NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    orders    INTEGER NOT NULL DEFAULT 0,
    downloads INTEGER NOT NULL DEFAULT 0,
    signups   INTEGER NOT NULL DEFAULT 0
);

-- 2.13 Monthly Analytics Cache
CREATE TABLE IF NOT EXISTS public.analytics_monthly (
    month     TEXT PRIMARY KEY, -- Formatted 'YYYY-MM'
    revenue   NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    orders    INTEGER NOT NULL DEFAULT 0,
    downloads INTEGER NOT NULL DEFAULT 0,
    signups   INTEGER NOT NULL DEFAULT 0
);

-- 2.14 Storage Reports
CREATE TABLE IF NOT EXISTS public.storage_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdf_count       INTEGER NOT NULL DEFAULT 0,
    image_count     INTEGER NOT NULL DEFAULT 0,
    preview_count   INTEGER NOT NULL DEFAULT 0,
    storage_used_bytes BIGINT NOT NULL DEFAULT 0,
    calculated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ==========================================
-- SECTION 3: PERFORMANCE INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller ON public.seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON public.seller_payouts(status);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon    ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user      ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_note           ON public.reviews(note_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user           ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_rev       ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_comments_note          ON public.comments(note_id);
CREATE INDEX IF NOT EXISTS idx_comments_user          ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_comm   ON public.comment_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user   ON public.recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_note       ON public.product_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_product_views_note      ON public.product_views(note_id);


-- ==========================================
-- SECTION 4: TRIGGER FUNCTIONS & SECURITY
-- ==========================================

-- Automatically update timestamps
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_comment_replies_updated_at BEFORE UPDATE ON public.comment_replies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_seo_metadata_updated_at BEFORE UPDATE ON public.seo_metadata FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ==========================================
-- SECTION 5: ROW LEVEL SECURITY POLICIES
-- ==========================================

ALTER TABLE public.seller_payouts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_replies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_viewed   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_reports   ENABLE ROW LEVEL SECURITY;

-- 5.1 seller_payouts
CREATE POLICY "payouts: own view" ON public.seller_payouts FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "payouts: admin manage" ON public.seller_payouts FOR ALL USING (public.is_admin(auth.uid()));

-- 5.2 coupon_usage
CREATE POLICY "coupon_usage: own view" ON public.coupon_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coupon_usage: admin view" ON public.coupon_usage FOR SELECT USING (public.is_admin(auth.uid()));

-- 5.3 reviews
CREATE POLICY "reviews: public read" ON public.reviews FOR SELECT USING (is_hidden = false);
CREATE POLICY "reviews: admin select all" ON public.reviews FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "reviews: own write" ON public.reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews: admin manage" ON public.reviews FOR ALL USING (public.is_admin(auth.uid()));

-- 5.4 review_votes
CREATE POLICY "review_votes: public read" ON public.review_votes FOR SELECT USING (true);
CREATE POLICY "review_votes: own vote" ON public.review_votes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5.5 comments
CREATE POLICY "comments: public read" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments: own write" ON public.comments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments: admin manage" ON public.comments FOR ALL USING (public.is_admin(auth.uid()));

-- 5.6 comment_replies
CREATE POLICY "comment_replies: public read" ON public.comment_replies FOR SELECT USING (true);
CREATE POLICY "comment_replies: own write" ON public.comment_replies FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_replies: admin manage" ON public.comment_replies FOR ALL USING (public.is_admin(auth.uid()));

-- 5.7 recently_viewed
CREATE POLICY "recently_viewed: own access" ON public.recently_viewed FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5.8 seo_metadata
CREATE POLICY "seo_metadata: public read" ON public.seo_metadata FOR SELECT USING (true);
CREATE POLICY "seo_metadata: admin manage" ON public.seo_metadata FOR ALL USING (public.is_admin(auth.uid()));

-- 5.9 email_templates
CREATE POLICY "email_templates: admin manage" ON public.email_templates FOR ALL USING (public.is_admin(auth.uid()));

-- 5.10 product_tags
CREATE POLICY "product_tags: public read" ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "product_tags: staff write" ON public.product_tags FOR ALL USING (public.is_admin(auth.uid()) OR public.is_seller(auth.uid()));

-- 5.11 product_views
CREATE POLICY "product_views: log view" ON public.product_views FOR INSERT WITH CHECK (true);
CREATE POLICY "product_views: admin view" ON public.product_views FOR SELECT USING (public.is_admin(auth.uid()));

-- 5.12 analytics_daily & analytics_monthly
CREATE POLICY "analytics: admin view" ON public.analytics_daily FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "analytics_monthly: admin view" ON public.analytics_monthly FOR SELECT USING (public.is_admin(auth.uid()));

-- 5.13 storage_reports
CREATE POLICY "storage_reports: admin view" ON public.storage_reports FOR SELECT USING (public.is_admin(auth.uid()));


-- ==========================================
-- SECTION 6: VIEWS & AGGREGATIONS
-- ==========================================

-- 6.1 Seller Performance metrics view
CREATE OR REPLACE VIEW public.v_seller_performance AS
    SELECT 
        p.id AS seller_id,
        p.full_name,
        p.email,
        sp.store_name,
        COALESCE(SUM(oi.price), 0.00) AS total_sales,
        COALESCE(SUM(oi.price) * 0.10, 0.00) AS commission_earned, -- Example 10% platform fee
        COALESCE(COUNT(DISTINCT n.id), 0) AS upload_count,
        COALESCE(AVG(r.rating), 0.0) AS average_rating
    FROM public.profiles p
    JOIN public.seller_profiles sp ON p.id = sp.id
    LEFT JOIN public.notes n ON n.seller_id = p.id
    LEFT JOIN public.order_items oi ON oi.note_id = n.id
    LEFT JOIN public.orders o ON o.id = oi.order_id AND o.payment_status = 'completed'
    LEFT JOIN public.reviews r ON r.note_id = n.id
    GROUP BY p.id, p.full_name, p.email, sp.store_name;

-- 6.2 Monthly Revenue aggregation view
CREATE OR REPLACE VIEW public.v_monthly_revenue AS
    SELECT 
        TO_CHAR(o.created_at, 'YYYY-MM') AS revenue_month,
        SUM(o.total_amount) AS monthly_revenue,
        COUNT(o.id) AS total_orders
    FROM public.orders o
    WHERE o.payment_status = 'completed'
    GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
    ORDER BY revenue_month DESC;


-- ==========================================
-- SECTION 7: SEED EMAIL TEMPLATES
-- ==========================================

INSERT INTO public.email_templates (id, subject, body_html)
VALUES
    ('order_confirmation', 'Order Confirmed — StethoNotes', '<h1>Thank you for your order!</h1><p>Your notes are ready for download in your dashboard.</p>'),
    ('pdf_delivery', 'Your Medical Notes are Here! — StethoNotes', '<h1>Here is your note download link</h1><p>Click below to download your notes.</p>'),
    ('seller_approved', 'Seller Account Approved! — StethoNotes', '<h1>Congratulations!</h1><p>Your seller application has been approved. Start uploading now.</p>'),
    ('seller_rejected', 'Seller Application Update — StethoNotes', '<h1>Application Update</h1><p>We regret to inform you that your seller request was not approved.</p>')
ON CONFLICT (id) DO NOTHING;
