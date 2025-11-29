import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, CheckCircle, XCircle, Clock, Gift, Ban, Edit } from 'lucide-react';
import { format } from 'date-fns';

interface Booking {
  id: string;
  booking_date: string;
  participants: number;
  status: string;
  total_price: number;
  special_requests?: string;
  created_at: string;
  experiences?: {
    title: string;
    location_name: string;
  };
  vouchers?: {
    code: string;
  };
}

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  
  // Change date dialog
  const [changeDateDialogOpen, setChangeDateDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [changingDate, setChangingDate] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          experiences (
            title,
            location_name
          ),
          vouchers (
            code
          )
        `)
        .eq('user_id', user?.id)
        .order('booking_date', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { label: 'Confirmată', variant: 'default' as const, icon: CheckCircle },
      pending: { label: 'În așteptare', variant: 'secondary' as const, icon: Clock },
      cancelled: { label: 'Anulată', variant: 'destructive' as const, icon: XCircle },
      completed: { label: 'Finalizată', variant: 'outline' as const, icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filterBookingsByStatus = (statuses: string[]) => {
    return bookings.filter((b) => statuses.includes(b.status));
  };

  const isUpcoming = (booking: Booking) => {
    return new Date(booking.booking_date) > new Date() && booking.status === 'confirmed';
  };

  const upcomingBookings = bookings.filter(isUpcoming);

  const handleCancelClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setCancellationReason('');
    setCancelDialogOpen(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingId || !cancellationReason.trim()) {
      toast({
        title: 'Eroare',
        description: 'Te rog să introduci un motiv pentru anulare',
        variant: 'destructive',
      });
      return;
    }

    setCancelling(true);

    try {
      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: selectedBookingId,
        p_cancellation_reason: cancellationReason,
      });

      if (error) throw error;

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
        title: 'Rezervare anulată',
        description: result.refund_eligible 
          ? 'Rezervarea a fost anulată. Ești eligibil pentru rambursare.'
          : 'Rezervarea a fost anulată.',
      });

      setCancelDialogOpen(false);
      setCancellationReason('');
      fetchBookings();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu am putut anula rezervarea',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleChangeDateClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setNewDate('');
    setChangeDateDialogOpen(true);
  };

  const handleChangeDate = async () => {
    if (!selectedBookingId || !newDate) {
      toast({
        title: 'Eroare',
        description: 'Te rog să selectezi o dată nouă',
        variant: 'destructive',
      });
      return;
    }

    setChangingDate(true);

    try {
      const { data, error } = await supabase.rpc('reschedule_booking', {
        p_booking_id: selectedBookingId,
        p_new_booking_date: new Date(newDate).toISOString(),
      });

      if (error) throw error;

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
        title: 'Data schimbată',
        description: 'Rezervarea a fost reprogramată cu succes',
      });

      setChangeDateDialogOpen(false);
      setNewDate('');
      fetchBookings();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu am putut schimba data',
        variant: 'destructive',
      });
    } finally {
      setChangingDate(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Se încarcă rezervările...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Rezervările Mele</h1>
            <p className="text-muted-foreground">
              Vezi și gestionează toate rezervările tale
            </p>
          </div>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="upcoming">
                Viitoare ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                Toate ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Finalizate ({filterBookingsByStatus(['completed']).length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Anulate ({filterBookingsByStatus(['cancelled']).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <BookingGrid 
                bookings={upcomingBookings} 
                getStatusBadge={getStatusBadge}
                onCancelClick={handleCancelClick}
                onChangeDateClick={handleChangeDateClick}
              />
            </TabsContent>

            <TabsContent value="all">
              <BookingGrid 
                bookings={bookings} 
                getStatusBadge={getStatusBadge}
                onCancelClick={handleCancelClick}
                onChangeDateClick={handleChangeDateClick}
              />
            </TabsContent>

            <TabsContent value="completed">
              <BookingGrid 
                bookings={filterBookingsByStatus(['completed'])} 
                getStatusBadge={getStatusBadge}
                onCancelClick={handleCancelClick}
                onChangeDateClick={handleChangeDateClick}
              />
            </TabsContent>

            <TabsContent value="cancelled">
              <BookingGrid 
                bookings={filterBookingsByStatus(['cancelled'])} 
                getStatusBadge={getStatusBadge}
                onCancelClick={handleCancelClick}
                onChangeDateClick={handleChangeDateClick}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anulează Rezervarea</DialogTitle>
            <DialogDescription>
              Te rog să ne spui de ce dorești să anulezi această rezervare
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motiv anulare *</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Program schimbat, altă prioritate..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Înapoi
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelBooking} 
              disabled={cancelling || !cancellationReason.trim()}
            >
              {cancelling ? 'Se anulează...' : 'Confirmă Anularea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Date Dialog */}
      <Dialog open={changeDateDialogOpen} onOpenChange={setChangeDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schimbă Data Rezervării</DialogTitle>
            <DialogDescription>
              Selectează o dată nouă pentru această rezervare
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-date">Data nouă *</Label>
              <Input
                id="new-date"
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeDateDialogOpen(false)}>
              Anulează
            </Button>
            <Button 
              onClick={handleChangeDate} 
              disabled={changingDate || !newDate}
            >
              {changingDate ? 'Se salvează...' : 'Salvează Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface BookingGridProps {
  bookings: Booking[];
  getStatusBadge: (status: string) => React.ReactNode;
  onCancelClick?: (bookingId: string) => void;
  onChangeDateClick?: (bookingId: string) => void;
}

const BookingGrid = ({ bookings, getStatusBadge, onCancelClick, onChangeDateClick }: BookingGridProps) => {
  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nu ai rezervări în această categorie
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {bookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-start justify-between mb-2">
              <CardTitle className="text-lg">
                {booking.experiences?.title || 'Experiență'}
              </CardTitle>
              {getStatusBadge(booking.status)}
            </div>
            <CardDescription>
              {booking.experiences?.location_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Booking Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(booking.booking_date), 'PPP', { locale: undefined })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{booking.participants} participanți</span>
                </div>
                {booking.vouchers && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Gift className="h-4 w-4" />
                    <span className="font-mono text-xs">{booking.vouchers.code}</span>
                  </div>
                )}
              </div>

              {/* Special Requests */}
              {booking.special_requests && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Cerințe speciale:</p>
                  <p className="text-sm">{booking.special_requests}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t space-y-2">
                {booking.status === 'confirmed' && new Date(booking.booking_date) > new Date() && onCancelClick && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={() => onCancelClick(booking.id)}
                  >
                    <Ban className="h-4 w-4" />
                    Anulează Rezervarea
                  </Button>
                )}
                
                {booking.status === 'cancelled' && onChangeDateClick && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={() => onChangeDateClick(booking.id)}
                  >
                    <Edit className="h-4 w-4" />
                    Schimbă Data
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyBookings;
