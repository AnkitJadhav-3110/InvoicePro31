import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import type { Business, Client, Invoice, RecurringSchedule, AppSettings } from '@/store/useStore';

export function useSupabaseSync() {
  const { user } = useAuth();
  const store = useStore();

  const loadData = useCallback(async () => {
    if (!user) return;

    // Load profile (business)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile) {
      const business: Business = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        country: profile.country,
        taxId: profile.tax_id || '',
        accentColor: profile.accent_color,
        font: profile.font as Business['font'],
        footerText: profile.footer_text,
        logo: profile.logo_url || undefined,
        signature: profile.signature_url || undefined,
      };

      // Sync to store
      const existing = store.businesses.find(b => b.id === profile.id);
      if (existing) {
        store.updateBusiness(profile.id, business);
      } else {
        // Replace all businesses with the one from DB
        useStore.setState({ businesses: [business], currentBusinessId: profile.id });
      }
    }

    // Load clients
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (clients) {
      const mappedClients: Client[] = clients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city,
        country: c.country,
        taxId: c.tax_id || undefined,
        notes: c.notes || undefined,
        createdAt: c.created_at,
      }));
      useStore.setState({ clients: mappedClients });
    }

    // Load invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (invoices) {
      const mappedInvoices: Invoice[] = invoices.map(i => ({
        id: i.id,
        invoiceNumber: i.invoice_number,
        businessId: profile?.id || '',
        clientId: i.client_id,
        items: (i.items as any[]) || [],
        subtotal: Number(i.subtotal),
        taxTotal: Number(i.tax_total),
        discountTotal: Number(i.discount_total),
        total: Number(i.total),
        status: i.status as Invoice['status'],
        statusHistory: (i.status_history as any[]) || [],
        template: i.template as Invoice['template'],
        createdAt: i.created_at,
        dueDate: i.due_date,
        notes: i.notes || '',
        paymentQR: i.payment_qr || undefined,
        isPaid: i.is_paid,
      }));
      useStore.setState({ invoices: mappedInvoices });
    }

    // Load recurring schedules
    const { data: schedules } = await supabase
      .from('recurring_schedules')
      .select('*')
      .eq('user_id', user.id);

    if (schedules) {
      const mappedSchedules: RecurringSchedule[] = schedules.map(s => ({
        id: s.id,
        clientId: s.client_id,
        businessId: profile?.id || '',
        frequency: s.frequency as RecurringSchedule['frequency'],
        startDate: s.start_date,
        endDate: s.end_date || undefined,
        nextGenerationDate: s.next_generation_date,
        isActive: s.is_active,
        autoSend: s.auto_send,
        invoiceTemplate: s.invoice_template as any,
        createdAt: s.created_at,
      }));
      useStore.setState({ recurringSchedules: mappedSchedules });
    }

    // Load settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settings) {
      const appSettings: AppSettings = {
        theme: settings.theme as AppSettings['theme'],
        currency: settings.currency,
        currencySymbol: settings.currency_symbol,
        invoicePrefix: settings.invoice_prefix,
        invoiceSuffix: settings.invoice_suffix,
        defaultTaxRate: Number(settings.default_tax_rate),
        defaultPaymentTerms: settings.default_payment_terms as AppSettings['defaultPaymentTerms'],
        email: settings.email_settings as any,
      };
      useStore.setState({ settings: appSettings });
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { reload: loadData };
}

// Helper to save profile changes to Supabase
export async function saveProfileToSupabase(userId: string, business: Partial<Business>) {
  const updateData: Record<string, any> = {};
  if (business.name !== undefined) updateData.name = business.name;
  if (business.email !== undefined) updateData.email = business.email;
  if (business.phone !== undefined) updateData.phone = business.phone;
  if (business.address !== undefined) updateData.address = business.address;
  if (business.city !== undefined) updateData.city = business.city;
  if (business.country !== undefined) updateData.country = business.country;
  if (business.taxId !== undefined) updateData.tax_id = business.taxId;
  if (business.accentColor !== undefined) updateData.accent_color = business.accentColor;
  if (business.font !== undefined) updateData.font = business.font;
  if (business.footerText !== undefined) updateData.footer_text = business.footerText;
  if (business.logo !== undefined) updateData.logo_url = business.logo;
  if (business.signature !== undefined) updateData.signature_url = business.signature;

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('user_id', userId);

  return { error };
}

// Helper to save client to Supabase
export async function saveClientToSupabase(userId: string, client: Omit<Client, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      city: client.city,
      country: client.country,
      tax_id: client.taxId || null,
      notes: client.notes || null,
    })
    .select()
    .single();

  return { data, error };
}

export async function updateClientInSupabase(clientId: string, client: Partial<Client>) {
  const updateData: Record<string, any> = {};
  if (client.name !== undefined) updateData.name = client.name;
  if (client.email !== undefined) updateData.email = client.email;
  if (client.phone !== undefined) updateData.phone = client.phone;
  if (client.address !== undefined) updateData.address = client.address;
  if (client.city !== undefined) updateData.city = client.city;
  if (client.country !== undefined) updateData.country = client.country;
  if (client.taxId !== undefined) updateData.tax_id = client.taxId;
  if (client.notes !== undefined) updateData.notes = client.notes;

  const { error } = await supabase.from('clients').update(updateData).eq('id', clientId);
  return { error };
}

export async function deleteClientFromSupabase(clientId: string) {
  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  return { error };
}

export async function saveInvoiceToSupabase(userId: string, invoice: Omit<Invoice, 'id'>) {
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      client_id: invoice.clientId,
      invoice_number: invoice.invoiceNumber,
      template: invoice.template,
      items: invoice.items as any,
      subtotal: invoice.subtotal,
      tax_total: invoice.taxTotal,
      discount_total: invoice.discountTotal,
      total: invoice.total,
      status: invoice.status,
      status_history: invoice.statusHistory as any,
      notes: invoice.notes,
      due_date: invoice.dueDate,
      is_paid: invoice.isPaid,
      payment_qr: invoice.paymentQR || null,
    })
    .select()
    .single();

  return { data, error };
}

export async function updateInvoiceInSupabase(invoiceId: string, invoice: Partial<Invoice>) {
  const updateData: Record<string, any> = {};
  if (invoice.status !== undefined) updateData.status = invoice.status;
  if (invoice.statusHistory !== undefined) updateData.status_history = invoice.statusHistory;
  if (invoice.isPaid !== undefined) updateData.is_paid = invoice.isPaid;
  if (invoice.notes !== undefined) updateData.notes = invoice.notes;
  if (invoice.items !== undefined) updateData.items = invoice.items;
  if (invoice.subtotal !== undefined) updateData.subtotal = invoice.subtotal;
  if (invoice.taxTotal !== undefined) updateData.tax_total = invoice.taxTotal;
  if (invoice.discountTotal !== undefined) updateData.discount_total = invoice.discountTotal;
  if (invoice.total !== undefined) updateData.total = invoice.total;

  const { error } = await supabase.from('invoices').update(updateData).eq('id', invoiceId);
  return { error };
}

export async function deleteInvoiceFromSupabase(invoiceId: string) {
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
  return { error };
}

export async function saveRecurringScheduleToSupabase(userId: string, schedule: Omit<RecurringSchedule, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('recurring_schedules')
    .insert({
      user_id: userId,
      client_id: schedule.clientId,
      frequency: schedule.frequency,
      start_date: schedule.startDate,
      end_date: schedule.endDate || null,
      next_generation_date: schedule.nextGenerationDate,
      is_active: schedule.isActive,
      auto_send: schedule.autoSend,
      invoice_template: schedule.invoiceTemplate as any,
    })
    .select()
    .single();

  return { data, error };
}

export async function updateRecurringScheduleInSupabase(scheduleId: string, schedule: Partial<RecurringSchedule>) {
  const updateData: Record<string, any> = {};
  if (schedule.frequency !== undefined) updateData.frequency = schedule.frequency;
  if (schedule.endDate !== undefined) updateData.end_date = schedule.endDate;
  if (schedule.nextGenerationDate !== undefined) updateData.next_generation_date = schedule.nextGenerationDate;
  if (schedule.isActive !== undefined) updateData.is_active = schedule.isActive;
  if (schedule.autoSend !== undefined) updateData.auto_send = schedule.autoSend;
  if (schedule.invoiceTemplate !== undefined) updateData.invoice_template = schedule.invoiceTemplate;

  const { error } = await supabase.from('recurring_schedules').update(updateData).eq('id', scheduleId);
  return { error };
}

export async function deleteRecurringScheduleFromSupabase(scheduleId: string) {
  const { error } = await supabase.from('recurring_schedules').delete().eq('id', scheduleId);
  return { error };
}

export async function saveSettingsToSupabase(userId: string, settings: Partial<AppSettings>) {
  const updateData: Record<string, any> = {};
  if (settings.theme !== undefined) updateData.theme = settings.theme;
  if (settings.currency !== undefined) updateData.currency = settings.currency;
  if (settings.currencySymbol !== undefined) updateData.currency_symbol = settings.currencySymbol;
  if (settings.invoicePrefix !== undefined) updateData.invoice_prefix = settings.invoicePrefix;
  if (settings.invoiceSuffix !== undefined) updateData.invoice_suffix = settings.invoiceSuffix;
  if (settings.defaultTaxRate !== undefined) updateData.default_tax_rate = settings.defaultTaxRate;
  if (settings.defaultPaymentTerms !== undefined) updateData.default_payment_terms = settings.defaultPaymentTerms;
  if (settings.email !== undefined) updateData.email_settings = settings.email;

  const { error } = await supabase.from('app_settings').update(updateData).eq('user_id', userId);
  return { error };
}
