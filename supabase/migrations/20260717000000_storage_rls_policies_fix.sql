-- ============================================================
-- 1. DROP ALL OLD/CONFLICTING POLICIES ON storage.objects
-- ============================================================

-- Drop notes-pdfs policies
DROP POLICY IF EXISTS "notes-pdfs: staff read" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: staff upload" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: staff delete" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: admin upload" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: admin delete" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: admin read all, sellers read own" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: sellers can upload own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: admins and owners update" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: admin delete all, sellers delete own" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: select" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: insert" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: update" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: delete" ON storage.objects;

-- Drop previews policies
DROP POLICY IF EXISTS "previews: public view" ON storage.objects;
DROP POLICY IF EXISTS "previews: auth approved sellers upload" ON storage.objects;
DROP POLICY IF EXISTS "previews: owner delete" ON storage.objects;
DROP POLICY IF EXISTS "previews: staff upload" ON storage.objects;
DROP POLICY IF EXISTS "previews: staff delete" ON storage.objects;
DROP POLICY IF EXISTS "previews: admin upload" ON storage.objects;
DROP POLICY IF EXISTS "previews: admin delete" ON storage.objects;
DROP POLICY IF EXISTS "previews: public read" ON storage.objects;
DROP POLICY IF EXISTS "previews: sellers and admins upload" ON storage.objects;
DROP POLICY IF EXISTS "previews: admins and owners update" ON storage.objects;
DROP POLICY IF EXISTS "previews: admins and owners delete" ON storage.objects;
DROP POLICY IF EXISTS "previews: select" ON storage.objects;
DROP POLICY IF EXISTS "previews: insert" ON storage.objects;
DROP POLICY IF EXISTS "previews: update" ON storage.objects;
DROP POLICY IF EXISTS "previews: delete" ON storage.objects;

-- Drop thumbnails policies
DROP POLICY IF EXISTS "thumbnails: staff upload" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: staff delete" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: public read" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: admin upload" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: admin delete" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: sellers and admins upload" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: admins and owners update" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: admins and owners delete" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: select" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: insert" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: update" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: delete" ON storage.objects;


-- ============================================================
-- 2. CREATE NEW POLICIES FOR notes-pdfs BUCKET (Private)
-- ============================================================

-- SELECT: Admins can read all; Sellers can read only their own; Or if direct download mode is enabled
CREATE POLICY "notes-pdfs: select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'notes-pdfs'
        AND (
            public.is_admin(auth.uid())
            OR (
                auth.role() = 'authenticated'
                AND EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'seller'
                )
                AND owner = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM public.settings 
                WHERE key = 'direct_download_mode' AND value = 'true'::jsonb
            )
        )
    );

-- INSERT: Admins can upload any; Sellers can upload only their own (check path segment 3)
CREATE POLICY "notes-pdfs: insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'notes-pdfs'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'seller'
                )
                AND (storage.foldername(name))[3] = auth.uid()::text
            )
        )
    );

-- UPDATE: Admins can update any; Sellers can update only their own
CREATE POLICY "notes-pdfs: update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'notes-pdfs'
        AND auth.role() = 'authenticated'
    ) WITH CHECK (
        public.is_admin(auth.uid())
        OR (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'seller'
            )
            AND owner = auth.uid()
        )
    );

-- DELETE: Admins can delete any; Sellers can delete only their own
CREATE POLICY "notes-pdfs: delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'notes-pdfs'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'seller'
                )
                AND owner = auth.uid()
            )
        )
    );


-- ============================================================
-- 3. CREATE NEW POLICIES FOR previews BUCKET (Public)
-- ============================================================

-- SELECT: Open to public
CREATE POLICY "previews: select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'previews' OR bucket_id = 'preview-images'
    );

-- INSERT: Admins can upload any; Sellers can upload previews (check path segment 2)
CREATE POLICY "previews: insert" ON storage.objects
    FOR INSERT WITH CHECK (
        (bucket_id = 'previews' OR bucket_id = 'preview-images')
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'seller'
                )
                AND (storage.foldername(name))[2] = auth.uid()::text
            )
        )
    );

-- UPDATE: Admins can update any; Sellers can update their own
CREATE POLICY "previews: update" ON storage.objects
    FOR UPDATE USING (
        (bucket_id = 'previews' OR bucket_id = 'preview-images')
        AND auth.role() = 'authenticated'
    ) WITH CHECK (
        public.is_admin(auth.uid())
        OR (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'seller'
            )
            AND owner = auth.uid()
        )
    );

-- DELETE: Admins can delete any; Sellers can delete their own
CREATE POLICY "previews: delete" ON storage.objects
    FOR DELETE USING (
        (bucket_id = 'previews' OR bucket_id = 'preview-images')
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'seller'
                )
                AND owner = auth.uid()
            )
        )
    );


-- ============================================================
-- 4. CREATE NEW POLICIES FOR thumbnails BUCKET (Public)
-- ============================================================

-- SELECT: Open to public
CREATE POLICY "thumbnails: select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'thumbnails'
    );

-- INSERT: Admins can upload any; Sellers can upload thumbnails (check path segment 4)
CREATE POLICY "thumbnails: insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'thumbnails'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'seller'
                )
                AND (storage.foldername(name))[4] = auth.uid()::text
            )
        )
    );

-- UPDATE: Admins can update any; Sellers can update their own
CREATE POLICY "thumbnails: update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'thumbnails'
        AND auth.role() = 'authenticated'
    ) WITH CHECK (
        public.is_admin(auth.uid())
        OR (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'seller'
            )
            AND owner = auth.uid()
        )
    );

-- DELETE: Admins can delete any; Sellers can delete their own
CREATE POLICY "thumbnails: delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'thumbnails'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'seller'
                )
                AND owner = auth.uid()
            )
        )
    );

-- ============================================================
-- 5. REVIEWS & DISCUSSION UPDATES
-- ============================================================

-- Add image_url column to reviews if it does not exist
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add is_official column to comment_replies if it does not exist
ALTER TABLE public.comment_replies ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false;

-- Create comment_likes table for discussion liking
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reply_id   UUID REFERENCES public.comment_replies(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (comment_id, user_id),
    UNIQUE (reply_id, user_id),
    CONSTRAINT check_only_one CHECK (
        (comment_id IS NOT NULL AND reply_id IS NULL) OR
        (comment_id IS NULL AND reply_id IS NOT NULL)
    )
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_likes: public read" ON public.comment_likes;
CREATE POLICY "comment_likes: public read" ON public.comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "comment_likes: own write" ON public.comment_likes;
CREATE POLICY "comment_likes: own write" ON public.comment_likes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to upload review images to reviews/ folder in previews bucket
DROP POLICY IF EXISTS "previews: reviews upload" ON storage.objects;
CREATE POLICY "previews: reviews upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'previews'
        AND auth.role() = 'authenticated'
        AND (split_part(name, '/', 1) = 'reviews')
    );
