-- ============================================================
-- STETHONOTES — DATABASE MIGRATION (FEATURED SELLERS VIEW)
-- Run this script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Create a view to compute featured sellers automatically based on:
-- 1. KYC verified (all 4 required documents approved)
-- 2. 10+ completed sales
-- 3. Refund rate < 2%
CREATE OR REPLACE VIEW public.featured_sellers AS
WITH seller_sales AS (
    SELECT 
        n.seller_id,
        count(oi.id) as total_sales,
        count(r.id) as refunded_sales
    FROM public.order_items oi
    JOIN public.notes n ON oi.note_id = n.id
    JOIN public.orders o ON oi.order_id = o.id
    LEFT JOIN public.refunds r ON r.order_id = o.id AND r.status = 'processed'
    WHERE o.payment_status = 'completed'
    GROUP BY n.seller_id
)
SELECT 
    sp.id,
    sp.store_name,
    sp.bio,
    p.name,
    p.avatar_url,
    COALESCE(ss.total_sales, 0) as total_sales,
    COALESCE(ss.refunded_sales, 0) as refunded_sales,
    CASE 
        WHEN COALESCE(ss.total_sales, 0) = 0 THEN 0.0
        ELSE ROUND((COALESCE(ss.refunded_sales, 0)::numeric / ss.total_sales::numeric) * 100, 2)
    END as refund_rate
FROM public.seller_profiles sp
JOIN public.profiles p ON sp.id = p.id
LEFT JOIN seller_sales ss ON sp.id = ss.seller_id
WHERE 
    p.role = 'seller'
    -- KYC Verified check: college_id, govt_id, pan, bank_proof must all be approved
    AND NOT EXISTS (
        SELECT 1
        FROM unnest(ARRAY['college_id', 'govt_id', 'pan', 'bank_proof']) t(doc_type)
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.seller_documents sd
            WHERE sd.user_id = sp.id AND sd.status = 'approved' AND sd.doc_type = t.doc_type
        )
    )
    -- 10+ sales check
    AND COALESCE(ss.total_sales, 0) >= 10
    -- Refund rate < 2% check
    AND (
        COALESCE(ss.total_sales, 0) = 0 
        OR (COALESCE(ss.refunded_sales, 0)::numeric / ss.total_sales::numeric) < 0.02
    );

-- Grant select permission to API roles (anon and authenticated)
GRANT SELECT ON public.featured_sellers TO anon, authenticated;
