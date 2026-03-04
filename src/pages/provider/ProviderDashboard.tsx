import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Clock, Users, Plus, Trash2, PlusCircle, Building2, Wrench, Bell, TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RecurringAvailability } from '@/components/provider/RecurringAvailability';
import { ProviderBookings } from '@/components/provider/ProviderBookings';
import { PushNotificationSettings } from '@/components/provider/PushNotificationSettings';
import { useProviderNotifications } from '@/hooks/useProviderNotifications';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

interface AssignedExperience {
  id: string;
  experience_id: string;
  experience: {
    id: string;
    title: string;
    location_name: string;
    price: number;
    provider_type: 'accommodation' | 'service';
    duration_minutes: number | null;
    is_active: boolean | null;
  };
}

interface AvailabilitySlot {
  id: string;
  experience_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  booked_participants: number;
  is_available: boolean;
}

interface SalesBooking {
  id: string;
  booking_date: string;
  participants: number;
  total_price: number;
  status: string;
  created_at: string;
  experiences?: { title: string; location_name: string };
  user_id: string;
}

function NotificationsHistory() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useProviderNotifications();
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Istoric Notificări
          </CardTitle>
          <CardDescription>{unreadCount} necitite</CardDescription>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Marchează toate ca citite
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nicio notificare încă.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors",
                  !notif.is_read ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"
                )}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                  </div>
                  {!notif.is_read && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ro })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assignedExperiences, setAssignedExperiences] = useState<AssignedExperience[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [salesBookings, setSalesBookings] = useState<SalesBooking[]>([]);
  const [salesStats, setSalesStats] = useState({ totalSales: 0, totalRevenue: 0, totalBookings: 0 });
  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // Realtime subscription for availability
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('provider-availability')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'availability_slots' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: expData, error: expError } = await supabase
        .from('experience_providers')
        .select(`
          id, experience_id,
          experience:experiences (id, title, location_name, price, provider_type, duration_minutes, is_active)
        `)
        .eq('provider_user_id', user.id)
        .eq('is_active', true);

      if (expError) throw expError;
      setAssignedExperiences(expData || []);

      const { data: slotsData, error: slotsError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('provider_user_id', user.id)
        .gte('slot_date', new Date().toISOString().split('T')[0])
        .order('slot_date', { ascending: true });

      if (slotsError) throw slotsError;
      setAvailabilitySlots(slotsData || []);

      // Fetch sales data (bookings for provider's experiences)
      const experienceIds = (expData || []).map(e => e.experience_id);
      if (experienceIds.length > 0) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('id, booking_date, participants, total_price, status, created_at, user_id, experiences(title, location_name)')
          .in('experience_id', experienceIds)
          .order('booking_date', { ascending: false })
          .limit(100);

        const bData = bookingsData || [];
        setSalesBookings(bData as SalesBooking[]);

        const confirmed = bData.filter(b => b.status === 'confirmed' || b.status === 'completed');
        setSalesStats({
          totalSales: confirmed.length,
          totalRevenue: confirmed.reduce((sum, b) => sum + (b.total_price || 0), 0),
          totalBookings: bData.length,
        });

        // Fetch client names
        const clientIds = [...new Set(bData.map(b => b.user_id))];
        if (clientIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', clientIds);
          const map: Record<string, string> = {};
          (profiles || []).forEach(p => { map[p.id] = p.full_name || p.email; });
          setUserProfiles(map);
        }
      }
    } catch (error: any) {
      toast({ title: 'Eroare', description: 'Nu am putut încărca datele', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addAvailabilitySlot = async () => {
    if (!user || !selectedExperience || !selectedDate) {
      toast({ title: 'Date incomplete', description: 'Selectează experiența și data', variant: 'destructive' });
      return;
    }

    try {
      const exp = assignedExperiences.find(e => e.experience_id === selectedExperience);
      const { error } = await supabase
        .from('availability_slots')
        .insert({
          experience_id: selectedExperience,
          provider_user_id: user.id,
          slot_date: selectedDate.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          max_participants: maxParticipants,
          is_available: true,
          slot_type: exp?.experience?.provider_type || 'service',
        });

      if (error) throw error;
      toast({ title: 'Succes', description: 'Disponibilitatea a fost adăugată' });
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase.from('availability_slots').delete().eq('id', slotId);
      if (error) throw error;
      toast({ title: 'Șters', description: 'Disponibilitatea a fost ștearsă' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
    }
  };

  const getExperienceTitle = (experienceId: string) => {
    const exp = assignedExperiences.find(e => e.experience_id === experienceId);
    return exp?.experience?.title || 'Necunoscut';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 container">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Furnizor</h1>
              <p className="text-muted-foreground">Gestionează experiențele, disponibilitatea și rezervările</p>
            </div>
            <Button onClick={() => navigate('/provider/create')}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Experiență Nouă
            </Button>
          </div>

          <Tabs defaultValue="sales" className="space-y-6">
            <TabsList>
              <TabsTrigger value="sales">
                <TrendingUp className="h-4 w-4 mr-1" />
                Vânzări
              </TabsTrigger>
              <TabsTrigger value="experiences">Experiențe</TabsTrigger>
              <TabsTrigger value="availability">Disponibilitate</TabsTrigger>
              <TabsTrigger value="recurring">Program Recurent</TabsTrigger>
              <TabsTrigger value="bookings">Rezervări</TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-1" />
                Notificări
              </TabsTrigger>
            </TabsList>

            {/* Sales Overview Tab */}
            <TabsContent value="sales">
              <div className="grid sm:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Experiențe Vândute</p>
                        <p className="text-2xl font-bold">{salesStats.totalSales}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <CalendarDays className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Rezervări</p>
                        <p className="text-2xl font-bold">{salesStats.totalBookings}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Venit Total</p>
                        <p className="text-2xl font-bold">{salesStats.totalRevenue.toLocaleString()} Lei</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Istoric Rezervări</CardTitle>
                  <CardDescription>Toate rezervările pentru experiențele tale</CardDescription>
                </CardHeader>
                <CardContent>
                  {salesBookings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nicio rezervare încă.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Experiență</TableHead>
                          <TableHead>Data Rezervării</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Valoare</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesBookings.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.experiences?.title || 'N/A'}</TableCell>
                            <TableCell>{format(new Date(b.booking_date), 'dd MMM yyyy', { locale: ro })}</TableCell>
                            <TableCell>{userProfiles[b.user_id] || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                b.status === 'confirmed' ? 'default' :
                                b.status === 'completed' ? 'secondary' :
                                b.status === 'cancelled' ? 'destructive' : 'outline'
                              }>
                                {b.status === 'confirmed' ? 'Confirmată' :
                                 b.status === 'completed' ? 'Finalizată' :
                                 b.status === 'cancelled' ? 'Anulată' : 'În așteptare'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{b.total_price} Lei</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Experiences Tab */}
            <TabsContent value="experiences">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedExperiences.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground mb-4">Nu ai experiențe încă.</p>
                      <Button onClick={() => navigate('/provider/create')}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Creează Prima Experiență
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  assignedExperiences.map((exp) => (
                    <Card key={exp.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{exp.experience?.title}</h4>
                          <Badge variant={exp.experience?.is_active ? 'default' : 'secondary'}>
                            {exp.experience?.is_active ? 'Activ' : 'Inactiv'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{exp.experience?.location_name}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge variant="outline" className="flex items-center gap-1">
                            {exp.experience?.provider_type === 'accommodation' ? (
                              <><Building2 className="h-3 w-3" /> Cazare</>
                            ) : (
                              <><Wrench className="h-3 w-3" /> Serviciu</>
                            )}
                          </Badge>
                          {exp.experience?.duration_minutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(exp.experience.duration_minutes / 60)}h {exp.experience.duration_minutes % 60}m
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-primary mt-3">{exp.experience?.price} Lei</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Disponibilitate
                    </CardTitle>
                    <CardDescription>Sloturi individuale de disponibilitate</CardDescription>
                  </div>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={assignedExperiences.length === 0}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adaugă Slot
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adaugă Disponibilitate</DialogTitle>
                        <DialogDescription>Setează un nou slot de disponibilitate</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Experiență</Label>
                          <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                            <SelectTrigger><SelectValue placeholder="Selectează experiența" /></SelectTrigger>
                            <SelectContent>
                              {assignedExperiences.map((exp) => (
                                <SelectItem key={exp.experience_id} value={exp.experience_id}>
                                  {exp.experience?.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Data</Label>
                          <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => date < new Date()} className="rounded-md border" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Ora început</Label>
                            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Ora sfârșit</Label>
                            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Participanți maximi</Label>
                          <Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(parseInt(e.target.value))} min={1} max={100} />
                        </div>
                        <Button onClick={addAvailabilitySlot} className="w-full">Adaugă Disponibilitate</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {availabilitySlots.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nu ai setat disponibilități încă.</p>
                  ) : (
                    <div className="space-y-3">
                      {availabilitySlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div>
                            <h4 className="font-medium">{getExperienceTitle(slot.experience_id)}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-4 w-4" />
                                {new Date(slot.slot_date).toLocaleDateString('ro-RO')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {slot.start_time} - {slot.end_time}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {slot.booked_participants}/{slot.max_participants}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={slot.is_available ? 'default' : 'secondary'}>
                              {slot.is_available ? 'Disponibil' : 'Plin'}
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={() => deleteSlot(slot.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recurring Tab */}
            <TabsContent value="recurring">
              {assignedExperiences.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">Creează o experiență mai întâi pentru a seta recurența.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {assignedExperiences.map((exp) => (
                    <RecurringAvailability
                      key={exp.experience_id}
                      experienceId={exp.experience_id}
                      experienceTitle={exp.experience?.title || ''}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <ProviderBookings />
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <div className="space-y-6">
                <PushNotificationSettings />
                <NotificationsHistory />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
