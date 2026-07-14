DROP POLICY IF EXISTS "seller_apps: select policy" ON public.seller_applications;
CREATE POLICY "seller_apps: select policy" ON public.seller_applications
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        public.is_admin(auth.uid())
    );

DROP POLICY IF EXISTS "seller_apps: update policy" ON public.seller_applications;
CREATE POLICY "seller_apps: update policy" ON public.seller_applications
    FOR UPDATE USING (
        public.is_admin(auth.uid())
    );

DROP POLICY IF EXISTS "seller_profiles: admin select" ON public.seller_profiles;
CREATE POLICY "seller_profiles: admin select" ON public.seller_profiles
    FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "seller_profiles: admin insert" ON public.seller_profiles;
CREATE POLICY "seller_profiles: admin insert" ON public.seller_profiles
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "seller_profiles: admin update" ON public.seller_profiles;
CREATE POLICY "seller_profiles: admin update" ON public.seller_profiles
    FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "seller_profiles: admin delete" ON public.seller_profiles;
CREATE POLICY "seller_profiles: admin delete" ON public.seller_profiles
    FOR DELETE USING (public.is_admin(auth.uid()));
