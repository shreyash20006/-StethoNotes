-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. notes-pdfs bucket policies

-- Select policy: Admins can view all, Sellers can view their own
DROP POLICY IF EXISTS "notes-pdfs: staff read" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: admin read all, sellers read own" ON storage.objects;
CREATE POLICY "notes-pdfs: admin read all, sellers read own" ON storage.objects
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

-- Insert policy: Sellers can upload their own, Admins can upload any
DROP POLICY IF EXISTS "notes-pdfs: staff upload" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: sellers can upload own PDFs" ON storage.objects;
CREATE POLICY "notes-pdfs: sellers can upload own PDFs" ON storage.objects
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

-- Update policy: Admins can update any, Sellers can update their own
DROP POLICY IF EXISTS "notes-pdfs: admins and owners update" ON storage.objects;
CREATE POLICY "notes-pdfs: admins and owners update" ON storage.objects
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

-- Delete policy: Admins can delete any, Sellers can delete their own
DROP POLICY IF EXISTS "notes-pdfs: staff delete" ON storage.objects;
DROP POLICY IF EXISTS "notes-pdfs: admin delete all, sellers delete own" ON storage.objects;
CREATE POLICY "notes-pdfs: admin delete all, sellers delete own" ON storage.objects
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


-- 2. previews bucket policies

-- Select policy: Public can read previews
DROP POLICY IF EXISTS "previews: public view" ON storage.objects;
DROP POLICY IF EXISTS "previews: public read" ON storage.objects;
CREATE POLICY "previews: public read" ON storage.objects 
    FOR SELECT USING (
        bucket_id = 'previews' OR bucket_id = 'preview-images'
    );

-- Insert policy: Sellers can upload previews, Admins can upload any
DROP POLICY IF EXISTS "previews: staff upload" ON storage.objects;
DROP POLICY IF EXISTS "previews: auth approved sellers upload" ON storage.objects;
DROP POLICY IF EXISTS "previews: sellers and admins upload" ON storage.objects;
CREATE POLICY "previews: sellers and admins upload" ON storage.objects 
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

-- Update policy: Admins can update any, Sellers can update their own
DROP POLICY IF EXISTS "previews: admins and owners update" ON storage.objects;
CREATE POLICY "previews: admins and owners update" ON storage.objects 
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

-- Delete policy: Admins can delete any, Sellers can delete their own
DROP POLICY IF EXISTS "previews: owner delete" ON storage.objects;
DROP POLICY IF EXISTS "previews: staff delete" ON storage.objects;
DROP POLICY IF EXISTS "previews: admins and owners delete" ON storage.objects;
CREATE POLICY "previews: admins and owners delete" ON storage.objects 
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
