import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, RefreshCw, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const DAYS_OF_WEEK = [
  { value: '1', label: 'Luni' },
  { value: '2', label: 'Marți' },
  { value: '3', label: 'Miercuri' },
  { value: '4', label: 'Joi' },
  { value: '5', label: 'Vineri' },
  { value: '6', label: 'Sâmbătă' },
  { value: '0', label: 'Duminică' },
];

interface RecurringSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_participants: number;
  is_active: boolean;
}

interface Props {
  experienceId: string;
  experienceTitle: string;
}

export function RecurringAvailability({ experienceId, experienceTitle }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState<RecurringSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [maxParticipants, setMaxParticipants] = useState(10);

  useEffect(() => {
    fetchSlots();
  }, [experienceId]);

  const fetchSlots = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('provider_recurring_availability')
      .select('*')
      .eq('experience_id', experienceId)
      .order('day_of_week');

    if (!error && data) setSlots(data);
    setLoading(false);
  };

  const addRecurring = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('provider_recurring_availability')
      .insert({
        experience_id: experienceId,
        provider_user_id: user.id,
        day_of_week: parseInt(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        max_participants: maxParticipants,
      });

    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Adăugat', description: 'Recurența a fost adăugată' });
    setDialogOpen(false);
    fetchSlots();
  };

  const deleteRecurring = async (id: string) => {
    const { error } = await supabase
      .from('provider_recurring_availability')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Șters', description: 'Recurența a fost eliminată' });
    fetchSlots();
  };

  const generateSlots = async () => {
    if (!user) return;
    setGenerating(true);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Generate for next 30 days

    const { data, error } = await supabase.rpc('generate_slots_from_recurring', {
      p_experience_id: experienceId,
      p_provider_user_id: user.id,
      p_start_date: startDate.toISOString().split('T')[0],
      p_end_date: endDate.toISOString().split('T')[0],
    });

    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Generat!', description: `Au fost generate sloturi pentru următoarele 30 de zile` });
    }

    setGenerating(false);
  };

  const getDayLabel = (day: number) => DAYS_OF_WEEK.find(d => parseInt(d.value) === day)?.label || '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Recurență - {experienceTitle}
          </CardTitle>
          <CardDescription>Program recurent săptămânal</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateSlots} disabled={generating || slots.length === 0}>
            <RefreshCw className={`h-4 w-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
            Generează 30 zile
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Adaugă</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adaugă Program Recurent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Ziua</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(parseInt(e.target.value))} min={1} />
                </div>
                <Button onClick={addRecurring} className="w-full">Adaugă Recurență</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : slots.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nu ai setat program recurent. Adaugă zilele și orele disponibile.
          </p>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{getDayLabel(slot.day_of_week)}</Badge>
                  <span className="text-sm font-medium">
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    max {slot.max_participants} pers.
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteRecurring(slot.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
