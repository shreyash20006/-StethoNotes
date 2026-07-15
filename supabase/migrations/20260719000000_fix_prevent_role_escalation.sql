-- Fix prevent_role_escalation trigger and is_admin helper to allow admin onboarding and user updates
-- Update is_admin to look up profiles as well as the admin_allowlist
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role IN ('admin', 'super_admin')
    ) OR EXISTS (
        SELECT 1 FROM public.admin_allowlist a
        JOIN auth.users u ON a.email = u.email
        WHERE u.id = user_id
    );
END;
$$;

-- Update prevent_role_escalation trigger function to use the updated is_admin check
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if role or status is being modified by an unauthorized user
    IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Allow the transitioning from 'student' to 'seller_pending' status 'pending' (application submission)
        IF NEW.role = 'seller_pending' AND NEW.status = 'pending' AND OLD.role = 'student' THEN
            RETURN NEW;
        END IF;

        -- For all other changes, verify caller is admin or super_admin
        IF NOT public.is_admin(auth.uid()) THEN
            RAISE EXCEPTION 'Privilege Escalation Blocked: You cannot modify your role or status details.';
        END IF;
    END IF;
    
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
