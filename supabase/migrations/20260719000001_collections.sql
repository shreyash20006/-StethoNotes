-- Collections: named bundles of notes that can be purchased as a set
CREATE TABLE IF NOT EXISTS public.collections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  cover_url    TEXT,
  bundle_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Junction table: which notes belong to which collection
CREATE TABLE IF NOT EXISTS public.collection_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  note_id       UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  position      INT NOT NULL DEFAULT 0,
  UNIQUE(collection_id, note_id)
);

-- RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read active collections
CREATE POLICY "collections: public read" ON public.collections
  FOR SELECT USING (is_active = TRUE);

-- Admins can do everything
CREATE POLICY "collections: admin manage" ON public.collections
  FOR ALL USING (public.is_admin(auth.uid()));

-- Anyone can read collection items (to see what notes are in a collection)
CREATE POLICY "collection_items: public read" ON public.collection_items
  FOR SELECT USING (TRUE);

-- Admins can manage collection items
CREATE POLICY "collection_items: admin manage" ON public.collection_items
  FOR ALL USING (public.is_admin(auth.uid()));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_note ON public.collection_items(note_id);