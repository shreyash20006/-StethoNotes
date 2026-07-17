-- Add contact@tgpcopcouncil.online to the admin allowlist
INSERT INTO public.admin_allowlist (email, role)
VALUES ('contact@tgpcopcouncil.online', 'admin')
ON CONFLICT (email) DO NOTHING;
