import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDataSync } from '@/hooks/useDataSync';
import {
  Search,
  Filter,
  Download,
  Copy,
  Trash2,
  MoreHorizontal,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Plus,
  Mail,
  Send,
  Pencil,
} from 'lucide-react';
import { useStore, Invoice } from '@/store/useStore';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { downloadInvoicePDF } from '@/utils/pdfGenerator';
import { exportInvoicesToCSV } from '@/utils/csvExport';
import { sendInvoiceWithPDF } from '@/utils/emailService';
import { InvoiceTimeline } from '@/components/invoice/InvoiceTimeline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function InvoiceHistory() {
  const navigate = useNavigate();
  const { invoices, clients, businesses, settings } = useStore();
  const { duplicateInvoice, deleteInvoice, updateInvoice } = useDataSync();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timelineInvoice, setTimelineInvoice] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice => {
        const client = clients.find(c => c.id === invoice.clientId);
        const matchesSearch =
          invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          client?.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        const matchesClient = clientFilter === 'all' || invoice.clientId === clientFilter;
        const invoiceDate = new Date(invoice.createdAt);
        const matchesDateFrom = !dateFrom || invoiceDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || invoiceDate <= new Date(dateTo + 'T23:59:59');
        return matchesSearch && matchesStatus && matchesClient && matchesDateFrom && matchesDateTo;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, clients, search, statusFilter, clientFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  // Reset to page 1 when filters change  
  const filterKey = `${search}|${statusFilter}|${clientFilter}|${dateFrom}|${dateTo}`;
  useMemo(() => { setCurrentPage(1); }, [filterKey]);

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle; label: string }> = {
      paid: { variant: 'default', icon: CheckCircle, label: 'Paid' },
      sent: { variant: 'secondary', icon: Clock, label: 'Sent' },
      draft: { variant: 'outline', icon: FileText, label: 'Draft' },
      overdue: { variant: 'destructive', icon: AlertCircle, label: 'Overdue' },
    };
    return configs[status] || configs.draft;
  };

  const handleEdit = (id: string) => {
    navigate(`/invoices/create?edit=${id}`);
  };

  const handleDuplicate = async (id: string) => {
    const newId = await duplicateInvoice(id);
    if (newId) {
      toast.success('Invoice duplicated');
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteInvoice(deleteId);
      toast.success('Invoice deleted');
      setDeleteId(null);
    }
  };

  const handleDownload = async (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const client = clients.find(c => c.id === invoice.clientId);
    const business = businesses.find(b => b.id === invoice.businessId);

    if (!client || !business) {
      toast.error('Missing invoice data');
      return;
    }

    try {
      await downloadInvoicePDF(invoice, client, business, settings);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleMarkPaid = async (id: string) => {
    await updateInvoice(id, { status: 'paid', isPaid: true });
    toast.success('Invoice marked as paid');
  };

  const handleMarkSent = async (id: string) => {
    await updateInvoice(id, { status: 'sent' });
    toast.success('Invoice marked as sent');
  };

  const handleSendEmail = async (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    const client = clients.find(c => c.id === invoice.clientId);
    const business = businesses.find(b => b.id === invoice.businessId);
    if (!client || !business) {
      toast.error('Missing invoice data');
      return;
    }
    await sendInvoiceWithPDF({
      invoice,
      business,
      client,
      currencySymbol: settings.currencySymbol,
      settings,
    });
    if (invoice.status === 'draft') {
      updateInvoice(invoiceId, { status: 'sent' });
    }
  };

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.error('No invoices to export');
      return;
    }
    exportInvoicesToCSV(filteredInvoices, clients, settings);
    toast.success('Invoices exported to CSV');
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Invoice History"
        description="View and manage all your invoices"
        action={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button asChild className="gap-2">
              <Link to="/invoices/create">
                <Plus className="w-4 h-4" />
                Create Invoice
              </Link>
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From Date</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To Date</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-muted-foreground"
            >
              Clear dates
            </Button>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description={
            invoices.length === 0
              ? "Create your first invoice to get started"
              : "No invoices match your search criteria"
          }
          action={
            invoices.length === 0
              ? {
                  label: 'Create Invoice',
                  onClick: () => navigate('/invoices/create'),
                }
              : undefined
          }
        />
      ) : (
        <div className="border rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Invoice</TableHead>
                  <TableHead className="hidden sm:table-cell">Client</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map(invoice => {
                  const client = clients.find(c => c.id === invoice.clientId);
                  const statusConfig = getStatusConfig(invoice.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={invoice.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setTimelineInvoice(invoice)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground capitalize sm:hidden truncate">
                              {client?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <p className="font-medium truncate">{client?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">{client?.email}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatDate(invoice.createdAt)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">{statusConfig.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(invoice.id); }}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(invoice.id); }}>
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(invoice.id); }}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSendEmail(invoice.id); }}>
                              <Mail className="w-4 h-4 mr-2" />
                              Send via Email
                            </DropdownMenuItem>
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkSent(invoice.id); }}>
                                <Send className="w-4 h-4 mr-2" />
                                Mark as Sent
                              </DropdownMenuItem>
                            )}
                            {invoice.status !== 'paid' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkPaid(invoice.id); }}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); setDeleteId(invoice.id); }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Timeline Dialog */}
      <Dialog open={!!timelineInvoice} onOpenChange={() => setTimelineInvoice(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invoice Timeline</DialogTitle>
            <DialogDescription>
              {timelineInvoice?.invoiceNumber} — Status history
            </DialogDescription>
          </DialogHeader>
          {timelineInvoice && (
            <InvoiceTimeline
              statusHistory={timelineInvoice.statusHistory}
              createdAt={timelineInvoice.createdAt}
              className="pt-2"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
