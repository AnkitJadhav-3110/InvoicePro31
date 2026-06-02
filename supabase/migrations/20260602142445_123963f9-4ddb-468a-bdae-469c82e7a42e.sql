
CREATE TABLE public.shared_invoice_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  invoice_snapshot jsonb NOT NULL,
  business_snapshot jsonb NOT NULL,
  client_snapshot jsonb NOT NULL,
  settings_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shared_invoice_links_token_idx ON public.shared_invoice_links(token);
CREATE INDEX shared_invoice_links_user_idx ON public.shared_invoice_links(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_invoice_links TO authenticated;
GRANT SELECT, UPDATE ON public.shared_invoice_links TO anon;
GRANT ALL ON public.shared_invoice_links TO service_role;

ALTER TABLE public.shared_invoice_links ENABLE ROW LEVEL SECURITY;

-- Owner can manage their links
CREATE POLICY "Owners manage own share links"
  ON public.shared_invoice_links
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can read non-revoked, non-expired links (knowing the token is the auth)
CREATE POLICY "Public can view valid share links"
  ON public.shared_invoice_links
  FOR SELECT
  TO anon, authenticated
  USING (revoked = false AND expires_at > now());

-- Public can mark a valid link as paid (only paid/paid_at fields effectively via app code)
CREATE POLICY "Public can update paid status on valid links"
  ON public.shared_invoice_links
  FOR UPDATE
  TO anon, authenticated
  USING (revoked = false AND expires_at > now())
  WITH CHECK (revoked = false AND expires_at > now());
