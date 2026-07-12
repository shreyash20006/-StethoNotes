-- Ensure Row Level Security is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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

-- Drop thumbnails policies
DROP POLICY IF EXISTS "thumbnails: staff upload" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: staff delete" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: public read" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: admin upload" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: admin delete" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: sellers and admins upload" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: admins and owners update" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails: admins and owners delete" ON storage.objects;


-- ============================================================
-- 2. CREATE NEW POLICIES FOR notes-pdfs BUCKET (Private)
-- ============================================================

-- SELECT: Admins can read all; Sellers can read only their own
CREATE POLICY "notes-pdfs: select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'notes-pdfs'
        AND auth.role() = 'authenticated'
        AND (
            public.is_admin(auth.uid())
            OR (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'seller'
                )
                AND owner = auth.uid()::text
            )
        )
    );

-- INSERT: Admins can upload any; Sellers can upload only their own
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
                AND (owner = auth.uid()::text OR owner IS NULL)
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
            AND owner = auth.uid()::text
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
                AND owner = auth.uid()::text
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

-- INSERT: Admins can upload any; Sellers can upload previews
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
                AND (owner = auth.uid()::text OR owner IS NULL)
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
            AND owner = auth.uid()::text
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
                AND owner = auth.uid()::text
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

-- INSERT: Admins can upload any; Sellers can upload thumbnails
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
                AND (owner = auth.uid()::text OR owner IS NULL)
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
            AND owner = auth.uid()::text
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
                AND owner = auth.uid()::text
            )
        )
    );
