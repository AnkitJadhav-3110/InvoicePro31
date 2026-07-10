
DROP POLICY IF EXISTS "Public can view valid share links" ON public.shared_invoice_links;
DROP POLICY IF EXISTS "Public can update paid status on valid links" ON public.shared_invoice_links;

CREATE OR REPLACE FUNCTION public.get_shared_invoice(_token text)
RETURNS SETOF public.shared_invoice_links
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.shared_invoice_links
  WHERE token = _token
    AND revoked = false
    AND expires_at > now()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.mark_shared_invoice_paid(_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated int;
BEGIN
  UPDATE public.shared_invoice_links
     SET paid = true,
         paid_at = now()
   WHERE token = _token
     AND revoked = false
     AND expires_at > now()
     AND paid = false;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.get_shared_invoice(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_shared_invoice_paid(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_invoice(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_shared_invoice_paid(text) TO anon, authenticated;
