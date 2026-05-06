import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';

/**
 * Client-side authorization guard. RLS is the source of truth, but these
 * checks fail fast and prevent confusing UX when the session is stale or
 * the user is interacting with cached data they no longer own.
 */
export function useAuthGuard() {
  const { user, session } = useAuth();

  const ensureAuth = useCallback((): string | null => {
    if (!user || !session) {
      toast.error('You must be signed in to perform this action.');
      return null;
    }
    // Detect expired access tokens before they hit Supabase.
    const expSec = (session as any).expires_at as number | undefined;
    if (expSec && expSec * 1000 < Date.now()) {
      toast.error('Your session has expired. Please sign in again.');
      supabase.auth.signOut();
      return null;
    }
    return user.id;
  }, [user, session]);

  const ensureOwnsInvoice = useCallback(
    async (invoiceId: string): Promise<boolean> => {
      const userId = ensureAuth();
      if (!userId) return false;
      // Cached store check first.
      const cached = useStore.getState().invoices.find((i) => i.id === invoiceId);
      if (!cached) {
        toast.error('Invoice not found.');
        return false;
      }
      // Verify ownership server-side as a defense-in-depth check.
      const { data, error } = await supabase
        .from('invoices')
        .select('user_id')
        .eq('id', invoiceId)
        .maybeSingle();
      if (error || !data || data.user_id !== userId) {
        toast.error('You are not authorized to access this invoice.');
        return false;
      }
      return true;
    },
    [ensureAuth],
  );

  return { user, ensureAuth, ensureOwnsInvoice };
}
