-- ============================================================
-- STETHONOTES — DATABASE MIGRATION (SELLER PROFILES RLS FIX)
-- Run this script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Drop old conflicting policies on seller_profiles
DROP POLICY IF EXISTS "seller_profiles: admin manage" ON public.seller_profiles;
DROP POLICY IF EXISTS "seller_profiles: admin select" ON public.seller_profiles;
DROP POLICY IF EXISTS "seller_profiles: admin insert" ON public.seller_profiles;
DROP POLICY IF EXISTS "seller_profiles: admin update" ON public.seller_profiles;
DROP POLICY IF EXISTS "seller_profiles: admin delete" ON public.seller_profiles;

-- Create explicit inline policies for administrators to manage all seller profiles
CREATE POLICY "seller_profiles: admin select" ON public.seller_profiles
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "seller_profiles: admin insert" ON public.seller_profiles
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "seller_profiles: admin update" ON public.seller_profiles
    FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "seller_profiles: admin delete" ON public.seller_profiles
    FOR DELETE USING (public.is_admin(auth.uid()));
