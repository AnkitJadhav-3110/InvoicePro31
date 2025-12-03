import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Copy,
  Trash2,
  MoreHorizontal,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
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
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/utils/pdfGenerator';

export default function InvoiceHistory() {
  const navigate = useNavigate();
  const { invoices, clients, businesses, settings, duplicateInvoice, deleteInvoice, updateInvoice } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice => {
        const client = clients.find(c => c.id === invoice.clientId);
        const matchesSearch =
          invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          client?.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        const matchesClient = clientFilter === 'all' || invoice.clientId === clientFilter;
        return matchesSearch && matchesStatus && matchesClient;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, clients, search, statusFilter, clientFilter]);

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

  const handleDuplicate = (id: string) => {
    const newId = duplicateInvoice(id);
    if (newId) {
      toast.success('Invoice duplicated');
    }
  };

  const handleDelete = (id: string) => {
    deleteInvoice(id);
    toast.success('Invoice deleted');
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
      await generateInvoicePDF(invoice, client, business, settings);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleMarkPaid = (id: string) => {
    updateInvoice(id, { status: 'paid', isPaid: true });
    toast.success('Invoice marked as paid');
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Invoice History"
        description="View and manage all your invoices"
        action={
          <Button onClick={() => navigate('/invoices/create')}>
            Create Invoice
          </Button>
        }
      />

      {/* Filters */}
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
          <SelectTrigger className="w-[150px]">
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
          <SelectTrigger className="w-[180px]">
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
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
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
                  <TableRow key={invoice.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground capitalize">{invoice.template}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{client?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{client?.email}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invoice.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} className="gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(invoice.id)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(invoice.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {invoice.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => handleMarkPaid(invoice.id)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(invoice.id)}
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
      )}
    </div>
  );
}
