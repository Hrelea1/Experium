import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'moderator' | 'provider' | 'ambassador' | 'user';

export function useRoleCheck() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkRoles();
    } else {
      setRoles([]);
      setLoading(false);
    }
  }, [user]);

  const checkRoles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      const userRoles = data?.map(r => r.role as AppRole) || [];
      setRoles(userRoles);
    } catch (error) {
      console.error('Error checking roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const isAdmin = hasRole('admin');
  const isAmbassador = hasRole('ambassador');
  const isProvider = hasRole('provider');
  const isModerator = hasRole('moderator');

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isAmbassador,
    isProvider,
    isModerator,
    refetch: checkRoles,
  };
}
