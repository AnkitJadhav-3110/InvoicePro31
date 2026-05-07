import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useStore } from '@/store/useStore';

// ----- Mock supabase client -----
const signOutSpy = vi.fn();
let mockOwnerId = 'user-1';
let mockInvoiceExists = true;
let mockInvoiceError: any = null;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { signOut: (...args: any[]) => signOutSpy(...args) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (mockInvoiceError) return { data: null, error: mockInvoiceError };
            if (!mockInvoiceExists) return { data: null, error: null };
            return { data: { user_id: mockOwnerId }, error: null };
          },
        }),
      }),
    }),
  },
}));

// ----- Mock auth context -----
let mockUser: any = { id: 'user-1' };
let mockSession: any = { expires_at: Math.floor(Date.now() / 1000) + 3600 };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, session: mockSession }),
}));

beforeEach(() => {
  // Pre-seed the store with a cached invoice owned by user-1.
  useStore.setState({
    invoices: [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-1',
        businessId: 'b1',
        clientId: 'c1',
        items: [],
        subtotal: 0,
        taxTotal: 0,
        discountTotal: 0,
        total: 0,
        status: 'draft',
        template: 'minimal',
        createdAt: '2026-03-01T00:00:00Z',
        dueDate: '2026-04-01T00:00:00Z',
        notes: '',
        isPaid: false,
      },
    ],
  } as any);

  mockUser = { id: 'user-1' };
  mockSession = { expires_at: Math.floor(Date.now() / 1000) + 3600 };
  mockOwnerId = 'user-1';
  mockInvoiceExists = true;
  mockInvoiceError = null;
  signOutSpy.mockClear();
  vi.spyOn(toast, 'error').mockImplementation(() => 'id');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAuthGuard.ensureAuth', () => {
  it('returns the user id when signed in', () => {
    const { result } = renderHook(() => useAuthGuard());
    expect(result.current.ensureAuth()).toBe('user-1');
  });

  it('blocks unauthenticated users (no session)', () => {
    mockUser = null;
    mockSession = null;
    const { result } = renderHook(() => useAuthGuard());
    expect(result.current.ensureAuth()).toBeNull();
    expect(toast.error).toHaveBeenCalled();
  });

  it('blocks expired sessions and signs the user out', () => {
    mockSession = { expires_at: Math.floor(Date.now() / 1000) - 60 };
    const { result } = renderHook(() => useAuthGuard());
    expect(result.current.ensureAuth()).toBeNull();
    expect(signOutSpy).toHaveBeenCalled();
  });
});

describe('useAuthGuard.ensureOwnsInvoice (download/duplicate/delete/markPaid/markSent guard)', () => {
  it('allows the owner', async () => {
    const { result } = renderHook(() => useAuthGuard());
    let ok = false;
    await act(async () => {
      ok = await result.current.ensureOwnsInvoice('inv-1');
    });
    expect(ok).toBe(true);
  });

  it('rejects when another user owns the invoice', async () => {
    mockOwnerId = 'someone-else';
    const { result } = renderHook(() => useAuthGuard());
    let ok = true;
    await act(async () => {
      ok = await result.current.ensureOwnsInvoice('inv-1');
    });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      'You are not authorized to access this invoice.',
    );
  });

  it('rejects unauthenticated users before hitting the database', async () => {
    mockUser = null;
    mockSession = null;
    const { result } = renderHook(() => useAuthGuard());
    let ok = true;
    await act(async () => {
      ok = await result.current.ensureOwnsInvoice('inv-1');
    });
    expect(ok).toBe(false);
  });

  it('rejects when the invoice is missing from the cached store', async () => {
    useStore.setState({ invoices: [] } as any);
    const { result } = renderHook(() => useAuthGuard());
    let ok = true;
    await act(async () => {
      ok = await result.current.ensureOwnsInvoice('inv-1');
    });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Invoice not found.');
  });

  it('rejects when the database lookup errors out', async () => {
    mockInvoiceError = new Error('rls denied');
    const { result } = renderHook(() => useAuthGuard());
    let ok = true;
    await act(async () => {
      ok = await result.current.ensureOwnsInvoice('inv-1');
    });
    expect(ok).toBe(false);
  });
});
