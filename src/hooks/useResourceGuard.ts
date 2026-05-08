import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Generic per-resource ownership guard for clients / business profiles
 * / custom templates. RLS is the source of truth — these checks fail
 * fast on the client to prevent confusing UX with stale sessions.
 */
export function useResourceGuard() {
  const { user, session } = useAuth();

  const requireUser = useCallback((): string | null => {
    if (!user || !session) {
      toast.error('You must be signed in to perform this action.');
      return null;
    }
    const exp = (session as any).expires_at as number | undefined;
    if (exp && exp * 1000 < Date.now()) {
      toast.error('Your session has expired. Please sign in again.');
      supabase.auth.signOut();
      return null;
    }
    return user.id;
  }, [user, session]);

  const ensureOwnsClient = useCallback(
    async (clientId: string): Promise<boolean> => {
      const uid = requireUser();
      if (!uid) return false;
      const { data, error } = await supabase
        .from('clients')
        .select('user_id')
        .eq('id', clientId)
        .maybeSingle();
      if (error || !data || data.user_id !== uid) {
        toast.error('You are not authorized to modify this client.');
        return false;
      }
      return true;
    },
    [requireUser],
  );

  const ensureOwnsBusiness = useCallback(
    async (businessUserId: string): Promise<boolean> => {
      const uid = requireUser();
      if (!uid) return false;
      if (businessUserId !== uid) {
        toast.error('You are not authorized to modify this business profile.');
        return false;
      }
      return true;
    },
    [requireUser],
  );

  return { requireUser, ensureOwnsClient, ensureOwnsBusiness };
}
