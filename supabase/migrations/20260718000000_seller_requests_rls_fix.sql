-- Fix seller_requests RLS so admins can see all requests
DROP POLICY IF EXISTS "seller_requests: own view"    ON public.seller_requests;
DROP POLICY IF EXISTS "seller_requests: admin view"  ON public.seller_requests;
DROP POLICY IF EXISTS "seller_requests: own insert"  ON public.seller_requests;
DROP POLICY IF EXISTS "seller_requests: admin write" ON public.seller_requests;
CREATE POLICY "seller_requests: own view" ON public.seller_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "seller_requests: admin view" ON public.seller_requests FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "seller_requests: own insert" ON public.seller_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "seller_requests: admin update" ON public.seller_requests FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "seller_requests: admin delete" ON public.seller_requests FOR DELETE USING (public.is_admin(auth.uid()));