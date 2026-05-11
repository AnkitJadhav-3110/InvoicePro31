import { Invoice, Business, Client, AppSettings } from '@/store/useStore';

export class ShareAuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'ShareAuthError';
  }
}

interface ShareParams {
  invoice: Invoice | Omit<Invoice, 'id'> & { id?: string };
  currentUserId: string | null | undefined;
  invoiceOwnerId: string | null | undefined;
  baseUrl?: string;
}

/**
 * Builds a shareable invoice link. Refuses to expose another user's invoice,
 * even if the requesting user is "guessing" an invoice id they don't own.
 * The link is only produced when ownership is fully verified.
 */
export function buildShareableInvoiceLink(params: ShareParams): string {
  const { invoice, currentUserId, invoiceOwnerId, baseUrl = 'https://app.example/invoice/' } = params;
  if (!currentUserId) {
    throw new ShareAuthError('You must be signed in to share an invoice.');
  }
  if (!invoiceOwnerId) {
    throw new ShareAuthError('Invoice owner is unknown.');
  }
  if (invoiceOwnerId !== currentUserId) {
    throw new ShareAuthError('You are not authorized to share this invoice.');
  }
  const id = (invoice as { id?: string }).id;
  if (!id) {
    throw new ShareAuthError('Cannot share an invoice without an id.');
  }
  return `${baseUrl}${encodeURIComponent(id)}`;
}

interface EmailExportParams {
  invoice: Invoice | Omit<Invoice, 'id'>;
  client: Client;
  business: Business;
  settings: AppSettings;
  currentUserId: string | null | undefined;
  invoiceOwnerId: string | null | undefined;
  clientOwnerId?: string | null | undefined;
}

export interface SimulatedEmail {
  to: string;
  subject: string;
  body: string;
}

/**
 * Simulates the email-export flow (mailto draft) but only after verifying
 * that the caller owns the invoice and client. Returns the email payload so
 * callers/tests can assert it does not contain another user's data.
 */
export function simulateInvoiceEmailExportAuthorized(
  params: EmailExportParams,
): SimulatedEmail {
  const { invoice, client, business, currentUserId, invoiceOwnerId, clientOwnerId } = params;
  if (!currentUserId) {
    throw new ShareAuthError('You must be signed in to email this invoice.');
  }
  if (!invoiceOwnerId || invoiceOwnerId !== currentUserId) {
    throw new ShareAuthError('You are not authorized to email this invoice.');
  }
  if (clientOwnerId && clientOwnerId !== currentUserId) {
    throw new ShareAuthError('Client does not belong to current user.');
  }
  return {
    to: client.email,
    subject: `Invoice ${invoice.invoiceNumber} from ${business.name}`,
    body: `Hello ${client.name},\n\nPlease find your invoice ${invoice.invoiceNumber} for ${client.currencySymbol}${invoice.total.toFixed(2)}.\n\n${business.name}`,
  };
}
