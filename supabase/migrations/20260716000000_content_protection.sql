-- ============================================================
-- STETHONOTES — DATABASE MIGRATION (CONTENT PROTECTION SYSTEM)
-- Run this script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Extend public.notes table with additional metadata columns
ALTER TABLE public.notes
    ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'pdf' CHECK (content_type IN ('pdf', 'images')),
    ADD COLUMN IF NOT EXISTS generated_pdf_path TEXT,
    ADD COLUMN IF NOT EXISTS original_pdf TEXT,
    ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 0 CHECK (page_count >= 0),
    ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0 CHECK (file_size >= 0);

-- 2. Create download_history table to track downloads and enforce limit rules
CREATE TABLE IF NOT EXISTS public.download_history (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    note_id       UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    customer_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address    TEXT,
    device_info   TEXT,
    browser       TEXT,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create watermark_logs table to keep history of personalized files
CREATE TABLE IF NOT EXISTS public.watermark_logs (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id           UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    note_id            UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    customer_name      TEXT NOT NULL,
    customer_email     TEXT NOT NULL,
    generated_pdf_path TEXT NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watermark_logs ENABLE ROW LEVEL SECURITY;

-- Download History Policies
DROP POLICY IF EXISTS "download_history: select policy" ON public.download_history;
CREATE POLICY "download_history: select policy" ON public.download_history
    FOR SELECT USING (
        auth.uid() = customer_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "download_history: insert policy" ON public.download_history;
CREATE POLICY "download_history: insert policy" ON public.download_history
    FOR INSERT WITH CHECK (
        auth.uid() = customer_id 
        OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Watermark Logs Policies (Admins only)
DROP POLICY IF EXISTS "watermark_logs: select policy" ON public.watermark_logs;
CREATE POLICY "watermark_logs: select policy" ON public.watermark_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "watermark_logs: write policy" ON public.watermark_logs;
CREATE POLICY "watermark_logs: write policy" ON public.watermark_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_download_history_order ON public.download_history(order_id);
CREATE INDEX IF NOT EXISTS idx_download_history_note ON public.download_history(note_id);
CREATE INDEX IF NOT EXISTS idx_download_history_customer ON public.download_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_watermark_logs_order ON public.watermark_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_watermark_logs_note ON public.watermark_logs(note_id);

-- ==========================================
-- STORAGE BUCKET: PREVIEW-IMAGES
-- ==========================================

-- Seed preview-images public bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'preview-images', 
    'preview-images', 
    true, 
    10485760, -- 10 MB limit for preview images
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = true, 
    file_size_limit = 10485760, 
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Add storage RLS policies for preview-images
DROP POLICY IF EXISTS "previews: public view" ON storage.objects;
CREATE POLICY "previews: public view" ON storage.objects 
    FOR SELECT USING (bucket_id = 'preview-images' OR bucket_id = 'previews');

DROP POLICY IF EXISTS "previews: auth approved sellers upload" ON storage.objects;
CREATE POLICY "previews: auth approved sellers upload" ON storage.objects 
    FOR INSERT WITH CHECK (
        (bucket_id = 'preview-images' OR bucket_id = 'previews')
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('seller', 'admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "previews: owner delete" ON storage.objects;
CREATE POLICY "previews: owner delete" ON storage.objects 
    FOR DELETE USING (
        (bucket_id = 'preview-images' OR bucket_id = 'previews')
        AND auth.role() = 'authenticated'
        AND (owner = auth.uid()::text OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        ))
    );
