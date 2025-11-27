import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Calendar, ShoppingBag, Users, TrendingUp, DollarSign } from 'lucide-react';

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
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
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
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
