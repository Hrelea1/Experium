import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Booking {
  id: string;
  booking_date: string;
  participants: number;
  status: string;
  total_price: number;
  created_at: string;
  user_id: string;
  experience_id: string;
  experiences?: { title: string };
}

interface UserProfile {
  full_name: string | null;
  email: string;
}

const ManageOrders = () => {
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
        .select(`*, experiences(title)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const bData = data || [];
      setBookings(bData);

      const userIds = [...new Set(bData.map(b => b.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profiles) {
          const map: Record<string, UserProfile> = {};
          profiles.forEach(p => { map[p.id] = { full_name: p.full_name, email: p.email }; });
          setUserProfiles(map);
        }
      }
    } catch (error: any) {
      toast({ title: 'Eroare', description: 'Nu am putut încărca comenzile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      confirmed: { variant: 'default', label: 'Confirmată', icon: CheckCircle },
      completed: { variant: 'secondary', label: 'Finalizată', icon: CheckCircle },
      cancelled: { variant: 'destructive', label: 'Anulată', icon: XCircle },
      pending: { variant: 'outline', label: 'În așteptare', icon: Clock },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filterByStatus = (status?: string) => {
    if (!status) return bookings;
    return bookings.filter(b => b.status === status);
  };

  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price, 0);

  const BookingsTable = ({ bookings }: { bookings: Booking[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Experiență</TableHead>
          <TableHead>Valoare</TableHead>
          <TableHead>Data Achiziției</TableHead>
          <TableHead>Data Rezervării</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b) => (
          <TableRow key={b.id}>
            <TableCell>
              <div>
                <div className="font-medium">{userProfiles[b.user_id]?.full_name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{userProfiles[b.user_id]?.email || 'N/A'}</div>
              </div>
            </TableCell>
            <TableCell className="font-medium">{b.experiences?.title || 'N/A'}</TableCell>
            <TableCell className="font-medium">{b.total_price} RON</TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(new Date(b.created_at), 'dd MMM yyyy')}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {format(new Date(b.booking_date), 'dd MMM yyyy')}
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(b.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Comenzi & Vânzări</h2>
          <p className="text-muted-foreground">Toate achizițiile și rezervările</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Venit Total</p>
                <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} RON</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Comenzi</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Clienți Unici</p>
                <p className="text-2xl font-bold">{Object.keys(userProfiles).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista Comenzi ({bookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">Toate ({bookings.length})</TabsTrigger>
                  <TabsTrigger value="confirmed">Confirmate ({filterByStatus('confirmed').length})</TabsTrigger>
                  <TabsTrigger value="completed">Finalizate ({filterByStatus('completed').length})</TabsTrigger>
                  <TabsTrigger value="cancelled">Anulate ({filterByStatus('cancelled').length})</TabsTrigger>
                </TabsList>
                <TabsContent value="all"><BookingsTable bookings={bookings} /></TabsContent>
                <TabsContent value="confirmed"><BookingsTable bookings={filterByStatus('confirmed')} /></TabsContent>
                <TabsContent value="completed"><BookingsTable bookings={filterByStatus('completed')} /></TabsContent>
                <TabsContent value="cancelled"><BookingsTable bookings={filterByStatus('cancelled')} /></TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ManageOrders;
