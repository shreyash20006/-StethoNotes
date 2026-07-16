-- ============================================================
-- Platform Improvements Migration
-- Contact messages, reply history, storage RLS fix, site content
-- ============================================================

-- Helper: check if user can write to their own storage prefix
CREATE OR REPLACE FUNCTION public.storage_owned_by_user(object_name TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    object_name LIKE user_id::text || '/%'
    OR object_name LIKE 'covers/' || user_id::text || '/%'
    OR object_name LIKE 'samples/' || user_id::text || '/%'
    OR (storage.foldername(object_name))[1] = user_id::text
    OR (storage.foldername(object_name))[2] = user_id::text
    OR (storage.foldername(object_name))[3] = user_id::text
    OR (storage.foldername(object_name))[4] = user_id::text;
$$;

-- ============================================================
-- CONTACT MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    subject     TEXT NOT NULL,
    message     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'unread'
                CHECK (status IN ('unread', 'read', 'archived', 'replied')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_message_replies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id  UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
    admin_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reply_body  TEXT NOT NULL,
    email_status TEXT NOT NULL DEFAULT 'pending'
                CHECK (email_status IN ('pending', 'delivered', 'failed')),
    sent_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_replies_message ON public.contact_message_replies(message_id);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_message_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message (anon + authenticated)
DROP POLICY IF EXISTS "contact_messages: public insert" ON public.contact_messages;
CREATE POLICY "contact_messages: public insert" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

-- Admins manage all contact messages
DROP POLICY IF EXISTS "contact_messages: admin all" ON public.contact_messages;
CREATE POLICY "contact_messages: admin all" ON public.contact_messages
    FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "contact_replies: admin all" ON public.contact_message_replies;
CREATE POLICY "contact_replies: admin all" ON public.contact_message_replies
    FOR ALL USING (public.is_admin(auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER contact_messages_updated_at
    BEFORE UPDATE ON public.contact_messages
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Course icon metadata on courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS icon_key TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS color_gradient TEXT;

-- ============================================================
-- STORAGE RLS FIX — simplified, path-prefix based policies
-- ============================================================

-- Drop conflicting thumbnail policies
DROP POLICY IF EXISTS "thumbnails: select" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: insert" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: update" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: delete" ON storage.objects;

CREATE POLICY "thumbnails: select" ON storage.objects
    FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails: insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'thumbnails'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR (
                public.is_seller(auth.uid())
                AND public.storage_owned_by_user(name, auth.uid())
            )
        )
    );

CREATE POLICY "thumbnails: update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'thumbnails'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR owner = auth.uid()
            OR public.storage_owned_by_user(name, auth.uid())
        )
    ) WITH CHECK (
        public.is_admin(auth.uid())
        OR owner = auth.uid()
        OR public.storage_owned_by_user(name, auth.uid())
    );

CREATE POLICY "thumbnails: delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'thumbnails'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR owner = auth.uid()
            OR public.storage_owned_by_user(name, auth.uid())
        )
    );

-- Drop conflicting preview policies
DROP POLICY IF EXISTS "previews: select" ON storage.objects;
DROP POLICY IF EXISTS "previews: insert" ON storage.objects;
DROP POLICY IF EXISTS "previews: update" ON storage.objects;
DROP POLICY IF EXISTS "previews: delete" ON storage.objects;
DROP POLICY IF EXISTS "previews: reviews upload" ON storage.objects;

CREATE POLICY "previews: select" ON storage.objects
    FOR SELECT USING (
        bucket_id IN ('previews', 'preview-images')
    );

CREATE POLICY "previews: insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN ('previews', 'preview-images')
        AND (
            -- Review images by any authenticated user
            (auth.role() = 'authenticated' AND split_part(name, '/', 1) = 'reviews')
            OR (
                auth.role() = 'authenticated'
                AND (
                    public.is_admin(auth.uid())
                    OR (
                        public.is_seller(auth.uid())
                        AND public.storage_owned_by_user(name, auth.uid())
                    )
                )
            )
        )
    );

CREATE POLICY "previews: update" ON storage.objects
    FOR UPDATE USING (
        bucket_id IN ('previews', 'preview-images')
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR owner = auth.uid()
            OR public.storage_owned_by_user(name, auth.uid())
            OR split_part(name, '/', 1) = 'reviews'
        )
    ) WITH CHECK (
        public.is_admin(auth.uid())
        OR owner = auth.uid()
        OR public.storage_owned_by_user(name, auth.uid())
        OR split_part(name, '/', 1) = 'reviews'
    );

CREATE POLICY "previews: delete" ON storage.objects
    FOR DELETE USING (
        bucket_id IN ('previews', 'preview-images')
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR owner = auth.uid()
            OR public.storage_owned_by_user(name, auth.uid())
        )
    );

-- Fix notes-pdfs insert to use helper function
DROP POLICY IF EXISTS "notes-pdfs: insert" ON storage.objects;
CREATE POLICY "notes-pdfs: insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'notes-pdfs'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR (
                public.is_seller(auth.uid())
                AND public.storage_owned_by_user(name, auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "notes-pdfs: update" ON storage.objects;
CREATE POLICY "notes-pdfs: update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'notes-pdfs'
        AND auth.role() = 'authenticated'
    ) WITH CHECK (
        public.is_admin(auth.uid())
        OR owner = auth.uid()
        OR public.storage_owned_by_user(name, auth.uid())
    );

-- Sample images bucket (dedicated for product sample pages)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'sample-images',
    'sample-images',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "sample-images: select" ON storage.objects;
DROP POLICY IF EXISTS "sample-images: insert" ON storage.objects;
DROP POLICY IF EXISTS "sample-images: update" ON storage.objects;
DROP POLICY IF EXISTS "sample-images: delete" ON storage.objects;

CREATE POLICY "sample-images: select" ON storage.objects
    FOR SELECT USING (bucket_id = 'sample-images');

CREATE POLICY "sample-images: insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'sample-images'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR (
                public.is_seller(auth.uid())
                AND public.storage_owned_by_user(name, auth.uid())
            )
        )
    );

CREATE POLICY "sample-images: update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'sample-images'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR owner = auth.uid()
            OR public.storage_owned_by_user(name, auth.uid())
        )
    ) WITH CHECK (
        public.is_admin(auth.uid())
        OR owner = auth.uid()
        OR public.storage_owned_by_user(name, auth.uid())
    );

CREATE POLICY "sample-images: delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'sample-images'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR owner = auth.uid()
            OR public.storage_owned_by_user(name, auth.uid())
        )
    );

-- Seed default site content settings
INSERT INTO public.settings (key, value, description) VALUES
    ('course_icons', '{"MBBS":"mbbs","BHMS":"bhms","BAMS":"bams","BSc Nursing":"nursing","B.Pharma":"pharma","BPT":"bpt","Paramedical":"paramedical"}'::jsonb, 'Course icon key mapping'),
    ('hero_animation', '{"enabled":true,"mobile_lightweight":true}'::jsonb, 'Hero 3D animation settings'),
    ('landing_stats', '{"notes":500,"students":12000,"sellers":150,"courses":7}'::jsonb, 'Landing page animated counters')
ON CONFLICT (key) DO NOTHING;
