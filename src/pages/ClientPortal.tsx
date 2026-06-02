import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { fetchPortalInvoice, markPortalInvoicePaid, type PortalLinkRow } from '@/utils/clientPortal';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { downloadInvoicePDF } from '@/utils/pdfGenerator';
import { BrandWordmark } from '@/components/BrandWordmark';

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<PortalLinkRow | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) {
        setError('Missing link token');
        setLoading(false);
        return;
      }
      try {
        const data = await fetchPortalInvoice(token);
        if (!alive) return;
        if (!data) setError('Invoice not found.');
        else setRow(data);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Unable to load invoice.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const handlePay = async () => {
    if (!token || !row) return;
    setPaying(true);
    try {
      await markPortalInvoicePaid(token);
      setRow({ ...row, paid: true, paid_at: new Date().toISOString() });
      toast.success('Payment recorded. Thank you!');
    } catch (e: any) {
      toast.error(e?.message || 'Could not record payment.');
    } finally {
      setPaying(false);
    }
  };

  const handleDownload = async () => {
    if (!row) return;
    try {
      await downloadInvoicePDF(
        row.invoice_snapshot,
        row.client_snapshot,
        row.business_snapshot,
        row.settings_snapshot,
      );
    } catch {
      toast.error('Could not generate PDF.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Invoice | Client Portal</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {loading && (
            <Card className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading invoice…</p>
            </Card>
          )}

          {!loading && error && (
            <Card className="p-12 flex flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <h1 className="text-xl font-semibold">Link unavailable</h1>
              <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            </Card>
          )}

          {!loading && row && (
            <>
              <Card className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    Invoice {row.invoice_snapshot.invoiceNumber}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    From {row.business_snapshot.name} · Link expires{' '}
                    {new Date(row.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {row.paid ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Due</Badge>
                  )}
                  <Button variant="outline" onClick={handleDownload} className="gap-2">
                    <Download className="w-4 h-4" /> Download PDF
                  </Button>
                  {!row.paid && (
                    <Button onClick={handlePay} disabled={paying} className="gap-2">
                      {paying && <Loader2 className="w-4 h-4 animate-spin" />}
                      Pay {row.settings_snapshot.currencySymbol}
                      {row.invoice_snapshot.total.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </Button>
                  )}
                </div>
              </Card>

              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <InvoicePreview
                  invoice={{
                    invoiceNumber: row.invoice_snapshot.invoiceNumber,
                    businessId: row.invoice_snapshot.businessId,
                    clientId: row.invoice_snapshot.clientId,
                    items: row.invoice_snapshot.items,
                    subtotal: row.invoice_snapshot.subtotal,
                    taxTotal: row.invoice_snapshot.taxTotal,
                    discountTotal: row.invoice_snapshot.discountTotal,
                    total: row.invoice_snapshot.total,
                    template: row.invoice_snapshot.template,
                    createdAt: row.invoice_snapshot.createdAt,
                    dueDate: row.invoice_snapshot.dueDate,
                    notes: row.invoice_snapshot.notes,
                    paymentQR: row.invoice_snapshot.paymentQR,
                    isPaid: row.paid || row.invoice_snapshot.isPaid,
                  }}
                  business={row.business_snapshot}
                  client={row.client_snapshot}
                  settings={row.settings_snapshot}
                />
              </div>

              <div className="flex flex-col items-center gap-2 pt-2">
                <BrandWordmark size="sm" />
                <p className="text-xs text-muted-foreground">
                  Secured by InvoicePro · This link is private and unique to you.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
