import { Business, Client, InvoiceItem, InvoiceTemplate, AppSettings } from '@/store/useStore';
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
      case 'teal':
        return {
          container: 'bg-white shadow-xl',
          header: 'text-gray-900',
          body: 'bg-white',
          accent: 'text-teal-600',
          accentBg: 'bg-gray-50',
        };
      default:
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

  // Special teal corporate template
  if (invoice.template === 'teal') {
    return (
      <div className="invoice-template w-full min-h-[800px] relative bg-white shadow-xl">
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-3" style={{ backgroundColor: '#5ba4a4' }} />

        {invoice.isPaid && (
          <div className="absolute top-20 right-8 transform rotate-12 z-10">
            <div className="border-4 border-green-500 text-green-500 px-6 py-2 rounded-lg text-2xl font-bold opacity-80">
              PAID
            </div>
          </div>
        )}

        <div className="pl-8 pr-8 pt-8 pb-4">
          {/* Header: INVOICE title left, Logo + dates right */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-4xl font-bold italic" style={{ color: '#5ba4a4' }}>INVOICE</h1>
              <p className="text-lg font-bold text-gray-800 mt-1">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              {business?.logo ? (
                <img src={business.logo} alt="Logo" className="h-14 ml-auto mb-3 object-contain" />
              ) : (
                <div className="text-right mb-3">
                  <p className="text-lg font-bold text-gray-800">{business?.name || 'Your Company'}</p>
                </div>
              )}
              <div className="space-y-1">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-700">DATE</p>
                  <p className="text-sm text-gray-600 italic">{formatDate(invoice.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-700">DUE DATE</p>
                  <p className="text-sm text-gray-600 italic">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* To / From */}
          <div className="grid grid-cols-2 gap-8 mt-6 mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-2">To</h3>
              <div className="text-sm space-y-0.5 text-gray-700">
                <p className="font-semibold">{client?.name || 'Client Name'}</p>
                {client?.address && <p>{client.address}</p>}
                {client?.city && <p>{client.city}</p>}
                {client?.country && <p>{client.country}</p>}
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-2">From</h3>
              <div className="text-sm space-y-0.5 text-gray-700">
                <p className="font-semibold">{business?.name || 'Your Company'}</p>
                {business?.address && <p>{business.address}</p>}
                {business?.city && <p>{business.city}</p>}
                {business?.country && <p>{business.country}</p>}
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-300 mb-4" />

          {/* Items table */}
          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 text-xs font-bold uppercase tracking-widest text-gray-700 pl-4">Description</th>
                  <th className="text-center py-3 text-xs font-bold uppercase tracking-widest text-gray-700">Quantity</th>
                  <th className="text-right py-3 text-xs font-bold uppercase tracking-widest text-gray-700">Rate</th>
                  <th className="text-right py-3 text-xs font-bold uppercase tracking-widest text-gray-700 pr-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                  const lineTotal = item.quantity * item.price;
                  const lineDiscount = lineTotal * (item.discount / 100);
                  const amount = lineTotal - lineDiscount;
                  return (
                    <tr key={item.id || index} className="border-b border-gray-200">
                      <td className="py-4 pl-4 text-sm text-gray-800">{item.description || 'Item description'}</td>
                      <td className="py-4 text-sm text-center text-gray-700">{item.quantity}</td>
                      <td className="py-4 text-sm text-right text-gray-700">{formatCurrency(item.price)}</td>
                      <td className="py-4 text-sm text-right font-medium text-gray-900 pr-4">{formatCurrency(amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals + Thank you */}
          <div className="flex justify-between items-end mb-6">
            <div className="flex-1">
              <p className="text-xl italic font-semibold" style={{ color: '#5ba4a4' }}>
                Thanks for<br />your business!
              </p>
            </div>
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-sm border-b border-gray-200 py-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-gray-200 py-2">
                <span className="text-gray-600">Balance</span>
                <span className="font-medium">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-gray-200 py-2">
                <span className="text-gray-600">Paid to date</span>
                <span className="font-medium">{formatCurrency(invoice.isPaid ? invoice.total : 0)}</span>
              </div>
              <div className="flex justify-between text-sm border-b-2 border-gray-400 py-2">
                <span className="font-bold text-gray-900">TOTAL</span>
                <span className="font-bold text-gray-900">{formatCurrency(invoice.isPaid ? 0 : invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          {qrCode && (
            <div className="flex justify-end mb-4">
              <div className="text-center">
                <img src={qrCode} alt="Payment QR" className="w-24 h-24" />
                <p className="text-xs text-gray-500 mt-1">Scan to Pay</p>
              </div>
            </div>
          )}

          {/* Signature */}
          {business?.signature && (
            <div className="mt-4 text-right">
              <img src={business.signature} alt="Signature" className="h-12 ml-auto" />
              <p className="text-sm text-gray-500">Authorized Signature</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm font-bold text-gray-800">
              {business?.email ? `www.${business.email.split('@')[1] || 'yourcompany.com'}` : 'www.yourcompany.com'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default templates (minimal, modern, corporate, dark, clean)
  return (
    <div className={cn("invoice-template w-full min-h-[800px] relative", styles.container)}>
      {invoice.isPaid && (
        <div className="absolute top-20 right-8 transform rotate-12 z-10">
          <div className="border-4 border-green-500 text-green-500 px-6 py-2 rounded-lg text-2xl font-bold opacity-80">
            PAID
          </div>
        </div>
      )}

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

      <div className={cn("p-8", styles.body)}>
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

        {business?.footerText && (
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">{business.footerText}</p>
          </div>
        )}

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
