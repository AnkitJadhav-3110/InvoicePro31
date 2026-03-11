import { useState, useCallback } from 'react';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Phone, MapPin, FileText, FileDown, Globe, ExternalLink } from 'lucide-react';
import { useStore, Client } from '@/store/useStore';
import { useDataSync } from '@/hooks/useDataSync';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { exportClientsToCSV } from '@/utils/csvExport';
import { clientSchema, getErrorsObject } from '@/utils/validation';
import { FormInput, FormTextarea } from '@/components/ui/form-field';
import { z } from 'zod';
import { ClientInvoiceHistory } from '@/components/clients/ClientInvoiceHistory';

type FormErrors = Partial<Record<keyof z.infer<typeof clientSchema>, string>>;

export default function Clients() {
  const { clients, invoices, settings } = useStore();
  const { addClient, updateClient, deleteClient } = useDataSync();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    taxId: '',
    notes: '',
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase())
  );

  const getClientInvoiceCount = (clientId: string) => {
    return invoices.filter(i => i.clientId === clientId).length;
  };

  const getClientRevenue = (clientId: string) => {
    return invoices
      .filter(i => i.clientId === clientId && i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0);
  };

  const validateField = useCallback((field: keyof typeof formData, value: string) => {
    const testData = { ...formData, [field]: value };
    const result = clientSchema.safeParse(testData);
    
    if (!result.success) {
      const fieldError = result.error.errors.find(e => e.path[0] === field);
      setErrors(prev => ({
        ...prev,
        [field]: fieldError?.message,
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formData]);

  const handleFieldChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  }, [validateField]);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  ];

  const handleCurrencyChange = (code: string) => {
    const currency = currencies.find(c => c.code === code);
    if (currency) {
      setFormData(prev => ({ ...prev, currency: currency.code, currencySymbol: currency.symbol }));
    }
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        country: client.country,
        taxId: client.taxId || '',
        notes: client.notes || '',
        currency: client.currency || settings.currency,
        currencySymbol: client.currencySymbol || settings.currencySymbol,
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        taxId: '',
        notes: '',
        currency: settings.currency,
        currencySymbol: settings.currencySymbol,
      });
    }
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const result = clientSchema.safeParse(formData);
    
    if (!result.success) {
      setErrors(getErrorsObject(result.error) as FormErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    if (editingClient) {
      await updateClient(editingClient.id, formData);
      toast.success('Client updated successfully');
    } else {
      await addClient(formData);
      toast.success('Client added successfully');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const hasInvoices = invoices.some(i => i.clientId === id);
    if (hasInvoices) {
      toast.error('Cannot delete client with existing invoices');
      return;
    }
    await deleteClient(id);
    toast.success('Client deleted');
  };

  const handleExportCSV = () => {
    if (clients.length === 0) {
      toast.error('No clients to export');
      return;
    }
    exportClientsToCSV(clients, invoices);
    toast.success('Clients exported to CSV');
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Clients"
        description="Manage your client database"
        action={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No clients yet"
          description="Add your first client to start creating invoices"
          action={{
            label: 'Add Client',
            onClick: () => handleOpenDialog(),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredClients.map(client => (
            <Card key={client.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-base sm:text-lg font-semibold text-primary">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(client)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(client.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 text-sm">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate">{client.city}</span>
                    </div>
                  )}
                  {client.currency && client.currency !== settings.currency && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="w-4 h-4 shrink-0" />
                      <span className="truncate">{client.currencySymbol} {client.currency}</span>
                    </div>
                  )}
                </div>

                <div
                  className="mt-4 pt-4 border-t border-border flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-b-lg -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 pb-4 sm:pb-6 transition-colors"
                  onClick={() => setHistoryClient(client)}
                  title="View invoice history"
                >
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-semibold text-foreground">{getClientInvoiceCount(client.id)}</p>
                    <p className="text-xs text-muted-foreground">Invoices</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-semibold text-foreground">
                      {(client.currencySymbol || settings.currencySymbol)}{getClientRevenue(client.id).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Name"
                required
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                onBlur={() => validateField('name', formData.name)}
                placeholder="Client name"
                error={errors.name}
              />
              <FormInput
                label="Email"
                required
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => validateField('email', formData.email)}
                placeholder="email@example.com"
                error={errors.email}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                error={errors.phone}
              />
              <FormInput
                label="Tax ID"
                value={formData.taxId}
                onChange={(e) => handleFieldChange('taxId', e.target.value)}
                placeholder="Tax identification"
                error={errors.taxId}
              />
            </div>
            <FormInput
              label="Address"
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="Street address"
              error={errors.address}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="City"
                value={formData.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                placeholder="City, State ZIP"
                error={errors.city}
              />
              <FormInput
                label="Country"
                value={formData.country}
                onChange={(e) => handleFieldChange('country', e.target.value)}
                placeholder="Country"
                error={errors.country}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency Symbol</Label>
                <Input
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, currencySymbol: e.target.value }))}
                />
              </div>
            </div>
            <FormTextarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              error={errors.notes}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              {editingClient ? 'Update' : 'Add'} Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
