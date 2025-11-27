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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Gift, ShoppingBag, Settings, Ticket, Clock, MapPin, Users, XCircle, Edit3, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  rescheduled_count: number;
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

  // Cancel booking dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Reschedule booking dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [newBookingDate, setNewBookingDate] = useState<Date>();
  const [rescheduling, setRescheduling] = useState(false);

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
          rescheduled_count,
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

  const handleCancelBooking = async () => {
    setCancelling(true);

    const { data, error } = await supabase.rpc('cancel_booking', {
      p_booking_id: selectedBookingId,
      p_cancellation_reason: cancellationReason,
    });

    if (error || !data || data.length === 0) {
      setCancelling(false);
      toast({
        title: 'Eroare',
        description: error?.message || 'Nu s-a putut anula rezervarea',
        variant: 'destructive',
      });
      return;
    }

    const result = data[0];
    
    if (!result.success) {
      setCancelling(false);
      toast({
        title: 'Eroare',
        description: result.error_message,
        variant: 'destructive',
      });
      return;
    }

    // Send cancellation confirmation email
    try {
      await supabase.functions.invoke('send-cancellation-confirmation', {
        body: {
          bookingId: selectedBookingId,
          refundEligible: result.refund_eligible,
        },
      });
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    setCancelling(false);
    toast({
      title: 'Rezervare anulată',
      description: result.refund_eligible 
        ? 'Rezervarea a fost anulată cu succes. Vei primi un refund.' 
        : 'Rezervarea a fost anulată. Nu ești eligibil pentru refund (anulare sub 48h).',
    });

    setCancelDialogOpen(false);
    setCancellationReason('');
    fetchDashboardData();
  };

  const handleRescheduleBooking = async () => {
    if (!newBookingDate) {
      toast({
        title: 'Eroare',
        description: 'Te rog selectează o dată nouă',
        variant: 'destructive',
      });
      return;
    }

    setRescheduling(true);

    const { data, error } = await supabase.rpc('reschedule_booking', {
      p_booking_id: selectedBookingId,
      p_new_booking_date: newBookingDate.toISOString(),
    });

    setRescheduling(false);

    if (error || !data || data.length === 0) {
      toast({
        title: 'Eroare',
        description: error?.message || 'Nu s-a putut reprograma rezervarea',
        variant: 'destructive',
      });
      return;
    }

    const result = data[0];
    
    if (!result.success) {
      toast({
        title: 'Eroare',
        description: result.error_message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Rezervare reprogramată',
      description: 'Rezervarea a fost reprogramată cu succes',
    });

    setRescheduleDialogOpen(false);
    setNewBookingDate(undefined);
    fetchDashboardData();
  };

  const openCancelDialog = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setCancelDialogOpen(true);
  };

  const openRescheduleDialog = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setRescheduleDialogOpen(true);
  };

  const canCancelOrReschedule = (bookingDate: string) => {
    const hoursUntil = (new Date(bookingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    return hoursUntil >= 48;
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
                    bookings.map((booking) => {
                      const canModify = canCancelOrReschedule(booking.booking_date);
                      const isUpcoming = new Date(booking.booking_date) > new Date();
                      const canReschedule = booking.rescheduled_count < 1;
                      
                      return (
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
                            {booking.rescheduled_count > 0 && (
                              <div>
                                <p className="text-muted-foreground">Reprogramări</p>
                                <p className="font-semibold">{booking.rescheduled_count}/1</p>
                              </div>
                            )}
                          </div>
                          
                          {booking.status === 'confirmed' && isUpcoming && (
                            <>
                              {!canModify && (
                                <Alert>
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    Anularea și reprogramarea sunt posibile doar cu minimum 48 de ore înainte.
                                  </AlertDescription>
                                </Alert>
                              )}
                              <div className="flex gap-2">
                                {canModify && canReschedule && (
                                  <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => openRescheduleDialog(booking.id)}
                                  >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Reprogramează
                                  </Button>
                                )}
                                {!canReschedule && (
                                  <div className="flex-1 text-center text-sm text-muted-foreground py-2">
                                    Limită reprogramări atinsă
                                  </div>
                                )}
                                {canModify && (
                                  <Button 
                                    variant="destructive" 
                                    className="flex-1"
                                    onClick={() => openCancelDialog(booking.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Anulează
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
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

          {/* Cancel Booking Dialog */}
          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Anulează rezervarea</DialogTitle>
                <DialogDescription>
                  Ești sigur că vrei să anulezi această rezervare? 
                  {canCancelOrReschedule(bookings.find(b => b.id === selectedBookingId)?.booking_date || '') 
                    ? ' Vei primi un refund complet.' 
                    : ' Nu vei fi eligibil pentru refund (anulare sub 48h).'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cancellation-reason">Motiv anulare (opțional)</Label>
                  <Textarea
                    id="cancellation-reason"
                    placeholder="De ce anulezi rezervarea?"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                  Renunță
                </Button>
                <Button variant="destructive" onClick={handleCancelBooking} disabled={cancelling}>
                  {cancelling ? 'Se anulează...' : 'Confirmă anularea'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reschedule Booking Dialog */}
          <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reprogramează rezervarea</DialogTitle>
                <DialogDescription>
                  Selectează o nouă dată pentru experiența ta. 
                  {bookings.find(b => b.id === selectedBookingId)?.rescheduled_count === 0 
                    ? ' Ai o singură reprogramare gratuită.' 
                    : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Data nouă</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newBookingDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newBookingDate ? format(newBookingDate, "PPP", { locale: ro }) : "Selectează data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newBookingDate}
                        onSelect={setNewBookingDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Reprogramarea este posibilă doar cu minimum 48 de ore înainte de data curentă.
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
                  Renunță
                </Button>
                <Button onClick={handleRescheduleBooking} disabled={rescheduling || !newBookingDate}>
                  {rescheduling ? 'Se reprogramează...' : 'Confirmă reprogramarea'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
