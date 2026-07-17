-- Fix relationship between notes and seller_profiles for PostgREST joins
ALTER TABLE public.notes
  DROP CONSTRAINT IF EXISTS fk_notes_seller_profiles;

ALTER TABLE public.notes
  ADD CONSTRAINT fk_notes_seller_profiles
  FOREIGN KEY (seller_id)
  REFERENCES public.seller_profiles(id)
  ON DELETE SET NULL;
