import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProviderNotification {
  id: string;
  provider_user_id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function useProviderNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ProviderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('provider_notifications')
        .select('*')
        .eq('provider_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      const notifs = (data || []) as ProviderNotification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('provider_notifications')
      .update({ is_read: true })
      .eq('id', id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from('provider_notifications')
      .update({ is_read: true })
      .eq('provider_user_id', user.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('provider-notifs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'provider_notifications',
          filter: `provider_user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as ProviderNotification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
