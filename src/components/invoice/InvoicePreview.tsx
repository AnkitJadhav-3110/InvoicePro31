import { Business, Client, InvoiceItem, InvoiceTemplate, AppSettings } from '@/types';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

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

export function InvoicePreview({ invoice, business, client, settings }: InvoicePreviewProps) {
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    if (invoice.paymentQR) {
      QRCode.toDataURL(invoice.paymentQR, { width: 100, margin: 1 })
        .then(setQrCode)
        .catch(console.error);
    } else {
      setQrCode('');
    }
  }, [invoice.paymentQR]);

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTemplateStyles = (template: InvoiceTemplate) => {
    switch (template) {
      case 'modern':
        return {
          container: 'bg-gradient-to-br from-indigo-600 to-purple-600',
          header: 'text-white',
          body: 'bg-white mt-6 rounded-t-3xl',
          accent: 'text-indigo-600',
          accentBg: 'bg-indigo-50',
        };
      case 'corporate':
        return {
          container: 'bg-white border-l-4 border-blue-600',
          header: 'text-gray-900',
          body: 'bg-white',
          accent: 'text-blue-600',
          accentBg: 'bg-blue-50',
        };
      case 'dark':
        return {
          container: 'bg-gray-900',
          header: 'text-white',
          body: 'bg-gray-900 text-white',
          accent: 'text-emerald-400',
          accentBg: 'bg-gray-800',
        };
      case 'clean':
        return {
          container: 'bg-white shadow-xl',
          header: 'text-gray-900',
          body: 'bg-white',
          accent: 'text-teal-600',
          accentBg: 'bg-teal-50',
        };
      default: // minimal
        return {
          container: 'bg-white border border-gray-200',
          header: 'text-gray-900',
          body: 'bg-white',
          accent: 'text-gray-900',
          accentBg: 'bg-gray-100',
        };
    }
  };

  const styles = getTemplateStyles(invoice.template);

  return (
    <div className={cn("invoice-template w-full min-h-[800px] relative", styles.container)}>
      {/* Paid Stamp */}
      {invoice.isPaid && (
        <div className="absolute top-20 right-8 transform rotate-12 z-10">
          <div className="border-4 border-green-500 text-green-500 px-6 py-2 rounded-lg text-2xl font-bold opacity-80">
            PAID
          </div>
        </div>
      )}

      {/* Header */}
      <div className={cn("p-8", styles.header)}>
        <div className="flex justify-between items-start">
          <div>
            {business?.logo ? (
              <img src={business.logo} alt="Logo" className="h-12 mb-4 object-contain" />
            ) : (
              <h1 className="text-2xl font-bold mb-2">{business?.name || 'Your Company'}</h1>
            )}
            {business?.logo && <h2 className="text-xl font-semibold">{business.name}</h2>}
          </div>
          <div className="text-right">
            <h2 className={cn("text-3xl font-bold mb-2", styles.accent)}>INVOICE</h2>
            <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={cn("p-8", styles.body)}>
        {/* Business & Client Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className={cn("text-sm font-semibold mb-2 uppercase tracking-wide", styles.accent)}>From</h3>
            <div className="text-sm space-y-1 text-gray-700">
              <p className="font-semibold text-gray-900">{business?.name || 'Your Company'}</p>
              <p>{business?.address}</p>
              <p>{business?.city}</p>
              <p>{business?.country}</p>
              <p>{business?.email}</p>
              <p>{business?.phone}</p>
              {business?.taxId && <p>Tax ID: {business.taxId}</p>}
            </div>
          </div>
          <div>
            <h3 className={cn("text-sm font-semibold mb-2 uppercase tracking-wide", styles.accent)}>Bill To</h3>
            <div className="text-sm space-y-1 text-gray-700">
              <p className="font-semibold text-gray-900">{client?.name || 'Client Name'}</p>
              <p>{client?.address}</p>
              <p>{client?.city}</p>
              <p>{client?.country}</p>
              <p>{client?.email}</p>
              <p>{client?.phone}</p>
              {client?.taxId && <p>Tax ID: {client.taxId}</p>}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className={cn("flex gap-8 mb-8 p-4 rounded-lg", styles.accentBg)}>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Invoice Date</p>
            <p className="font-semibold">{formatDate(invoice.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Due Date</p>
            <p className="font-semibold">{formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className={cn("border-b-2", invoice.template === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
                <th className="text-left py-3 text-sm font-semibold text-gray-600">Description</th>
                <th className="text-center py-3 text-sm font-semibold text-gray-600 w-20">Qty</th>
                <th className="text-right py-3 text-sm font-semibold text-gray-600 w-24">Price</th>
                <th className="text-right py-3 text-sm font-semibold text-gray-600 w-20">Tax</th>
                <th className="text-right py-3 text-sm font-semibold text-gray-600 w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => {
                const lineTotal = item.quantity * item.price;
                const lineDiscount = lineTotal * (item.discount / 100);
                const amount = lineTotal - lineDiscount;
                return (
                  <tr key={item.id || index} className={cn("border-b", invoice.template === 'dark' ? 'border-gray-700' : 'border-gray-100')}>
                    <td className="py-4">
                      <p className={cn("font-medium", invoice.template === 'dark' ? 'text-white' : 'text-gray-900')}>
                        {item.description || 'Item description'}
                      </p>
                      {item.discount > 0 && (
                        <p className="text-xs text-gray-500">{item.discount}% discount applied</p>
                      )}
                    </td>
                    <td className="text-center py-4 text-gray-600">{item.quantity}</td>
                    <td className="text-right py-4 text-gray-600">{formatCurrency(item.price)}</td>
                    <td className="text-right py-4 text-gray-600">{item.taxRate}%</td>
                    <td className={cn("text-right py-4 font-medium", invoice.template === 'dark' ? 'text-white' : 'text-gray-900')}>
                      {formatCurrency(amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className={invoice.template === 'dark' ? 'text-white' : ''}>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="text-red-500">-{formatCurrency(invoice.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className={invoice.template === 'dark' ? 'text-white' : ''}>{formatCurrency(invoice.taxTotal)}</span>
            </div>
            <div className={cn("flex justify-between pt-2 border-t text-lg font-bold", styles.accent)}>
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* QR Code & Notes */}
        <div className="flex justify-between items-end">
          <div className="flex-1">
            {invoice.notes && (
              <div className="max-w-md">
                <h4 className={cn("text-sm font-semibold mb-2", styles.accent)}>Notes</h4>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>
          {qrCode && (
            <div className="text-center">
              <img src={qrCode} alt="Payment QR" className="w-24 h-24" />
              <p className="text-xs text-gray-500 mt-1">Scan to Pay</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {business?.footerText && (
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">{business.footerText}</p>
          </div>
        )}

        {/* Signature */}
        {business?.signature && (
          <div className="mt-6 text-right">
            <img src={business.signature} alt="Signature" className="h-12 ml-auto" />
            <p className="text-sm text-gray-500">Authorized Signature</p>
          </div>
        )}
      </div>
    </div>
  );
}
