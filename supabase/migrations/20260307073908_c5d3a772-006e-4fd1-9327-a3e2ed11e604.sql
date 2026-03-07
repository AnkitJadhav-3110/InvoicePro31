
-- Add currency fields to clients table
ALTER TABLE public.clients
ADD COLUMN currency text NOT NULL DEFAULT 'USD',
ADD COLUMN currency_symbol text NOT NULL DEFAULT '$';

-- Create invoice_attachments table
CREATE TABLE public.invoice_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_attachments
CREATE POLICY "Users can view own attachments" ON public.invoice_attachments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attachments" ON public.invoice_attachments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments" ON public.invoice_attachments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for invoice attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('invoice-attachments', 'invoice-attachments', false, 10485760);

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users can upload attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'invoice-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'invoice-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'invoice-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
