
-- Split shared_invoice_links policies for clarity and strict owner scoping
DROP POLICY IF EXISTS "Owners manage own share links" ON public.shared_invoice_links;

CREATE POLICY "share_links_select_own" ON public.shared_invoice_links
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "share_links_insert_own" ON public.shared_invoice_links
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "share_links_update_own" ON public.shared_invoice_links
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "share_links_delete_own" ON public.shared_invoice_links
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Explicit owner-scoped UPDATE policy on invoice_attachments (fail-closed + explicit)
CREATE POLICY "Users can update own attachments" ON public.invoice_attachments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Remove public execution of SECURITY DEFINER share functions.
-- Portal access now goes through edge functions using the service role.
REVOKE EXECUTE ON FUNCTION public.get_shared_invoice(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_shared_invoice_paid(text) FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.get_shared_invoice(text);
DROP FUNCTION IF EXISTS public.mark_shared_invoice_paid(text);
