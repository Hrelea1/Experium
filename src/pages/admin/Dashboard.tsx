import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Calendar, ShoppingBag, Users, TrendingUp, DollarSign, MapPin } from 'lucide-react';
import { DateCard } from '@/components/dashboard/DateCard';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Stats {
  totalExperiences: number;
  activeExperiences: number;
  totalBookings: number;
  upcomingBookings: number;
  totalVouchers: number;
  activeVouchers: number;
  totalUsers: number;
  totalRevenue: number;
}

interface Booking {
  id: string;
  booking_date: string;
  status: string;
  participants: number;
  total_price: number;
  user_id: string;
  experiences: {
    title: string;
    location_name: string;
  };
}

interface Voucher {
  id: string;
  code: string;
  status: string;
  purchase_price: number;
  issue_date: string;
  experiences: {
    title: string;
    location_name: string;
  };
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalExperiences: 0,
    activeExperiences: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    totalVouchers: 0,
    activeVouchers: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentVouchers, setRecentVouchers] = useState<Voucher[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch experiences stats
      const { count: totalExp } = await supabase
        .from('experiences')
        .select('*', { count: 'exact', head: true });

      const { count: activeExp } = await supabase
        .from('experiences')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch bookings stats
      const { count: totalBook } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      const { count: upcomingBook } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed')
        .gte('booking_date', new Date().toISOString());

      // Fetch vouchers stats
      const { count: totalVouch } = await supabase
        .from('vouchers')
        .select('*', { count: 'exact', head: true });

      const { count: activeVouch } = await supabase
        .from('vouchers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch profiles count as users
      const { count: totalUsr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Calculate revenue from vouchers
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('purchase_price');

      const revenue = vouchers?.reduce((sum, v) => sum + Number(v.purchase_price), 0) || 0;

      // Fetch recent bookings (last 10)
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          status,
          participants,
          total_price,
          user_id,
          experiences (
            title,
            location_name
          )
        `)
        .order('booking_date', { ascending: false })
        .limit(10);

      // Fetch recent vouchers (last 10)
      const { data: vouchersData } = await supabase
        .from('vouchers')
        .select(`
          id,
          code,
          status,
          purchase_price,
          issue_date,
          experiences (
            title,
            location_name
          )
        `)
        .order('issue_date', { ascending: false })
        .limit(10);

      setStats({
        totalExperiences: totalExp || 0,
        activeExperiences: activeExp || 0,
        totalBookings: totalBook || 0,
        upcomingBookings: upcomingBook || 0,
        totalVouchers: totalVouch || 0,
        activeVouchers: activeVouch || 0,
        totalUsers: totalUsr || 0,
        totalRevenue: revenue,
      });

      if (bookingsData) setRecentBookings(bookingsData as Booking[]);
      if (vouchersData) setRecentVouchers(vouchersData as Voucher[]);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Activ', variant: 'default' },
      used: { label: 'Folosit', variant: 'secondary' },
      expired: { label: 'Expirat', variant: 'destructive' },
      confirmed: { label: 'Confirmat', variant: 'default' },
      pending: { label: 'În așteptare', variant: 'outline' },
      cancelled: { label: 'Anulat', variant: 'destructive' },
      completed: { label: 'Finalizat', variant: 'secondary' },
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const statCards = [
    {
      title: 'Experiențe Active',
      value: stats.activeExperiences,
      total: stats.totalExperiences,
      icon: Gift,
      color: 'text-blue-600',
    },
    {
      title: 'Rezervări Viitoare',
      value: stats.upcomingBookings,
      total: stats.totalBookings,
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      title: 'Vouchere Active',
      value: stats.activeVouchers,
      total: stats.totalVouchers,
      icon: ShoppingBag,
      color: 'text-purple-600',
    },
    {
      title: 'Utilizatori Totali',
      value: stats.totalUsers,
      total: null,
      icon: Users,
      color: 'text-orange-600',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">
            Privire de ansamblu asupra platformei Experium
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-8 bg-muted rounded w-16 mt-2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    {stat.total !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        din {stat.total} total
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Card */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <CardTitle>Venituri Totale</CardTitle>
                  </div>
                  <CardDescription>Din vânzări de vouchere</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalRevenue.toFixed(2)} RON</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <CardTitle>Statistici Rapide</CardTitle>
                  </div>
                  <CardDescription>Ratele de conversie</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vouchere folosite:</span>
                      <span className="font-medium">
                        {stats.totalVouchers > 0
                          ? Math.round(((stats.totalVouchers - stats.activeVouchers) / stats.totalVouchers) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Experiențe active:</span>
                      <span className="font-medium">
                        {stats.totalExperiences > 0
                          ? Math.round((stats.activeExperiences / stats.totalExperiences) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Tabs */}
            <Tabs defaultValue="bookings" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bookings">
                  <Calendar className="h-4 w-4 mr-2" />
                  Rezervări Recente
                </TabsTrigger>
                <TabsTrigger value="orders">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Comenzi Recente
                </TabsTrigger>
              </TabsList>

              {/* Recent Bookings */}
              <TabsContent value="bookings">
                <Card>
                  <CardHeader>
                    <CardTitle>Ultimele Rezervări</CardTitle>
                    <CardDescription>Cele mai recente 10 rezervări din platformă</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentBookings.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Nu există rezervări încă</p>
                    ) : (
                      recentBookings.map((booking) => (
                        <div key={booking.id} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <DateCard date={booking.booking_date} showTime />
                            
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg truncate">{booking.experiences?.title}</h3>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{booking.experiences?.location_name}</span>
                                  </div>
                                </div>
                                {getStatusBadge(booking.status)}
                              </div>
                              
                              <Separator />
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">ID Utilizator</p>
                                  <p className="font-mono font-semibold text-xs truncate">{booking.user_id}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Participanți</p>
                                  <p className="font-semibold">{booking.participants}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Preț Total</p>
                                  <p className="font-semibold">{booking.total_price} RON</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recent Orders */}
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Ultimele Comenzi</CardTitle>
                    <CardDescription>Cele mai recente 10 comenzi de vouchere</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentVouchers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Nu există comenzi încă</p>
                    ) : (
                      recentVouchers.map((voucher) => (
                        <div key={voucher.id} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <DateCard date={voucher.issue_date} />
                            
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg truncate">{voucher.experiences?.title}</h3>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{voucher.experiences?.location_name}</span>
                                  </div>
                                </div>
                                {getStatusBadge(voucher.status)}
                              </div>
                              
                              <Separator />
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Cod Voucher</p>
                                  <p className="font-mono font-semibold text-xs">{voucher.code}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Valoare</p>
                                  <p className="font-semibold">{voucher.purchase_price} RON</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
