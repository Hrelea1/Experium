import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Upload, Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ExperienceBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [duration, setDuration] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [minAge, setMinAge] = useState('');
  const [images, setImages] = useState<string[]>(['']);

  useEffect(() => {
    fetchCategories();
    fetchRegions();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    setCategories(data || []);
  };

  const fetchRegions = async () => {
    const { data } = await supabase.from('regions').select('id, name').order('name');
    setRegions(data || []);
  };

  const addImageField = () => {
    setImages([...images, '']);
  };

  const removeImageField = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const createExperience = async () => {
    if (!title || !description || !locationName || !price || !categoryId || !regionId) {
      toast({
        title: 'Eroare',
        description: 'Completează toate câmpurile obligatorii',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      // Create voucher
      const { data: experience, error: expError } = await supabase
        .from('experiences')
        .insert({
          title,
          description,
          short_description: shortDescription || null,
          location_name: locationName,
          price: parseFloat(price),
          original_price: originalPrice ? parseFloat(originalPrice) : null,
          category_id: categoryId,
          region_id: regionId,
          duration_minutes: duration ? parseInt(duration) : null,
          max_participants: parseInt(maxParticipants),
          min_age: minAge ? parseInt(minAge) : null,
          is_active: true,
          is_featured: false,
        })
        .select()
        .single();

      if (expError) throw expError;

      // Add images
      const validImages = images.filter(img => img.trim());
      if (validImages.length > 0) {
        const imageRecords = validImages.map((url, index) => ({
          experience_id: experience.id,
          image_url: url,
          is_primary: index === 0,
          display_order: index,
        }));

        const { error: imgError } = await supabase
          .from('experience_images')
          .insert(imageRecords);

        if (imgError) console.error('Error adding images:', imgError);
      }

      toast({
        title: 'Succes!',
        description: 'Experiența a fost creată',
      });

      navigate('/admin/experiences');
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message || 'Nu am putut crea experiența',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Creare Experiență</h2>
            <p className="text-muted-foreground">
              Construiește o experiență nouă pas cu pas
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/experiences')}>
            Anulează
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Detalii Experiență</CardTitle>
                <CardDescription>Completează informațiile de bază</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titlu *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Zbor cu parapanta în Brașov"
              />
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label htmlFor="short-desc">Descriere Scurtă</Label>
              <Input
                id="short-desc"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Ex: O aventură deasupra orașu!"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descriere Completă *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrie experiența în detaliu..."
                rows={6}
              />
            </div>

            {/* Location & Category */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Locație *</Label>
                <Input
                  id="location"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ex: Brașov, Transilvania"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Regiune *</Label>
                <Select value={regionId} onValueChange={setRegionId}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Selectează regiune" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Categorie *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selectează categorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pricing */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Preț (RON) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="299"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="original-price">Preț Original (RON)</Label>
                <Input
                  id="original-price"
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="399"
                  step="0.01"
                />
              </div>
            </div>

            {/* Duration & Participants */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="duration">Durată (minute)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="120"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-participants">Participanți Max</Label>
                <Input
                  id="max-participants"
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-age">Vârstă Minimă</Label>
                <Input
                  id="min-age"
                  type="number"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  placeholder="18"
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Imagini</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addImageField}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă Imagine
                </Button>
              </div>
              {images.map((img, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={img}
                    onChange={(e) => updateImage(index, e.target.value)}
                    placeholder="URL imagine (ex: https://...)"
                  />
                  {images.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImageField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/experiences')}
              >
                Anulează
              </Button>
              <Button onClick={createExperience} disabled={creating}>
                {creating ? 'Se creează...' : 'Creează Experiență'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ExperienceBuilder;
