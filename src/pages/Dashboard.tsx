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
import { Calendar, Gift, ShoppingBag, Settings, Ticket, Clock, MapPin, Users, XCircle, Edit3, AlertCircle, Shield } from 'lucide-react';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { DateCard } from '@/components/dashboard/DateCard';
import { format } from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile>({ full_name: '', email: '', phone: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Get date-fns locale based on current language
  const dateLocale = i18n.language === 'ro' ? ro : enUS;

  // Cancel booking dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Reschedule booking dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [newBookingDate, setNewBookingDate] = useState<string>('');
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
        title: t('common.error'),
        description: t('dashboard.profileUpdateError'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.save'),
        description: t('dashboard.profileUpdateSuccess'),
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
        title: t('common.error'),
        description: error?.message || t('common.error'),
        variant: 'destructive',
      });
      return;
    }

    const result = data[0];
    
    if (!result.success) {
      setCancelling(false);
      toast({
        title: t('common.error'),
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
      title: t('dashboard.bookingCancelled'),
      description: result.refund_eligible 
        ? t('dashboard.bookingCancelledRefund')
        : t('dashboard.bookingCancelledNoRefund'),
    });

    setCancelDialogOpen(false);
    setCancellationReason('');
    fetchDashboardData();
  };

  const handleRescheduleBooking = async () => {
    if (!newBookingDate) {
      toast({
        title: t('common.error'),
        description: t('dashboard.selectNewDateError'),
        variant: 'destructive',
      });
      return;
    }

    setRescheduling(true);

    const { data, error } = await supabase.rpc('reschedule_booking', {
      p_booking_id: selectedBookingId,
      p_new_booking_date: new Date(newBookingDate).toISOString(),
    });

    setRescheduling(false);

    if (error || !data || data.length === 0) {
      toast({
        title: t('common.error'),
        description: error?.message || t('common.error'),
        variant: 'destructive',
      });
      return;
    }

    const result = data[0];
    
    if (!result.success) {
      toast({
        title: t('common.error'),
        description: result.error_message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: t('dashboard.bookingRescheduled'),
      description: t('dashboard.bookingRescheduledSuccess'),
    });

    setRescheduleDialogOpen(false);
    setNewBookingDate('');
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
          <p className="text-muted-foreground">{t('common.loading')}</p>
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
            <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.activeVouchers')}</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeVouchers.length}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.readyToUse')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.upcomingBookings')}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingBookings.length}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.scheduledExperiences')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.totalOrders')}</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vouchers.length}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.allVouchers')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="vouchers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="vouchers">
                <Gift className="h-4 w-4 mr-2" />
                {t('dashboard.vouchers')}
              </TabsTrigger>
              <TabsTrigger value="bookings">
                <Calendar className="h-4 w-4 mr-2" />
                {t('dashboard.bookings')}
              </TabsTrigger>
              <TabsTrigger value="orders">
                <ShoppingBag className="h-4 w-4 mr-2" />
                {t('dashboard.orders')}
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                {t('dashboard.settings')}
              </TabsTrigger>
            </TabsList>

            {/* Vouchers Tab */}
            <TabsContent value="vouchers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.myVouchers')}</CardTitle>
                  <CardDescription>{t('dashboard.allYourVouchers')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vouchers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{t('dashboard.noVouchersYet')}</p>
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
                            <p className="text-muted-foreground">{t('dashboard.voucherCode')}</p>
                            <p className="font-mono font-semibold">{voucher.code}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('dashboard.value')}</p>
                            <p className="font-semibold">{voucher.purchase_price} RON</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('dashboard.validUntil')}</p>
                            <p className="font-semibold">
                              {format(new Date(voucher.expiry_date), 'dd MMMM yyyy', { locale: dateLocale })}
                            </p>
                          </div>
                        </div>
                        {voucher.status === 'active' && (
                          <Button 
                            className="w-full" 
                            onClick={() => navigate('/redeem-voucher')}
                          >
                            {t('dashboard.useVoucher')}
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
                  <CardTitle>{t('dashboard.myBookings')}</CardTitle>
                  <CardDescription>{t('dashboard.yourScheduled')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bookings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{t('dashboard.noBookingsYet')}</p>
                  ) : (
                    bookings.map((booking) => {
                      const canModify = canCancelOrReschedule(booking.booking_date);
                      const isUpcoming = new Date(booking.booking_date) > new Date();
                      const canReschedule = booking.rescheduled_count < 1;
                      
                      return (
                        <div key={booking.id} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Date Card */}
                            <DateCard date={booking.booking_date} showTime />
                            
                            {/* Booking Details */}
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
                                  <p className="text-muted-foreground">{t('dashboard.participants')}</p>
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <p className="font-semibold">{booking.participants}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">{t('dashboard.totalPrice')}</p>
                                  <p className="font-semibold">{booking.total_price} RON</p>
                                </div>
                              </div>
                              
                              {isUpcoming && booking.status === 'confirmed' && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {canModify && canReschedule ? (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => openRescheduleDialog(booking.id)}
                                    >
                                      <Edit3 className="h-4 w-4 mr-2" />
                                      {t('dashboard.reschedule')}
                                    </Button>
                                  ) : (
                                    !canReschedule && (
                                      <Button variant="outline" size="sm" disabled>
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        {t('dashboard.cannotModify')} ({t('dashboard.alreadyRescheduled')})
                                      </Button>
                                    )
                                  )}
                                  {canModify ? (
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => openCancelDialog(booking.id)}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      {t('dashboard.cancelBooking')}
                                    </Button>
                                  ) : (
                                    <Button variant="outline" size="sm" disabled>
                                      <AlertCircle className="h-4 w-4 mr-2" />
                                      {t('dashboard.cannotModify')} ({t('dashboard.lessThan48h')})
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
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
                  <CardTitle>{t('dashboard.orders')}</CardTitle>
                  <CardDescription>{t('dashboard.orderHistoryDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vouchers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{t('dashboard.noOrdersYet')}</p>
                  ) : (
                    vouchers.map((voucher) => (
                      <div key={voucher.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Date Card - using issue_date as purchase date */}
                          <DateCard date={voucher.expiry_date} />
                          
                          {/* Order Details */}
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
                                <p className="text-muted-foreground">{t('dashboard.voucherCode')}</p>
                                <p className="font-mono font-semibold">{voucher.code}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">{t('dashboard.orderAmount')}</p>
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

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.accountSettings')}</CardTitle>
                  <CardDescription>{t('dashboard.manageProfile')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">{t('dashboard.fullName')}</Label>
                      <Input
                        id="full-name"
                        value={profile.full_name || ''}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="Ion Popescu"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('dashboard.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email || user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        {i18n.language === 'ro' ? 'Emailul nu poate fi schimbat' : 'Email cannot be changed'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('dashboard.phone')}</Label>
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
                        {updatingProfile ? t('dashboard.updating') : t('dashboard.updateProfile')}
                      </Button>
                      <Button type="button" variant="outline" onClick={signOut}>
                        {t('dashboard.signOut')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <TwoFactorSetup />
            </TabsContent>
          </Tabs>

          {/* Cancel Booking Dialog */}
          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dashboard.cancelBookingTitle')}</DialogTitle>
                <DialogDescription>
                  {t('dashboard.cancelWarning')}
                  {!canCancelOrReschedule(bookings.find(b => b.id === selectedBookingId)?.booking_date || '') 
                    ? ` ${t('dashboard.within48h')}` 
                    : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cancellation-reason">{t('dashboard.cancellationReason')}</Label>
                  <Textarea
                    id="cancellation-reason"
                    placeholder={t('dashboard.reasonPlaceholder')}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="destructive" onClick={handleCancelBooking} disabled={cancelling}>
                  {cancelling ? t('dashboard.cancelling') : i18n.language === 'ro' ? 'Confirmă anularea' : 'Confirm cancellation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reschedule Booking Dialog */}
          <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dashboard.rescheduleTitle')}</DialogTitle>
                <DialogDescription>
                  {t('dashboard.selectNewDate')}
                  {bookings.find(b => b.id === selectedBookingId)?.rescheduled_count === 0 
                    ? (i18n.language === 'ro' ? ' Ai o singură reprogramare gratuită.' : ' You have one free reschedule.')
                    : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-date">{t('dashboard.newDate')}</Label>
                  <Input
                    id="new-date"
                    type="datetime-local"
                    value={newBookingDate}
                    onChange={(e) => setNewBookingDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {i18n.language === 'ro' 
                      ? 'Reprogramarea este posibilă doar cu minimum 48 de ore înainte de data curentă.'
                      : 'Rescheduling is only possible with minimum 48 hours notice.'}
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleRescheduleBooking} disabled={rescheduling || !newBookingDate}>
                  {rescheduling ? t('dashboard.rescheduling') : (i18n.language === 'ro' ? 'Confirmă reprogramarea' : 'Confirm reschedule')}
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
