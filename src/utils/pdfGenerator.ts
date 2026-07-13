/**
 * Thin shim over the template rendering engine. Kept as the public API so
 * existing call sites (CreateInvoice, InvoiceHistory, emailService,
 * imageExport, ClientPortal, tests) don't need to change.
 *
 * Template-specific layout lives in `src/rendering/templates/*` — this file
 * has no per-template branching.
 */
import type { Invoice, Client, Business, AppSettings } from '@/store/useStore';
import { buildRenderModel } from '@/rendering/buildRenderModel';
import { getTemplate } from '@/rendering/registry';
import { renderPdf } from '@/rendering/pdf/renderPdf';

export async function generateInvoicePDF(
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings,
): Promise<Blob> {
  const model = buildRenderModel(invoice, client, business, settings);
  const config = getTemplate(invoice.template);
  return renderPdf(model, config);
}

export async function downloadInvoicePDF(
  invoice: Invoice | Omit<Invoice, 'id'>,
  client: Client,
  business: Business,
  settings: AppSettings,
): Promise<void> {
  const blob = await generateInvoicePDF(invoice, client, business, settings);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoice.invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
