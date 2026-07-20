import { supabase } from '@/integrations/supabase/client';
import type { Business, Client, Invoice, AppSettings } from '@/store/useStore';

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 40);
}

export interface CreatePortalLinkParams {
  invoice: Invoice;
  business: Business;
  client: Client;
  settings: AppSettings;
  userId: string;
  ttlDays?: number;
}

export interface PortalLinkRow {
  id: string;
  token: string;
  invoice_id: string;
  user_id: string;
  invoice_snapshot: Invoice;
  business_snapshot: Business;
  client_snapshot: Client;
  settings_snapshot: AppSettings;
  expires_at: string;
  revoked: boolean;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export async function createClientPortalLink(params: CreatePortalLinkParams): Promise<{ url: string; token: string; expiresAt: string }> {
  const { invoice, business, client, settings, userId, ttlDays = 30 } = params;
  const token = generateToken();
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('shared_invoice_links').insert({
    token,
    user_id: userId,
    invoice_id: invoice.id,
    invoice_snapshot: invoice as any,
    business_snapshot: business as any,
    client_snapshot: client as any,
    settings_snapshot: settings as any,
    expires_at: expiresAt,
  });
  if (error) throw error;

  const url = `${window.location.origin}/portal/${token}`;
  return { url, token, expiresAt };
}

export async function fetchPortalInvoice(token: string): Promise<PortalLinkRow | null> {
  const { data, error } = await supabase.functions.invoke('portal-get', { body: { token } });
  if (error) throw error;
  const row = (data as any)?.data;
  if (!row) return null;
  return row as PortalLinkRow;
}

export async function markPortalInvoicePaid(token: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('portal-mark-paid', { body: { token } });
  if (error) throw error;
  if (!(data as any)?.updated) throw new Error('Payment could not be recorded.');
}

export async function revokePortalLink(token: string): Promise<void> {
  const { error } = await supabase
    .from('shared_invoice_links')
    .update({ revoked: true })
    .eq('token', token);
  if (error) throw error;
}
