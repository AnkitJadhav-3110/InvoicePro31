export interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  logo?: string;
  signature?: string;
  accentColor: string;
  font: 'inter' | 'roboto' | 'poppins';
  footerText: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  taxRate: number;
  discount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  businessId: string;
  clientId: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  template: InvoiceTemplate;
  createdAt: string;
  dueDate: string;
  notes: string;
  paymentQR?: string;
  isPaid: boolean;
}

export type InvoiceTemplate = 'minimal' | 'modern' | 'corporate' | 'dark' | 'clean';

export interface CustomTemplate {
  id: string;
  name: string;
  backgroundImage: string;
  fieldMappings: FieldMapping[];
  createdAt: string;
}

export interface FieldMapping {
  fieldId: string;
  fieldType: 'businessName' | 'clientName' | 'invoiceNumber' | 'date' | 'dueDate' | 'items' | 'subtotal' | 'tax' | 'total' | 'notes' | 'logo';
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: string;
  color: string;
}

export interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  outstandingPayments: number;
  paidInvoices: number;
  unpaidInvoices: number;
  totalInvoices: number;
  topClients: { client: Client; revenue: number }[];
  monthlyData: { month: string; revenue: number; count: number }[];
}

export interface AppSettings {
  theme: 'light' | 'dark';
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  invoiceSuffix: string;
  defaultTaxRate: number;
  defaultPaymentTerms: 'net7' | 'net15' | 'net30' | 'net60';
}
