import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';
import { useResourceGuard } from '@/hooks/useResourceGuard';

const signOutSpy = vi.fn();
let mockOwnerId = 'user-1';
let mockMissing = false;
let mockError: any = null;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { signOut: (...a: any[]) => signOutSpy(...a) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (mockError) return { data: null, error: mockError };
            if (mockMissing) return { data: null, error: null };
            return { data: { user_id: mockOwnerId }, error: null };
          },
        }),
      }),
    }),
  },
}));

let mockUser: any = { id: 'user-1' };
let mockSession: any = { expires_at: Math.floor(Date.now() / 1000) + 3600 };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, session: mockSession }),
}));

beforeEach(() => {
  mockUser = { id: 'user-1' };
  mockSession = { expires_at: Math.floor(Date.now() / 1000) + 3600 };
  mockOwnerId = 'user-1';
  mockMissing = false;
  mockError = null;
  signOutSpy.mockClear();
  vi.spyOn(toast, 'error').mockImplementation(() => 'id');
});
afterEach(() => vi.restoreAllMocks());

describe('useResourceGuard — clients', () => {
  it('allows the owner', async () => {
    const { result } = renderHook(() => useResourceGuard());
    let ok = false;
    await act(async () => { ok = await result.current.ensureOwnsClient('c1'); });
    expect(ok).toBe(true);
  });
  it('rejects another user', async () => {
    mockOwnerId = 'someone-else';
    const { result } = renderHook(() => useResourceGuard());
    let ok = true;
    await act(async () => { ok = await result.current.ensureOwnsClient('c1'); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });
  it('rejects unauthenticated users', async () => {
    mockUser = null; mockSession = null;
    const { result } = renderHook(() => useResourceGuard());
    let ok = true;
    await act(async () => { ok = await result.current.ensureOwnsClient('c1'); });
    expect(ok).toBe(false);
  });
  it('rejects expired sessions and signs out', async () => {
    mockSession = { expires_at: Math.floor(Date.now() / 1000) - 60 };
    const { result } = renderHook(() => useResourceGuard());
    let ok = true;
    await act(async () => { ok = await result.current.ensureOwnsClient('c1'); });
    expect(ok).toBe(false);
    expect(signOutSpy).toHaveBeenCalled();
  });
});

describe('useResourceGuard — business profile', () => {
  it('allows the owner', async () => {
    const { result } = renderHook(() => useResourceGuard());
    let ok = false;
    await act(async () => { ok = await result.current.ensureOwnsBusiness('user-1'); });
    expect(ok).toBe(true);
  });
  it('rejects when the profile belongs to someone else', async () => {
    const { result } = renderHook(() => useResourceGuard());
    let ok = true;
    await act(async () => { ok = await result.current.ensureOwnsBusiness('other-user'); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });
});
