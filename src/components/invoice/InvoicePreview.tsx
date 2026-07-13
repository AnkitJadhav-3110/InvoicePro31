/**
 * Live invoice preview. Thin wrapper over the shared `TemplateRenderer`
 * driven by the same `RenderModel` + `TemplateConfig` the PDF renderer uses,
 * so the on-screen preview can never drift from the downloaded PDF.
 */
import type { Business, Client, InvoiceItem, InvoiceTemplate, AppSettings } from '@/store/useStore';
import { buildRenderModel } from '@/rendering/buildRenderModel';
import { getTemplate } from '@/rendering/registry';
import { TemplateRenderer } from '@/rendering/preview/TemplateRenderer';

interface InvoiceData {
  invoiceNumber: string;
  businessId: string;
  clientId: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  template: InvoiceTemplate;
  createdAt: string;
  dueDate: string;
  notes: string;
  paymentQR?: string;
  isPaid: boolean;
}

interface InvoicePreviewProps {
  invoice: InvoiceData;
  business?: Business;
  client?: Client;
  settings: AppSettings;
}

/** Minimal placeholders so the preview renders even before a business/client
 *  is created — keeps the create-invoice UX unchanged. */
const PLACEHOLDER_BUSINESS: Business = {
  id: 'preview',
  name: 'Your Company',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  taxId: '',
  accentColor: '#3b82f6',
  font: 'inter',
  footerText: '',
};

const PLACEHOLDER_CLIENT: Client = {
  id: 'preview',
  name: 'Client Name',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  taxId: '',
  notes: '',
  currency: 'USD',
  currencySymbol: '$',
  createdAt: new Date().toISOString(),
};

export function InvoicePreview({ invoice, business, client, settings }: InvoicePreviewProps) {
  const config = getTemplate(invoice.template);
  const model = buildRenderModel(
    {
      ...invoice,
      status: invoice.isPaid ? 'paid' : 'draft',
    },
    client ?? PLACEHOLDER_CLIENT,
    business ?? PLACEHOLDER_BUSINESS,
    settings,
  );
  // Use the invoice's currency symbol from settings when the client is a placeholder.
  if (!client) model.client.currencySymbol = settings.currencySymbol;
  return <TemplateRenderer model={model} config={config} />;
}
