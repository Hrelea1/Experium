import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, Gift, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Booking {
  id: string;
  booking_date: string;
  participants: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  created_at: string;
  user_id: string;
  experiences?: {
    title: string;
  };
  vouchers?: {
    code: string;
  };
}

interface UserProfile {
  full_name: string | null;
  email: string;
}

const ManageBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          experiences (
            title
          ),
          vouchers (
            code
          )
        `)
        .order('booking_date', { ascending: false });

      if (error) throw error;

      const bookingsData = data || [];
      setBookings(bookingsData);

      // Fetch user profiles separately
      const userIds = [...new Set(bookingsData.map(b => b.user_id))];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (!profilesError && profiles) {
          const profilesMap: Record<string, UserProfile> = {};
          profiles.forEach(p => {
            profilesMap[p.id] = { full_name: p.full_name, email: p.email };
          });
          setUserProfiles(profilesMap);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu am putut încărca rezervările',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Status-ul rezervării a fost actualizat',
      });

      fetchBookings();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      confirmed: { variant: 'default', label: 'Confirmată' },
      pending: { variant: 'secondary', label: 'În așteptare' },
      cancelled: { variant: 'destructive', label: 'Anulată' },
      completed: { variant: 'outline', label: 'Finalizată' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filterByStatus = (status?: string) => {
    if (!status) return bookings;
    return bookings.filter((b) => b.status === status);
  };

  const BookingsTable = ({ bookings }: { bookings: Booking[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Experiență</TableHead>
          <TableHead>Dată</TableHead>
          <TableHead>Participanți</TableHead>
          <TableHead>Voucher</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Acțiuni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
          <TableCell>
              <div>
                <div className="font-medium">{userProfiles[booking.user_id]?.full_name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{userProfiles[booking.user_id]?.email || 'N/A'}</div>
              </div>
            </TableCell>
            <TableCell className="font-medium">
              {booking.experiences?.title || 'N/A'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(new Date(booking.booking_date), 'dd MMM yyyy')}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                {booking.participants}
              </div>
            </TableCell>
            <TableCell>
              {booking.vouchers ? (
                <div className="flex items-center gap-1 text-sm">
                  <Gift className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{booking.vouchers.code}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>{getStatusBadge(booking.status)}</TableCell>
            <TableCell className="text-right">
              {booking.status === 'confirmed' && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateBookingStatus(booking.id, 'completed')}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Rezervări</h2>
          <p className="text-muted-foreground">
            Gestionează toate rezervările clienților
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista Rezervări ({bookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">Toate ({bookings.length})</TabsTrigger>
                  <TabsTrigger value="confirmed">
                    Confirmate ({filterByStatus('confirmed').length})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    În așteptare ({filterByStatus('pending').length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Finalizate ({filterByStatus('completed').length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <BookingsTable bookings={bookings} />
                </TabsContent>
                <TabsContent value="confirmed">
                  <BookingsTable bookings={filterByStatus('confirmed')} />
                </TabsContent>
                <TabsContent value="pending">
                  <BookingsTable bookings={filterByStatus('pending')} />
                </TabsContent>
                <TabsContent value="completed">
                  <BookingsTable bookings={filterByStatus('completed')} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ManageBookings;
