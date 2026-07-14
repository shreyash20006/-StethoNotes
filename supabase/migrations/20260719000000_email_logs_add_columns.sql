-- Add recipient and subject columns to email_logs for proper display
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS recipient TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS subject TEXT;

-- Backfill existing logs from joined orders table
UPDATE public.email_logs el
SET
  recipient = o.customer_email,
  subject = '📚 Your StethoNotes Order is Ready!'
FROM public.orders o
WHERE el.order_id = o.id
  AND el.recipient IS NULL;