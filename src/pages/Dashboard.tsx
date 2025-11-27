import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Gift, ShoppingBag, Settings, Ticket, Clock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Voucher {
  id: string;
  code: string;
  status: string;
  purchase_price: number;
  expiry_date: string;
  experience_id: string;
  experiences: {
    title: string;
    location_name: string;
  };
}

interface Booking {
  id: string;
  booking_date: string;
  status: string;
  participants: number;
  total_price: number;
  experiences: {
    title: string;
    location_name: string;
  };
}

interface Profile {
  full_name: string;
  email: string;
  phone: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile>({ full_name: '', email: '', phone: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch vouchers
      const { data: vouchersData } = await supabase
        .from('vouchers')
        .select(`
          id,
          code,
          status,
          purchase_price,
          expiry_date,
          experience_id,
          experiences (
            title,
            location_name
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (vouchersData) setVouchers(vouchersData);

      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          status,
          participants,
          total_price,
          experiences (
            title,
            location_name
          )
        `)
        .eq('user_id', user?.id)
        .order('booking_date', { ascending: false });

      if (bookingsData) setBookings(bookingsData);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user?.id)
        .single();

      if (profileData) setProfile(profileData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
      })
      .eq('id', user?.id);

    setUpdatingProfile(false);

    if (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza profilul',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Profilul a fost actualizat',
      });
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

  const activeVouchers = vouchers.filter(v => v.status === 'active');
  const upcomingBookings = bookings.filter(b => 
    b.status === 'confirmed' && new Date(b.booking_date) > new Date()
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Se încarcă...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="container max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Contul meu</h1>
            <p className="text-muted-foreground">Gestionează voucherele, rezervările și setările tale</p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vouchere active</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeVouchers.length}</div>
                <p className="text-xs text-muted-foreground">Gata de folosit</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rezervări viitoare</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingBookings.length}</div>
                <p className="text-xs text-muted-foreground">Experiențe programate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total comenzi</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vouchers.length}</div>
                <p className="text-xs text-muted-foreground">Toate voucherele</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="vouchers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="vouchers">
                <Gift className="h-4 w-4 mr-2" />
                Vouchere
              </TabsTrigger>
              <TabsTrigger value="bookings">
                <Calendar className="h-4 w-4 mr-2" />
                Rezervări
              </TabsTrigger>
              <TabsTrigger value="orders">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Istoric comenzi
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Setări
              </TabsTrigger>
            </TabsList>

            {/* Vouchers Tab */}
            <TabsContent value="vouchers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Voucherele mele</CardTitle>
                  <CardDescription>Toate voucherele tale pentru experiențe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vouchers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nu ai niciun voucher încă</p>
                  ) : (
                    vouchers.map((voucher) => (
                      <div key={voucher.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{voucher.experiences?.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {voucher.experiences?.location_name}
                            </div>
                          </div>
                          {getStatusBadge(voucher.status)}
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Cod voucher</p>
                            <p className="font-mono font-semibold">{voucher.code}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valoare</p>
                            <p className="font-semibold">{voucher.purchase_price} RON</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valabil până la</p>
                            <p className="font-semibold">
                              {format(new Date(voucher.expiry_date), 'dd MMMM yyyy', { locale: ro })}
                            </p>
                          </div>
                        </div>
                        {voucher.status === 'active' && (
                          <Button 
                            className="w-full" 
                            onClick={() => navigate('/redeem-voucher')}
                          >
                            Folosește voucherul
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rezervările mele</CardTitle>
                  <CardDescription>Experiențele tale programate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bookings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nu ai nicio rezervare încă</p>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{booking.experiences?.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {booking.experiences?.location_name}
                            </div>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Data rezervării</p>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <p className="font-semibold">
                                {format(new Date(booking.booking_date), 'dd MMMM yyyy, HH:mm', { locale: ro })}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Participanți</p>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <p className="font-semibold">{booking.participants}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Preț total</p>
                            <p className="font-semibold">{booking.total_price} RON</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Istoric comenzi</CardTitle>
                  <CardDescription>Toate achizițiile tale de vouchere</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vouchers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nu ai nicio comandă încă</p>
                  ) : (
                    <div className="space-y-3">
                      {vouchers.map((voucher) => (
                        <div key={voucher.id} className="flex items-center justify-between border-b pb-3">
                          <div className="space-y-1">
                            <p className="font-medium">{voucher.experiences?.title}</p>
                            <p className="text-sm text-muted-foreground">Cod: {voucher.code}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{voucher.purchase_price} RON</p>
                            {getStatusBadge(voucher.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Setări cont</CardTitle>
                  <CardDescription>Actualizează informațiile tale personale</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Nume complet</Label>
                      <Input
                        id="full-name"
                        value={profile.full_name || ''}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="Ion Popescu"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email || user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Emailul nu poate fi schimbat</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+40 712 345 678"
                      />
                    </div>

                    <Separator />

                    <div className="flex gap-4">
                      <Button type="submit" disabled={updatingProfile}>
                        {updatingProfile ? 'Se salvează...' : 'Salvează modificările'}
                      </Button>
                      <Button type="button" variant="outline" onClick={signOut}>
                        Deconectare
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
