-- ============================================================
-- Fix Storage RLS: Remove non-existent 'owner' column references
-- The 'owner' column does not exist on storage.objects in Supabase.
-- Replace all owner = auth.uid() checks with storage_owned_by_user().
-- ============================================================

-- ============================================================
-- NOTES-PDFS BUCKET
-- ============================================================

DROP POLICY IF EXISTS "notes-pdfs: select" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: insert" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: update" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: delete" ON storage.objects;

CREATE POLICY "notes-pdfs: select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'notes-pdfs'
        AND (
            public.is_admin(auth.uid())
            OR (
                auth.role() = 'authenticated'
                AND public.is_seller(auth.uid())
                AND public.storage_owned_by_user(name, auth.uid())
            )
            OR EXISTS (
                SELECT 1 FROM public.settings
                WHERE key = 'direct_download_mode' AND value = 'true'::jsonb
            )
        )
    );

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

CREATE POLICY "notes-pdfs: update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'notes-pdfs'
        AND auth.role() = 'authenticated'
    ) WITH CHECK (
        public.is_admin(auth.uid())
        OR (
            public.is_seller(auth.uid())
            AND public.storage_owned_by_user(name, auth.uid())
        )
    );

CREATE POLICY "notes-pdfs: delete" ON storage.objects
    FOR DELETE USING (
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


-- ============================================================
-- THUMBNAILS BUCKET
-- ============================================================

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
            OR public.storage_owned_by_user(name, auth.uid())
        )
    ) WITH CHECK (
        public.is_admin(auth.uid())
        OR public.storage_owned_by_user(name, auth.uid())
    );

CREATE POLICY "thumbnails: delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'thumbnails'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR public.storage_owned_by_user(name, auth.uid())
        )
    );


-- ============================================================
-- PREVIEWS BUCKET
-- ============================================================

DROP POLICY IF EXISTS "previews: select" ON storage.objects;
DROP POLICY IF EXISTS "previews: insert" ON storage.objects;
DROP POLICY IF EXISTS "previews: update" ON storage.objects;
DROP POLICY IF EXISTS "previews: delete" ON storage.objects;

CREATE POLICY "previews: select" ON storage.objects
    FOR SELECT USING (
        bucket_id IN ('previews', 'preview-images')
    );

CREATE POLICY "previews: insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN ('previews', 'preview-images')
        AND (
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
            OR public.storage_owned_by_user(name, auth.uid())
            OR split_part(name, '/', 1) = 'reviews'
        )
    ) WITH CHECK (
        public.is_admin(auth.uid())
        OR public.storage_owned_by_user(name, auth.uid())
        OR split_part(name, '/', 1) = 'reviews'
    );

CREATE POLICY "previews: delete" ON storage.objects
    FOR DELETE USING (
        bucket_id IN ('previews', 'preview-images')
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR public.storage_owned_by_user(name, auth.uid())
        )
    );


-- ============================================================
-- SAMPLE-IMAGES BUCKET
-- ============================================================

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
            OR public.storage_owned_by_user(name, auth.uid())
        )
    ) WITH CHECK (
        public.is_admin(auth.uid())
        OR public.storage_owned_by_user(name, auth.uid())
    );

CREATE POLICY "sample-images: delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'sample-images'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR public.storage_owned_by_user(name, auth.uid())
        )
    );


-- ============================================================
-- ENSURE is_admin and is_seller functions exist
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role IN ('admin', 'super_admin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_seller(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role IN ('seller', 'seller_pending')
    );
END;
$$;

-- Ensure storage_owned_by_user helper exists
CREATE OR REPLACE FUNCTION public.storage_owned_by_user(object_name TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    object_name LIKE user_id::text || '/%'
    OR (storage.foldername(object_name))[1] = user_id::text
    OR (storage.foldername(object_name))[2] = user_id::text
    OR (storage.foldername(object_name))[3] = user_id::text
    OR (storage.foldername(object_name))[4] = user_id::text;
$$;
