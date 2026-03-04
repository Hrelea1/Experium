import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface Booking {
  id: string;
  booking_date: string;
  participants: number;
  status: string;
  total_price: number;
  special_requests: string | null;
  created_at: string;
  experiences?: { title: string; location_name: string };
}

export function ProviderBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to realtime booking changes
    const channel = supabase
      .channel('provider-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchBookings()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    // Get provider's experience IDs first
    const { data: provExps } = await supabase
      .from('experience_providers')
      .select('experience_id')
      .eq('provider_user_id', user.id)
      .eq('is_active', true);

    if (!provExps || provExps.length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const expIds = provExps.map(e => e.experience_id);

    const { data, error } = await supabase
      .from('bookings')
      .select('*, experiences(title, location_name)')
      .in('experience_id', expIds)
      .order('booking_date', { ascending: false })
      .limit(50);

    if (!error && data) setBookings(data);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      confirmed: { label: 'Confirmat', variant: 'default' },
      pending: { label: 'În așteptare', variant: 'outline' },
      cancelled: { label: 'Anulat', variant: 'destructive' },
      completed: { label: 'Finalizat', variant: 'secondary' },
    };
    const s = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Rezervări Primite
        </CardTitle>
        <CardDescription>Rezervările pentru experiențele tale</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nu ai rezervări încă.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h4 className="font-medium">{booking.experiences?.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(new Date(booking.booking_date), 'dd MMM yyyy, HH:mm', { locale: ro })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {booking.participants} pers.
                    </span>
                    <span className="font-medium text-foreground">{booking.total_price} Lei</span>
                  </div>
                  {booking.special_requests && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{booking.special_requests}"
                    </p>
                  )}
                </div>
                {getStatusBadge(booking.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
