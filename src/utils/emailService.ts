import { Invoice, Business, Client } from '@/store/useStore';
import { toast } from 'sonner';

interface EmailParams {
  invoice: Invoice;
  business: Business;
  client: Client;
  currencySymbol: string;
}

function formatCurrency(amount: number, symbol: string) {
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function buildEmailBody({ invoice, business, client, currencySymbol }: EmailParams): string {
  const itemsList = invoice.items
    .map(item => `  • ${item.description} — ${formatCurrency(item.quantity * item.price, currencySymbol)}`)
    .join('\n');

  return [
    `Dear ${client.name},`,
    '',
    `Please find below the details for invoice ${invoice.invoiceNumber}:`,
    '',
    `Invoice Number: ${invoice.invoiceNumber}`,
    `Date: ${new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    `Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    '',
    'Items:',
    itemsList,
    '',
    `Subtotal: ${formatCurrency(invoice.subtotal, currencySymbol)}`,
    `Tax: ${formatCurrency(invoice.taxTotal, currencySymbol)}`,
    invoice.discountTotal > 0 ? `Discount: -${formatCurrency(invoice.discountTotal, currencySymbol)}` : '',
    `Total: ${formatCurrency(invoice.total, currencySymbol)}`,
    '',
    invoice.notes ? `Notes: ${invoice.notes}` : '',
    '',
    'Thank you for your business!',
    '',
    `${business.name}`,
    business.email,
    business.phone,
  ].filter(Boolean).join('\n');
}

export function sendInvoiceEmail(params: EmailParams): void {
  const subject = `Invoice ${params.invoice.invoiceNumber} from ${params.business.name}`;
  const body = buildEmailBody(params);

  const mailtoUrl = `mailto:${encodeURIComponent(params.client.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.open(mailtoUrl, '_blank');
  toast.success(`Email draft opened for ${params.client.name}`);
}

export function simulateEmailSent(params: EmailParams): void {
  toast.success(
    `Invoice ${params.invoice.invoiceNumber} sent to ${params.client.email}`,
    { description: `Amount: ${formatCurrency(params.invoice.total, params.currencySymbol)}` }
  );
}
