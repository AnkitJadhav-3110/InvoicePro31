import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { supabase } from '@/integrations/supabase/client';
import type { Client, Invoice, Business, RecurringSchedule, AppSettings, InvoiceStatusEvent } from '@/store/useStore';

/**
 * Hook that wraps store CRUD operations with Supabase persistence.
 * All operations update the local store immediately for snappy UI,
 * then persist to Supabase in the background.
 */
export function useDataSync() {
  const { user } = useAuth();

  // ─── CLIENTS ───────────────────────────────────────────────

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    if (!user) {
      return useStore.getState().addClient(clientData);
    }
    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        city: clientData.city,
        country: clientData.country,
        tax_id: clientData.taxId || null,
        notes: clientData.notes || null,
        currency: clientData.currency || 'USD',
        currency_symbol: clientData.currencySymbol || '$',
      } as any)
      .select()
      .single();

    if (error || !data) {
      return useStore.getState().addClient(clientData);
    }

    const client: Client = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country,
      taxId: data.tax_id || undefined,
      notes: data.notes || undefined,
      currency: (data as any).currency || 'USD',
      currencySymbol: (data as any).currency_symbol || '$',
      createdAt: data.created_at,
    };
    useStore.setState(state => ({ clients: [client, ...state.clients] }));
    return data.id;
  }, [user]);

  const updateClient = useCallback(async (id: string, clientData: Partial<Client>) => {
    useStore.getState().updateClient(id, clientData);
    if (!user) return;

    const updateData: Record<string, any> = {};
    if (clientData.name !== undefined) updateData.name = clientData.name;
    if (clientData.email !== undefined) updateData.email = clientData.email;
    if (clientData.phone !== undefined) updateData.phone = clientData.phone;
    if (clientData.address !== undefined) updateData.address = clientData.address;
    if (clientData.city !== undefined) updateData.city = clientData.city;
    if (clientData.country !== undefined) updateData.country = clientData.country;
    if (clientData.taxId !== undefined) updateData.tax_id = clientData.taxId;
    if (clientData.notes !== undefined) updateData.notes = clientData.notes;

    await supabase.from('clients').update(updateData).eq('id', id);
  }, [user]);

  const deleteClient = useCallback(async (id: string) => {
    useStore.getState().deleteClient(id);
    if (!user) return;
    await supabase.from('clients').delete().eq('id', id);
  }, [user]);

  // ─── INVOICES ──────────────────────────────────────────────

  const addInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id'>) => {
    if (!user) {
      return useStore.getState().addInvoice(invoiceData);
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: invoiceData.clientId,
        invoice_number: invoiceData.invoiceNumber,
        template: invoiceData.template,
        items: invoiceData.items as any,
        subtotal: invoiceData.subtotal,
        tax_total: invoiceData.taxTotal,
        discount_total: invoiceData.discountTotal,
        total: invoiceData.total,
        status: invoiceData.status,
        status_history: invoiceData.statusHistory as any || [{ status: invoiceData.status, timestamp: new Date().toISOString() }],
        notes: invoiceData.notes,
        due_date: invoiceData.dueDate,
        is_paid: invoiceData.isPaid,
        payment_qr: invoiceData.paymentQR || null,
      })
      .select()
      .single();

    if (error || !data) {
      return useStore.getState().addInvoice(invoiceData);
    }

    const invoice: Invoice = {
      id: data.id,
      invoiceNumber: data.invoice_number,
      businessId: invoiceData.businessId,
      clientId: data.client_id,
      items: (data.items as any[]) || [],
      subtotal: Number(data.subtotal),
      taxTotal: Number(data.tax_total),
      discountTotal: Number(data.discount_total),
      total: Number(data.total),
      status: data.status as Invoice['status'],
      statusHistory: (data.status_history as any[]) || [],
      template: data.template as Invoice['template'],
      createdAt: data.created_at,
      dueDate: data.due_date,
      notes: data.notes || '',
      paymentQR: data.payment_qr || undefined,
      isPaid: data.is_paid,
    };
    useStore.setState(state => ({ invoices: [invoice, ...state.invoices] }));
    return data.id;
  }, [user]);

  const updateInvoice = useCallback(async (id: string, invoiceData: Partial<Invoice>) => {
    useStore.getState().updateInvoice(id, invoiceData);
    if (!user) return;

    const updateData: Record<string, any> = {};
    if (invoiceData.status !== undefined) updateData.status = invoiceData.status;
    if (invoiceData.isPaid !== undefined) updateData.is_paid = invoiceData.isPaid;
    if (invoiceData.notes !== undefined) updateData.notes = invoiceData.notes;
    if (invoiceData.items !== undefined) updateData.items = invoiceData.items;
    if (invoiceData.subtotal !== undefined) updateData.subtotal = invoiceData.subtotal;
    if (invoiceData.taxTotal !== undefined) updateData.tax_total = invoiceData.taxTotal;
    if (invoiceData.discountTotal !== undefined) updateData.discount_total = invoiceData.discountTotal;
    if (invoiceData.total !== undefined) updateData.total = invoiceData.total;
    if (invoiceData.template !== undefined) updateData.template = invoiceData.template;
    if (invoiceData.paymentQR !== undefined) updateData.payment_qr = invoiceData.paymentQR;

    // Also sync status history from store
    const updatedInvoice = useStore.getState().invoices.find(i => i.id === id);
    if (updatedInvoice?.statusHistory) {
      updateData.status_history = updatedInvoice.statusHistory;
    }

    await supabase.from('invoices').update(updateData).eq('id', id);
  }, [user]);

  const deleteInvoice = useCallback(async (id: string) => {
    useStore.getState().deleteInvoice(id);
    if (!user) return;
    await supabase.from('invoices').delete().eq('id', id);
  }, [user]);

  const duplicateInvoice = useCallback(async (id: string) => {
    const invoice = useStore.getState().invoices.find(i => i.id === id);
    if (!invoice) return '';

    const newInvoiceNumber = useStore.getState().getNextInvoiceNumber();
    const newInvoice: Omit<Invoice, 'id'> = {
      ...invoice,
      invoiceNumber: newInvoiceNumber,
      status: 'draft',
      isPaid: false,
      createdAt: new Date().toISOString(),
      statusHistory: [{ status: 'draft' as const, timestamp: new Date().toISOString() }],
    };

    return addInvoice(newInvoice);
  }, [addInvoice]);

  // ─── BUSINESS / PROFILE ───────────────────────────────────

  const addBusiness = useCallback(async (businessData: Omit<Business, 'id'>) => {
    const id = useStore.getState().addBusiness(businessData);
    if (!user) return id;

    // For profiles, we update the existing profile created by the trigger
    const updateData: Record<string, any> = {
      name: businessData.name,
      email: businessData.email,
      phone: businessData.phone,
      address: businessData.address,
      city: businessData.city,
      country: businessData.country,
      tax_id: businessData.taxId,
      accent_color: businessData.accentColor,
      font: businessData.font,
      footer_text: businessData.footerText,
      logo_url: businessData.logo || null,
      signature_url: businessData.signature || null,
    };

    await supabase.from('profiles').update(updateData).eq('user_id', user.id);
    return id;
  }, [user]);

  const updateBusiness = useCallback(async (id: string, businessData: Partial<Business>) => {
    useStore.getState().updateBusiness(id, businessData);
    if (!user) return;

    const updateData: Record<string, any> = {};
    if (businessData.name !== undefined) updateData.name = businessData.name;
    if (businessData.email !== undefined) updateData.email = businessData.email;
    if (businessData.phone !== undefined) updateData.phone = businessData.phone;
    if (businessData.address !== undefined) updateData.address = businessData.address;
    if (businessData.city !== undefined) updateData.city = businessData.city;
    if (businessData.country !== undefined) updateData.country = businessData.country;
    if (businessData.taxId !== undefined) updateData.tax_id = businessData.taxId;
    if (businessData.accentColor !== undefined) updateData.accent_color = businessData.accentColor;
    if (businessData.font !== undefined) updateData.font = businessData.font;
    if (businessData.footerText !== undefined) updateData.footer_text = businessData.footerText;
    if (businessData.logo !== undefined) updateData.logo_url = businessData.logo;
    if (businessData.signature !== undefined) updateData.signature_url = businessData.signature;

    await supabase.from('profiles').update(updateData).eq('user_id', user.id);
  }, [user]);

  const deleteBusiness = useCallback(async (id: string) => {
    useStore.getState().deleteBusiness(id);
    // Don't delete profile from Supabase as it's tied to the user
  }, []);

  // ─── RECURRING SCHEDULES ──────────────────────────────────

  const addRecurringSchedule = useCallback(async (scheduleData: Omit<RecurringSchedule, 'id' | 'createdAt'>) => {
    if (!user) {
      return useStore.getState().addRecurringSchedule(scheduleData);
    }

    const { data, error } = await supabase
      .from('recurring_schedules')
      .insert({
        user_id: user.id,
        client_id: scheduleData.clientId,
        frequency: scheduleData.frequency,
        start_date: scheduleData.startDate,
        end_date: scheduleData.endDate || null,
        next_generation_date: scheduleData.nextGenerationDate,
        is_active: scheduleData.isActive,
        auto_send: scheduleData.autoSend,
        invoice_template: scheduleData.invoiceTemplate as any,
      })
      .select()
      .single();

    if (error || !data) {
      return useStore.getState().addRecurringSchedule(scheduleData);
    }

    const schedule: RecurringSchedule = {
      id: data.id,
      clientId: data.client_id,
      businessId: scheduleData.businessId,
      frequency: data.frequency as RecurringSchedule['frequency'],
      startDate: data.start_date,
      endDate: data.end_date || undefined,
      nextGenerationDate: data.next_generation_date,
      isActive: data.is_active,
      autoSend: data.auto_send,
      invoiceTemplate: data.invoice_template as any,
      createdAt: data.created_at,
    };
    useStore.setState(state => ({
      recurringSchedules: [...state.recurringSchedules, schedule],
    }));
    return data.id;
  }, [user]);

  const updateRecurringSchedule = useCallback(async (id: string, scheduleData: Partial<RecurringSchedule>) => {
    useStore.getState().updateRecurringSchedule(id, scheduleData);
    if (!user) return;

    const updateData: Record<string, any> = {};
    if (scheduleData.frequency !== undefined) updateData.frequency = scheduleData.frequency;
    if (scheduleData.endDate !== undefined) updateData.end_date = scheduleData.endDate;
    if (scheduleData.nextGenerationDate !== undefined) updateData.next_generation_date = scheduleData.nextGenerationDate;
    if (scheduleData.isActive !== undefined) updateData.is_active = scheduleData.isActive;
    if (scheduleData.autoSend !== undefined) updateData.auto_send = scheduleData.autoSend;
    if (scheduleData.invoiceTemplate !== undefined) updateData.invoice_template = scheduleData.invoiceTemplate;

    await supabase.from('recurring_schedules').update(updateData).eq('id', id);
  }, [user]);

  const deleteRecurringSchedule = useCallback(async (id: string) => {
    useStore.getState().deleteRecurringSchedule(id);
    if (!user) return;
    await supabase.from('recurring_schedules').delete().eq('id', id);
  }, [user]);

  // ─── SETTINGS ─────────────────────────────────────────────

  const updateSettings = useCallback(async (settingsData: Partial<AppSettings>) => {
    useStore.getState().updateSettings(settingsData);
    if (!user) return;

    const updateData: Record<string, any> = {};
    if (settingsData.theme !== undefined) updateData.theme = settingsData.theme;
    if (settingsData.currency !== undefined) updateData.currency = settingsData.currency;
    if (settingsData.currencySymbol !== undefined) updateData.currency_symbol = settingsData.currencySymbol;
    if (settingsData.invoicePrefix !== undefined) updateData.invoice_prefix = settingsData.invoicePrefix;
    if (settingsData.invoiceSuffix !== undefined) updateData.invoice_suffix = settingsData.invoiceSuffix;
    if (settingsData.defaultTaxRate !== undefined) updateData.default_tax_rate = settingsData.defaultTaxRate;
    if (settingsData.defaultPaymentTerms !== undefined) updateData.default_payment_terms = settingsData.defaultPaymentTerms;
    if (settingsData.email !== undefined) updateData.email_settings = settingsData.email;

    await supabase.from('app_settings').update(updateData).eq('user_id', user.id);
  }, [user]);

  return {
    addClient,
    updateClient,
    deleteClient,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    duplicateInvoice,
    addBusiness,
    updateBusiness,
    deleteBusiness,
    addRecurringSchedule,
    updateRecurringSchedule,
    deleteRecurringSchedule,
    updateSettings,
  };
}
