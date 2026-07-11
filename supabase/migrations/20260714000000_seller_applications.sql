-- ============================================================
-- STETHONOTES — DATABASE MIGRATION (SELLER APPLICATIONS)
-- Run this script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Ensure the is_admin helper function exists first
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

-- Create seller_applications table
CREATE TABLE IF NOT EXISTS public.seller_applications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name         TEXT NOT NULL,
    email             TEXT NOT NULL,
    phone             TEXT NOT NULL,
    college           TEXT NOT NULL,
    course            TEXT NOT NULL,
    year              TEXT NOT NULL,
    upi_id            TEXT NOT NULL,
    bio               TEXT,
    government_id_url TEXT,
    profile_photo_url TEXT,
    status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at       TIMESTAMPTZ,
    reviewed_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejection_reason  TEXT,
    UNIQUE (user_id) -- Only one active/stored application profile per user account
);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Users can view their own application, admins can view all
CREATE POLICY "seller_apps: select policy" ON public.seller_applications
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 2. INSERT: Authenticated users can insert their own application
CREATE POLICY "seller_apps: insert policy" ON public.seller_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Only admins can update applications
CREATE POLICY "seller_apps: update policy" ON public.seller_applications
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_seller_apps_user ON public.seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_apps_status ON public.seller_applications(status);
