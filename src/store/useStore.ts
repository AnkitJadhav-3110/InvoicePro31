import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Inline types to avoid cross-file dependency issues
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

export type InvoiceTemplate = 'minimal' | 'modern' | 'corporate' | 'dark' | 'clean';

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

export interface CustomTemplate {
  id: string;
  name: string;
  backgroundImage: string;
  fieldMappings: FieldMapping[];
  createdAt: string;
}

export interface RecurringSchedule {
  id: string;
  clientId: string;
  businessId: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextGenerationDate: string;
  isActive: boolean;
  autoSend: boolean;
  invoiceTemplate: {
    items: InvoiceItem[];
    notes: string;
    template: InvoiceTemplate;
  };
  createdAt: string;
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

interface AppState {
  businesses: Business[];
  clients: Client[];
  invoices: Invoice[];
  customTemplates: CustomTemplate[];
  recurringSchedules: RecurringSchedule[];
  settings: AppSettings;
  currentBusinessId: string | null;
  currentInvoice: Partial<Invoice> | null;

  addBusiness: (business: Omit<Business, 'id'>) => string;
  updateBusiness: (id: string, business: Partial<Business>) => void;
  deleteBusiness: (id: string) => void;
  setCurrentBusiness: (id: string | null) => void;

  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => string;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addInvoice: (invoice: Omit<Invoice, 'id'>) => string;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  duplicateInvoice: (id: string) => string;
  setCurrentInvoice: (invoice: Partial<Invoice> | null) => void;
  getNextInvoiceNumber: () => string;

  addCustomTemplate: (template: Omit<CustomTemplate, 'id' | 'createdAt'>) => string;
  updateCustomTemplate: (id: string, template: Partial<CustomTemplate>) => void;
  deleteCustomTemplate: (id: string) => void;

  addRecurringSchedule: (schedule: Omit<RecurringSchedule, 'id' | 'createdAt'>) => string;
  updateRecurringSchedule: (id: string, schedule: Partial<RecurringSchedule>) => void;
  deleteRecurringSchedule: (id: string) => void;
  processRecurringInvoices: () => void;

  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleTheme: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'light',
  currency: 'USD',
  currencySymbol: '$',
  invoicePrefix: 'INV-',
  invoiceSuffix: '',
  defaultTaxRate: 10,
  defaultPaymentTerms: 'net30',
};

const defaultBusiness: Omit<Business, 'id'> = {
  name: 'Your Company',
  email: 'hello@yourcompany.com',
  phone: '+1 (555) 000-0000',
  address: '123 Business Street',
  city: 'New York, NY 10001',
  country: 'United States',
  taxId: 'XX-XXXXXXX',
  accentColor: '#3b82f6',
  font: 'inter',
  footerText: 'Thank you for your business!',
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      businesses: [],
      clients: [],
      invoices: [],
      customTemplates: [],
      recurringSchedules: [],
      settings: defaultSettings,
      currentBusinessId: null,
      currentInvoice: null,

      addBusiness: (business) => {
        const id = uuidv4();
        set((state) => ({
          businesses: [...state.businesses, { ...business, id }],
          currentBusinessId: state.currentBusinessId ?? id,
        }));
        return id;
      },

      updateBusiness: (id, business) => {
        set((state) => ({
          businesses: state.businesses.map((b) =>
            b.id === id ? { ...b, ...business } : b
          ),
        }));
      },

      deleteBusiness: (id) => {
        set((state) => ({
          businesses: state.businesses.filter((b) => b.id !== id),
          currentBusinessId:
            state.currentBusinessId === id
              ? state.businesses.find((b) => b.id !== id)?.id ?? null
              : state.currentBusinessId,
        }));
      },

      setCurrentBusiness: (id) => {
        set({ currentBusinessId: id });
      },

      addClient: (client) => {
        const id = uuidv4();
        set((state) => ({
          clients: [...state.clients, { ...client, id, createdAt: new Date().toISOString() }],
        }));
        return id;
      },

      updateClient: (id, client) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...client } : c
          ),
        }));
      },

      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        }));
      },

      addInvoice: (invoice) => {
        const id = uuidv4();
        set((state) => ({
          invoices: [...state.invoices, { ...invoice, id }],
        }));
        return id;
      },

      updateInvoice: (id, invoice) => {
        set((state) => ({
          invoices: state.invoices.map((i) =>
            i.id === id ? { ...i, ...invoice } : i
          ),
        }));
      },

      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((i) => i.id !== id),
        }));
      },

      duplicateInvoice: (id) => {
        const invoice = get().invoices.find((i) => i.id === id);
        if (!invoice) return '';
        const newId = uuidv4();
        const newInvoiceNumber = get().getNextInvoiceNumber();
        set((state) => ({
          invoices: [
            ...state.invoices,
            {
              ...invoice,
              id: newId,
              invoiceNumber: newInvoiceNumber,
              status: 'draft' as const,
              isPaid: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return newId;
      },

      setCurrentInvoice: (invoice) => {
        set({ currentInvoice: invoice });
      },

      getNextInvoiceNumber: () => {
        const { settings, invoices } = get();
        const count = invoices.length + 1;
        const paddedNumber = count.toString().padStart(4, '0');
        return `${settings.invoicePrefix}${paddedNumber}${settings.invoiceSuffix}`;
      },

      addCustomTemplate: (template) => {
        const id = uuidv4();
        set((state) => ({
          customTemplates: [
            ...state.customTemplates,
            { ...template, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      updateCustomTemplate: (id, template) => {
        set((state) => ({
          customTemplates: state.customTemplates.map((t) =>
            t.id === id ? { ...t, ...template } : t
          ),
        }));
      },

      deleteCustomTemplate: (id) => {
        set((state) => ({
          customTemplates: state.customTemplates.filter((t) => t.id !== id),
        }));
      },

      addRecurringSchedule: (schedule) => {
        const id = uuidv4();
        set((state) => ({
          recurringSchedules: [
            ...state.recurringSchedules,
            { ...schedule, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      updateRecurringSchedule: (id, schedule) => {
        set((state) => ({
          recurringSchedules: state.recurringSchedules.map((s) =>
            s.id === id ? { ...s, ...schedule } : s
          ),
        }));
      },

      deleteRecurringSchedule: (id) => {
        set((state) => ({
          recurringSchedules: state.recurringSchedules.filter((s) => s.id !== id),
        }));
      },

      processRecurringInvoices: () => {
        const state = get();
        const now = new Date();
        
        state.recurringSchedules.forEach((schedule) => {
          if (!schedule.isActive) return;
          if (schedule.endDate && new Date(schedule.endDate) < now) return;
          
          const nextDate = new Date(schedule.nextGenerationDate);
          if (nextDate > now) return;

          // Generate the invoice
          const invoiceNumber = state.getNextInvoiceNumber();
          const dueDate = new Date(now);
          dueDate.setDate(dueDate.getDate() + 30);

          const subtotal = schedule.invoiceTemplate.items.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0
          );
          const taxTotal = schedule.invoiceTemplate.items.reduce(
            (sum, item) => sum + (item.quantity * item.price * item.taxRate) / 100,
            0
          );
          const discountTotal = schedule.invoiceTemplate.items.reduce(
            (sum, item) => sum + (item.quantity * item.price * item.discount) / 100,
            0
          );

          state.addInvoice({
            invoiceNumber,
            businessId: schedule.businessId,
            clientId: schedule.clientId,
            items: schedule.invoiceTemplate.items.map((item) => ({
              ...item,
              id: uuidv4(),
            })),
            subtotal,
            taxTotal,
            discountTotal,
            total: subtotal + taxTotal - discountTotal,
            status: schedule.autoSend ? 'sent' : 'draft',
            template: schedule.invoiceTemplate.template,
            createdAt: now.toISOString(),
            dueDate: dueDate.toISOString(),
            notes: schedule.invoiceTemplate.notes,
            isPaid: false,
          });

          // Calculate next generation date
          let newNextDate = new Date(nextDate);
          switch (schedule.frequency) {
            case 'weekly':
              newNextDate.setDate(newNextDate.getDate() + 7);
              break;
            case 'monthly':
              newNextDate.setMonth(newNextDate.getMonth() + 1);
              break;
            case 'yearly':
              newNextDate.setFullYear(newNextDate.getFullYear() + 1);
              break;
          }

          state.updateRecurringSchedule(schedule.id, {
            nextGenerationDate: newNextDate.toISOString(),
          });
        });
      },

      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      toggleTheme: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            theme: state.settings.theme === 'light' ? 'dark' : 'light',
          },
        }));
      },
    }),
    {
      name: 'invoice-generator-storage',
    }
  )
);

export const initializeDemoData = () => {
  const state = useStore.getState();
  
  if (state.businesses.length === 0) {
    const businessId = state.addBusiness(defaultBusiness);
    
    const client1Id = state.addClient({
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      phone: '+1 (555) 123-4567',
      address: '456 Corporate Ave',
      city: 'Los Angeles, CA 90001',
      country: 'United States',
      taxId: 'AC-123456',
      notes: 'Premium client - 30 day payment terms',
    });

    const client2Id = state.addClient({
      name: 'Tech Startup Inc',
      email: 'finance@techstartup.io',
      phone: '+1 (555) 987-6543',
      address: '789 Innovation Blvd',
      city: 'San Francisco, CA 94102',
      country: 'United States',
      notes: 'New client - requires detailed invoices',
    });

    const client3Id = state.addClient({
      name: 'Global Industries',
      email: 'accounts@globalind.com',
      phone: '+1 (555) 456-7890',
      address: '321 Enterprise Way',
      city: 'Chicago, IL 60601',
      country: 'United States',
      taxId: 'GI-789012',
    });

    const items1: InvoiceItem[] = [
      { id: uuidv4(), description: 'Website Design & Development', quantity: 1, price: 5000, taxRate: 10, discount: 0 },
      { id: uuidv4(), description: 'Logo Design Package', quantity: 1, price: 1500, taxRate: 10, discount: 10 },
      { id: uuidv4(), description: 'SEO Optimization', quantity: 1, price: 2000, taxRate: 10, discount: 0 },
    ];

    state.addInvoice({
      invoiceNumber: 'INV-0001',
      businessId,
      clientId: client1Id,
      items: items1,
      subtotal: 8500,
      taxTotal: 835,
      discountTotal: 150,
      total: 9185,
      status: 'paid',
      template: 'minimal',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Thank you for your business!',
      isPaid: true,
    });

    const items2: InvoiceItem[] = [
      { id: uuidv4(), description: 'Mobile App Development - Phase 1', quantity: 1, price: 15000, taxRate: 10, discount: 0 },
      { id: uuidv4(), description: 'UI/UX Design', quantity: 40, price: 150, taxRate: 10, discount: 5 },
    ];

    state.addInvoice({
      invoiceNumber: 'INV-0002',
      businessId,
      clientId: client2Id,
      items: items2,
      subtotal: 21000,
      taxTotal: 2070,
      discountTotal: 300,
      total: 22770,
      status: 'sent',
      template: 'modern',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Payment due within 30 days',
      isPaid: false,
    });

    const items3: InvoiceItem[] = [
      { id: uuidv4(), description: 'Consulting Services', quantity: 20, price: 200, taxRate: 10, discount: 0 },
      { id: uuidv4(), description: 'Training Sessions', quantity: 5, price: 500, taxRate: 10, discount: 0 },
    ];

    state.addInvoice({
      invoiceNumber: 'INV-0003',
      businessId,
      clientId: client3Id,
      items: items3,
      subtotal: 6500,
      taxTotal: 650,
      discountTotal: 0,
      total: 7150,
      status: 'overdue',
      template: 'corporate',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Please remit payment at your earliest convenience',
      isPaid: false,
    });
  }
};
