import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Clock, Users, Plus, Trash2, Image } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AssignedExperience {
  id: string;
  experience_id: string;
  experience: {
    id: string;
    title: string;
    location_name: string;
    price: number;
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

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignedExperiences, setAssignedExperiences] = useState<AssignedExperience[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch assigned experiences
      const { data: expData, error: expError } = await supabase
        .from('experience_providers')
        .select(`
          id,
          experience_id,
          experience:experiences (
            id,
            title,
            location_name,
            price
          )
        `)
        .eq('provider_user_id', user.id)
        .eq('is_active', true);

      if (expError) throw expError;
      setAssignedExperiences(expData || []);

      // Fetch availability slots
      const { data: slotsData, error: slotsError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('provider_user_id', user.id)
        .gte('slot_date', new Date().toISOString().split('T')[0])
        .order('slot_date', { ascending: true });

      if (slotsError) throw slotsError;
      setAvailabilitySlots(slotsData || []);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu am putut încărca datele',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addAvailabilitySlot = async () => {
    if (!user || !selectedExperience || !selectedDate) {
      toast({
        title: 'Date incomplete',
        description: 'Selectează experiența și data',
        variant: 'destructive',
      });
      return;
    }

    try {
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
        });

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Disponibilitatea a fost adăugată',
      });

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: 'Șters',
        description: 'Disponibilitatea a fost ștearsă',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message,
        variant: 'destructive',
      });
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Dashboard Furnizor</h1>
            <p className="text-muted-foreground">
              Gestionează disponibilitatea și experiențele tale
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Assigned Experiences */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Experiențe Asignate
                </CardTitle>
                <CardDescription>
                  Experiențele pe care le gestionezi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignedExperiences.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nu ai experiențe asignate încă.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {assignedExperiences.map((exp) => (
                      <div key={exp.id} className="p-3 rounded-lg border">
                        <h4 className="font-medium">{exp.experience?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exp.experience?.location_name}
                        </p>
                        <p className="text-sm font-medium text-primary">
                          {exp.experience?.price} Lei
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability Management */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Disponibilitate
                  </CardTitle>
                  <CardDescription>
                    Programul tău de disponibilitate
                  </CardDescription>
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
                      <DialogDescription>
                        Setează un nou slot de disponibilitate
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Experiență</Label>
                        <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează experiența" />
                          </SelectTrigger>
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
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ora început</Label>
                          <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ora sfârșit</Label>
                          <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Participanți maximi</Label>
                        <Input
                          type="number"
                          value={maxParticipants}
                          onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                          min={1}
                          max={100}
                        />
                      </div>

                      <Button onClick={addAvailabilitySlot} className="w-full">
                        Adaugă Disponibilitate
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {availabilitySlots.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nu ai setat disponibilități încă.
                  </p>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSlot(slot.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
