import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Building2, Wrench } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
}

export default function CreateExperience() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState('');
  const [providerType, setProviderType] = useState<'accommodation' | 'service'>('service');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [locationName, setLocationName] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    const [catRes, regRes] = await Promise.all([
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('regions').select('id, name').order('name'),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (regRes.data) setRegions(regRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title || !description || !price || !categoryId || !regionId || !locationName) {
      toast({ title: 'Date incomplete', description: 'Completează toate câmpurile obligatorii', variant: 'destructive' });
      return;
    }

    if (providerType === 'service' && !durationMinutes) {
      toast({ title: 'Durată obligatorie', description: 'Pentru tip serviciu, durata este obligatorie', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Create experience
      const { data: expData, error: expError } = await supabase
        .from('experiences')
        .insert({
          title,
          description,
          short_description: shortDescription || null,
          price: parseFloat(price),
          provider_type: providerType,
          duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
          max_participants: parseInt(maxParticipants) || 10,
          category_id: categoryId,
          region_id: regionId,
          location_name: locationName,
          cancellation_policy: cancellationPolicy || null,
          is_active: false, // Starts inactive, admin can activate
        })
        .select()
        .single();

      if (expError) throw expError;

      // Auto-assign provider to this experience
      const { error: assignError } = await supabase
        .from('experience_providers')
        .insert({
          experience_id: expData.id,
          provider_user_id: user.id,
          assigned_by: user.id,
          is_active: true,
        });

      if (assignError) throw assignError;

      toast({ title: 'Experiență creată!', description: 'Experiența a fost trimisă spre aprobare.' });
      navigate('/provider');
    } catch (error: any) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container max-w-2xl">
          <Button variant="ghost" onClick={() => navigate('/provider')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Creează Experiență Nouă</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Titlu *</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Tur cu barca pe Dunăre" />
                </div>

                {/* Provider Type */}
                <div className="space-y-2">
                  <Label>Tip furnizor *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProviderType('service')}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        providerType === 'service' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <Wrench className="h-5 w-5 mb-2 text-primary" />
                      <p className="font-medium">Serviciu</p>
                      <p className="text-xs text-muted-foreground">Disponibilitate pe ore</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProviderType('accommodation')}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        providerType === 'accommodation' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <Building2 className="h-5 w-5 mb-2 text-primary" />
                      <p className="font-medium">Cazare</p>
                      <p className="text-xs text-muted-foreground">Disponibilitate pe nopți</p>
                    </button>
                  </div>
                </div>

                {/* Duration (required for service) */}
                {providerType === 'service' && (
                  <div className="space-y-2">
                    <Label htmlFor="duration">Durată (minute) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      placeholder="Ex: 150 (pentru 2h 30m)"
                      min={15}
                      step={15}
                    />
                    {durationMinutes && (
                      <p className="text-xs text-muted-foreground">
                        = {Math.floor(parseInt(durationMinutes) / 60)}h {parseInt(durationMinutes) % 60}m
                      </p>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descriere *</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Descrie experiența în detaliu..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDesc">Descriere scurtă</Label>
                  <Input id="shortDesc" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Max 160 caractere" maxLength={160} />
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Preț (Lei) *</Label>
                  <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex: 250" min={1} step={0.01} />
                </div>

                {/* Category & Region */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categorie *</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Regiune *</Label>
                    <Select value={regionId} onValueChange={setRegionId}>
                      <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Locație *</Label>
                  <Input id="location" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Ex: Tulcea, Delta Dunării" />
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <Label htmlFor="maxPart">Capacitate maximă</Label>
                  <Input id="maxPart" type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} min={1} max={500} />
                </div>

                {/* Cancellation policy */}
                <div className="space-y-2">
                  <Label htmlFor="cancel">Politică anulare (opțional)</Label>
                  <Textarea id="cancel" value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} rows={3} placeholder="Ex: Anulare gratuită cu 48h înainte" />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/provider')}>
                    Anulează
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Se salvează...' : 'Creează Experiență'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
