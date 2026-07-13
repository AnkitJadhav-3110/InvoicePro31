import type {
  Invoice,
  Client,
  Business,
  AppSettings,
  InvoiceItem,
} from '@/store/useStore';
import type {
  RenderModel,
  RenderModelItem,
} from './types';

function safe(v: unknown, fallback = ''): string {
  if (v === null || v === undefined) return fallback;
  const s = String(v);
  if (s === 'undefined' || s === 'null' || s === 'NaN') return fallback;
  return s;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function normalizeItem(item: InvoiceItem): RenderModelItem {
  const quantity = num(item.quantity);
  const price = num(item.price);
  const discount = num(item.discount);
  const taxRate = num(item.taxRate);
  const lineTotal = quantity * price;
  const amount = lineTotal - lineTotal * (discount / 100);
  return {
    description: safe(item.description, 'Item'),
    quantity,
    price,
    taxRate,
    discount,
    amount,
  };
}

/**
 * Pure normalizer: invoice + related entities → RenderModel.
 *
 * Guarantees:
 *  - no NaN / undefined / null / "[object Object]" leaks into rendered text
 *  - totals are numeric
 *  - dates are ISO strings the renderers can parse consistently
 */
export function buildRenderModel(
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  _settings: AppSettings,
): RenderModel {
  const items = (invoice.items ?? []).map(normalizeItem);
  return {
    business: {
      name: safe(business?.name, 'Your Company'),
      email: safe(business?.email),
      phone: safe(business?.phone),
      address: safe(business?.address),
      city: safe(business?.city),
      country: safe(business?.country),
      taxId: safe(business?.taxId) || undefined,
      logoDataUrl: business?.logo || undefined,
      signatureDataUrl: business?.signature || undefined,
      footerText: safe(business?.footerText) || undefined,
    },
    client: {
      name: safe(client?.name, 'Client'),
      email: safe(client?.email),
      phone: safe(client?.phone),
      address: safe(client?.address),
      city: safe(client?.city),
      country: safe(client?.country),
      taxId: safe(client?.taxId) || undefined,
      currencySymbol: safe(client?.currencySymbol, '$'),
    },
    invoice: {
      number: safe(invoice.invoiceNumber, 'INV-0000'),
      status: ((invoice as Invoice).status || 'draft') as RenderModel['invoice']['status'],
      isPaid: Boolean((invoice as Invoice).isPaid),
      issuedOn: safe(invoice.createdAt, new Date().toISOString()),
      dueOn: safe(invoice.dueDate, new Date().toISOString()),
      notes: safe(invoice.notes) || undefined,
      paymentQR: safe(invoice.paymentQR) || undefined,
    },
    items,
    totals: {
      subtotal: num(invoice.subtotal),
      taxTotal: num(invoice.taxTotal),
      discountTotal: num(invoice.discountTotal),
      grandTotal: num(invoice.total),
    },
    branding: {
      wordmark: 'InvoicePro',
      tagline: 'Professional Invoicing',
    },
  };
}

export function formatCurrency(amount: number, symbol: string): string {
  if (!Number.isFinite(amount)) return '';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
