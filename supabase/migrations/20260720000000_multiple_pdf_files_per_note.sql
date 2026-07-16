-- Support multiple PDF files per product while keeping legacy pdf_url readers working.

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS pdf_files JSONB NOT NULL DEFAULT '[]'::JSONB;

UPDATE public.notes
SET pdf_files = jsonb_build_array(
  jsonb_build_object(
    'name', COALESCE(NULLIF(title, ''), 'Study file') || '.pdf',
    'path', pdf_url,
    'size', COALESCE(file_size, 0),
    'pages', COALESCE(page_count, 0),
    'order', 1
  )
)
WHERE (pdf_files IS NULL OR pdf_files = '[]'::JSONB)
  AND pdf_url IS NOT NULL
  AND pdf_url <> '';

ALTER TABLE public.notes
  ALTER COLUMN pdf_url DROP NOT NULL;

ALTER TABLE public.download_history
  ADD COLUMN IF NOT EXISTS file_index INTEGER NOT NULL DEFAULT 0 CHECK (file_index >= 0);

CREATE INDEX IF NOT EXISTS idx_download_history_note_file
  ON public.download_history(order_id, note_id, file_index);

UPDATE storage.buckets
SET file_size_limit = 104857600,
    allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'notes-pdfs';
