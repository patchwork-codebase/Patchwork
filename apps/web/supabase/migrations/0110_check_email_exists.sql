-- Create a function to check if an email exists without exposing other user data
-- Note: This is explicitly created with SECURITY DEFINER to bypass RLS,
-- as it needs to query auth.users from an unauthenticated context (during login).

CREATE OR REPLACE FUNCTION public.check_email_exists(email_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE email = lower(trim(email_address))
    );
END;
$$;

-- Grant access to both anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated;
