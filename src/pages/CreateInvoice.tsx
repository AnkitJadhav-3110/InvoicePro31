import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Trash2,
  Download,
  Eye,
  Save,
  RefreshCw,
  Paperclip,
  X,
  FileIcon,
  Upload,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useDataSync } from '@/hooks/useDataSync';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { supabase } from '@/integrations/supabase/client';
import type { InvoiceItem, InvoiceTemplate, InvoiceAttachment } from '@/store/useStore';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { downloadInvoicePDF } from '@/utils/pdfGenerator';
import { invoiceSchema, getFirstError } from '@/utils/validation';
import { RecurringInvoiceDialog } from '@/components/recurring/RecurringInvoiceDialog';

const templates: { id: InvoiceTemplate; name: string; description: string }[] = [
  { id: 'minimal', name: 'Minimal White', description: 'Clean and simple' },
  { id: 'modern', name: 'Modern Gradient', description: 'Bold and contemporary' },
  { id: 'corporate', name: 'Corporate Blue', description: 'Professional and trustworthy' },
  { id: 'dark', name: 'Bold Dark', description: 'Striking dark theme' },
  { id: 'clean', name: 'Clean Business', description: 'Elegant and refined' },
  { id: 'teal', name: 'Corporate Teal', description: 'Modern with accent bar' },
  { id: 'bw', name: 'Minimalist B&W', description: 'Black and white elegance' },
  { id: 'creative', name: 'Creative Colorful', description: 'Vibrant coral and orange' },
  { id: 'luxury', name: 'Dark Luxury', description: 'Navy & gold premium' },
];

const paymentTerms = [
  { value: 'net7', label: 'Net 7 (7 days)', days: 7 },
  { value: 'net15', label: 'Net 15 (15 days)', days: 15 },
  { value: 'net30', label: 'Net 30 (30 days)', days: 30 },
  { value: 'net60', label: 'Net 60 (60 days)', days: 60 },
];

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const {
    businesses,
    clients,
    invoices,
    settings,
    currentBusinessId,
    getNextInvoiceNumber,
  } = useStore();
  const { addInvoice, updateInvoice } = useDataSync();

  const editingInvoice = editId ? invoices.find(i => i.id === editId) : null;

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTerm, setPaymentTerm] = useState<string>(settings.defaultPaymentTerms);
  const [dueDate, setDueDate] = useState('');
  const [template, setTemplate] = useState<InvoiceTemplate>('minimal');
  const [notes, setNotes] = useState('');
  const [paymentQR, setPaymentQR] = useState('');
  const [showPaidStamp, setShowPaidStamp] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: uuidv4(), description: '', quantity: 1, price: 0, taxRate: settings.defaultTaxRate, discount: 0 },
  ]);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [invoiceCurrency, setInvoiceCurrency] = useState(settings.currencySymbol);
  const [attachments, setAttachments] = useState<InvoiceAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { ensureAuth, ensureOwnsInvoice } = useAuthGuard();

  // Load editing invoice data
  useEffect(() => {
    if (editingInvoice) {
      setInvoiceNumber(editingInvoice.invoiceNumber);
      setSelectedClientId(editingInvoice.clientId);
      setInvoiceDate(new Date(editingInvoice.createdAt).toISOString().split('T')[0]);
      setDueDate(new Date(editingInvoice.dueDate).toISOString().split('T')[0]);
      setTemplate(editingInvoice.template);
      setNotes(editingInvoice.notes);
      setPaymentQR(editingInvoice.paymentQR || '');
      setShowPaidStamp(editingInvoice.isPaid);
      setItems(editingInvoice.items.map(item => ({ ...item })));
    }
  }, [editingInvoice]);

  const currentBusiness = businesses.find(b => b.id === currentBusinessId);
  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Auto-set currency when client changes
  useEffect(() => {
    if (selectedClient) {
      setInvoiceCurrency(selectedClient.currencySymbol || settings.currencySymbol);
    }
  }, [selectedClient, settings.currencySymbol]);

  // Load attachments when editing
  useEffect(() => {
    if (editId && user) {
      supabase
        .from('invoice_attachments')
        .select('*')
        .eq('invoice_id', editId)
        .then(({ data }) => {
          if (data) {
            setAttachments(data.map(a => ({
              id: a.id,
              invoiceId: a.invoice_id,
              fileName: a.file_name,
              fileUrl: a.file_url,
              fileSize: Number(a.file_size),
              fileType: a.file_type,
              createdAt: a.created_at,
            })));
          }
        });
    }
  }, [editId, user]);

  useEffect(() => {
    if (!editId) {
      setInvoiceNumber(getNextInvoiceNumber());
    }
  }, [getNextInvoiceNumber, editId]);

  useEffect(() => {
    if (editId) return; // Don't auto-calculate due date when editing
    const term = paymentTerms.find(t => t.value === paymentTerm);
    if (term && invoiceDate) {
      const date = new Date(invoiceDate);
      date.setDate(date.getDate() + term.days);
      setDueDate(date.toISOString().split('T')[0]);
    }
  }, [paymentTerm, invoiceDate, editId]);

  const calculations = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    items.forEach(item => {
      const lineTotal = item.quantity * item.price;
      const lineDiscount = lineTotal * (item.discount / 100);
      const lineTax = (lineTotal - lineDiscount) * (item.taxRate / 100);

      subtotal += lineTotal;
      discountTotal += lineDiscount;
      taxTotal += lineTax;
    });

    const total = subtotal - discountTotal + taxTotal;
    return { subtotal, taxTotal, discountTotal, total };
  }, [items]);

  const formatCurrency = (amount: number) => {
    return `${invoiceCurrency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const files = Array.from(e.target.files);
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = files.filter(f => f.size > maxSize);
    if (invalidFiles.length > 0) {
      toast.error('Files must be under 10MB');
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('invoice-attachments')
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('invoice-attachments')
          .getPublicUrl(filePath);

        const attachment: InvoiceAttachment = {
          id: uuidv4(),
          invoiceId: editId || '',
          fileName: file.name,
          fileUrl: filePath,
          fileSize: file.size,
          fileType: file.type,
          createdAt: new Date().toISOString(),
        };

        setAttachments(prev => [...prev, attachment]);
      }
      toast.success('Files uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [user, editId]);

  const handleRemoveAttachment = useCallback(async (attachment: InvoiceAttachment) => {
    // Remove from storage
    await supabase.storage
      .from('invoice-attachments')
      .remove([attachment.fileUrl]);

    // Remove from DB if exists
    if (attachment.id) {
      await supabase.from('invoice_attachments').delete().eq('id', attachment.id);
    }

    setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    toast.success('Attachment removed');
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: uuidv4(), description: '', quantity: 1, price: 0, taxRate: settings.defaultTaxRate, discount: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) {
      toast.error('Invoice must have at least one item');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = async (status: 'draft' | 'sent' = 'draft') => {
    if (!ensureAuth()) return;
    if (editId && !(await ensureOwnsInvoice(editId))) return;
    if (!currentBusinessId) {
      toast.error('Please select a business profile');
      return;
    }

    const result = invoiceSchema.safeParse({
      invoiceNumber,
      clientId: selectedClientId,
      invoiceDate,
      dueDate,
      notes,
      paymentQR,
      items,
    });

    if (!result.success) {
      toast.error(getFirstError(result.error));
      return;
    }

    const invoiceData = {
      invoiceNumber,
      businessId: currentBusinessId,
      clientId: selectedClientId,
      items,
      subtotal: calculations.subtotal,
      taxTotal: calculations.taxTotal,
      discountTotal: calculations.discountTotal,
      total: calculations.total,
      status,
      template,
      createdAt: new Date(invoiceDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes,
      paymentQR,
      isPaid: showPaidStamp,
    };

    let invoiceId = editId;
    if (editId && editingInvoice) {
      await updateInvoice(editId, invoiceData);
      toast.success('Invoice updated successfully');
    } else {
      const newId = await addInvoice(invoiceData);
      invoiceId = typeof newId === 'string' ? newId : null;
      toast.success(`Invoice ${status === 'draft' ? 'saved as draft' : 'created'}`);
    }

    // Save attachments to DB
    if (invoiceId && user && attachments.length > 0) {
      for (const att of attachments) {
        if (!att.invoiceId || att.invoiceId === '') {
          await supabase.from('invoice_attachments').insert({
            invoice_id: invoiceId,
            user_id: user.id,
            file_name: att.fileName,
            file_url: att.fileUrl,
            file_size: att.fileSize,
            file_type: att.fileType,
          } as any);
        }
      }
    }

    navigate('/invoices/history');
  };

  const handleDownload = async () => {
    if (!ensureAuth()) return;
    if (!currentBusiness || !selectedClient) {
      toast.error('Please select business and client');
      return;
    }

    const invoice = {
      id: editId || '',
      invoiceNumber,
      businessId: currentBusinessId!,
      clientId: selectedClientId,
      items,
      subtotal: calculations.subtotal,
      taxTotal: calculations.taxTotal,
      discountTotal: calculations.discountTotal,
      total: calculations.total,
      status: 'draft' as const,
      template,
      createdAt: new Date(invoiceDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes,
      paymentQR,
      isPaid: showPaidStamp,
    };

    try {
      await downloadInvoicePDF(invoice, selectedClient, currentBusiness, settings);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={editId ? 'Edit Invoice' : 'Create Invoice'}
        description={editId ? `Editing ${invoiceNumber}` : 'Fill in the details to generate your invoice'}
        action={
          <div className="flex flex-wrap gap-2">
            {!editId && (
              <Button variant="outline" onClick={() => setShowRecurringDialog(true)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Make Recurring
              </Button>
            )}
            <Button variant="outline" onClick={() => handleSave('draft')}>
              <Save className="w-4 h-4 mr-2" />
              {editId ? 'Update Invoice' : 'Save Draft'}
            </Button>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        }
      />

      <RecurringInvoiceDialog
        open={showRecurringDialog}
        onOpenChange={setShowRecurringDialog}
        clientId={selectedClientId}
        invoiceData={{
          items,
          notes,
          template,
        }}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    disabled={!!editId}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select value={paymentTerm} onValueChange={setPaymentTerm}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTerms.map(term => (
                        <SelectItem key={term.value} value={term.value}>
                          {term.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tax %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.taxRate}
                        onChange={(e) => updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Discount %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(calculations.subtotal)}</span>
                </div>
                {calculations.discountTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-destructive">-{formatCurrency(calculations.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(calculations.taxTotal)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(calculations.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Additional Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes for the client..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment QR Code URL (Optional)</Label>
                <Input
                  placeholder="https://pay.example.com/..."
                  value={paymentQR}
                  onChange={(e) => setPaymentQR(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a UPI, Stripe, or PayPal payment URL to generate a QR code on the invoice
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show "PAID" Stamp</Label>
                  <p className="text-xs text-muted-foreground">Display a paid stamp on the invoice</p>
                </div>
                <Switch
                  checked={showPaidStamp}
                  onCheckedChange={setShowPaidStamp}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Attachments */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Attachments
              </CardTitle>
              <label>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Files'}
                  </span>
                </Button>
              </label>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No attachments yet. Upload contracts, receipts, or other documents.
                </p>
              ) : (
                <div className="space-y-2">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{att.fileName}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(att.fileSize)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => handleRemoveAttachment(att)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      template === t.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:sticky xl:top-24 h-fit">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[800px] rounded-lg border bg-muted/30 p-8">
                <div className="bg-white rounded-lg shadow-lg p-6 min-h-[600px] relative">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                      {currentBusiness?.logo && (
                        <img src={currentBusiness.logo} alt="Logo" className="w-12 h-12 object-contain rounded" />
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{currentBusiness?.name || 'Your Company'}</h2>
                        <p className="text-sm text-gray-600">{currentBusiness?.email}</p>
                        <p className="text-sm text-gray-600">{currentBusiness?.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h1 className="text-2xl font-bold text-primary">INVOICE</h1>
                      <p className="text-lg font-semibold">{invoiceNumber}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">Bill To</h3>
                      <p className="font-semibold">{selectedClient?.name || 'Select a client'}</p>
                      <p className="text-sm text-gray-600">{selectedClient?.email}</p>
                      <p className="text-sm text-gray-600">{selectedClient?.address}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">Details</h3>
                      <p className="text-sm"><span className="text-gray-500">Date:</span> {invoiceDate}</p>
                      <p className="text-sm"><span className="text-gray-500">Due:</span> {dueDate}</p>
                    </div>
                  </div>

                  <table className="w-full mb-8">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-2 text-sm font-semibold text-gray-600">Description</th>
                        <th className="text-center py-2 text-sm font-semibold text-gray-600">Qty</th>
                        <th className="text-right py-2 text-sm font-semibold text-gray-600">Price</th>
                        <th className="text-right py-2 text-sm font-semibold text-gray-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 text-sm">{item.description || 'Item description'}</td>
                          <td className="py-3 text-sm text-center">{item.quantity}</td>
                          <td className="py-3 text-sm text-right">{formatCurrency(item.price)}</td>
                          <td className="py-3 text-sm text-right font-medium">
                            {formatCurrency(item.quantity * item.price * (1 - item.discount / 100))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatCurrency(calculations.subtotal)}</span>
                      </div>
                      {calculations.discountTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Discount</span>
                          <span className="text-red-500">-{formatCurrency(calculations.discountTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span>{formatCurrency(calculations.taxTotal)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t text-lg font-bold text-primary">
                        <span>Total</span>
                        <span>{formatCurrency(calculations.total)}</span>
                      </div>
                    </div>
                  </div>

                  {showPaidStamp && (
                    <div className="absolute top-20 right-20 transform rotate-12">
                      <div className="border-4 border-green-500 text-green-500 px-6 py-2 rounded-lg text-2xl font-bold opacity-80">
                        PAID
                      </div>
                    </div>
                  )}

                  {currentBusiness?.signature && (
                    <div className="mt-8 flex justify-end">
                      <div className="text-center">
                        <img src={currentBusiness.signature} alt="Signature" className="h-10 object-contain" />
                        <p className="text-xs text-gray-500 mt-1">Authorized Signature</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
