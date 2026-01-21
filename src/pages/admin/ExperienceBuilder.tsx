import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Plus, X, Package, Upload } from 'lucide-react';
import { uploadExperienceImageFile } from '@/lib/experienceImages';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ServiceInput {
  name: string;
  description: string;
  price: string;
  maxQuantity: string;
  isRequired: boolean;
}

const emptyService: ServiceInput = {
  name: '',
  description: '',
  price: '',
  maxQuantity: '1',
  isRequired: false,
};

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
  const [images, setImages] = useState<Array<{ url: string; file?: File | null }>>([
    { url: '' },
  ]);
  const [services, setServices] = useState<ServiceInput[]>([]);

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
    setImages([...images, { url: '' }]);
  };

  const removeImageField = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImageUrl = (index: number, value: string) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, url: value } : img)));
  };

  const updateImageFile = (index: number, file: File | null) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, file, url: img.url } : img))
    );
  };

  // Service functions
  const addService = () => {
    setServices([...services, { ...emptyService }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof ServiceInput, value: string | boolean) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
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
      const uploadedOrUrls: string[] = [];
      for (const img of images) {
        if (img.file) {
          const url = await uploadExperienceImageFile({
            experienceId: experience.id,
            file: img.file,
          });
          uploadedOrUrls.push(url);
        } else if (img.url.trim()) {
          uploadedOrUrls.push(img.url.trim());
        }
      }

      if (uploadedOrUrls.length > 0) {
        const imageRecords = uploadedOrUrls.map((url, index) => ({
          experience_id: experience.id,
          image_url: url,
          is_primary: index === 0,
          display_order: index,
        }));

        const { error: imgError } = await supabase.from('experience_images').insert(imageRecords);
        if (imgError) console.error('Error adding images:', imgError);
      }

      // Add services
      const validServices = services.filter(s => s.name.trim() && s.price);
      if (validServices.length > 0) {
        const serviceRecords = validServices.map((s, index) => ({
          experience_id: experience.id,
          name: s.name.trim(),
          description: s.description.trim() || null,
          price: parseFloat(s.price),
          max_quantity: parseInt(s.maxQuantity) || 1,
          is_required: s.isRequired,
          display_order: index,
          is_active: true,
        }));

        const { error: svcError } = await supabase
          .from('experience_services')
          .insert(serviceRecords);

        if (svcError) console.error('Error adding services:', svcError);
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
                  <SelectTrigger id="region" className="bg-background">
                    <SelectValue placeholder="Selectează regiune" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-[100]">
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
                <SelectTrigger id="category" className="bg-background">
                  <SelectValue placeholder="Selectează categorie" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
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
                    value={img.url}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                    placeholder="URL imagine (ex: https://...)"
                  />

                  <div className="flex items-center gap-2">
                    <Label
                      className="inline-flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-accent"
                      htmlFor={`img-file-${index}`}
                    >
                      <Upload className="h-4 w-4" />
                      Încarcă
                    </Label>
                    <input
                      id={`img-file-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => updateImageFile(index, e.target.files?.[0] ?? null)}
                    />
                  </div>

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

            {/* Services Section */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <Label className="text-base font-semibold">Servicii Aditionale</Label>
                    <p className="text-sm text-muted-foreground">
                      Adaugă opțiuni extra pe care clienții le pot selecta
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addService}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă Serviciu
                </Button>
              </div>

              {services.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-xl">
                  <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nu ai adăugat niciun serviciu. Clienții vor putea doar să cumpere experiența de bază.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <span className="text-sm font-medium text-muted-foreground">
                          Serviciu #{index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Șterge
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nume serviciu *</Label>
                            <Input
                              value={service.name}
                              onChange={(e) => updateService(index, 'name', e.target.value)}
                              placeholder="Ex: Fotografii profesionale"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Preț (RON) *</Label>
                            <Input
                              type="number"
                              value={service.price}
                              onChange={(e) => updateService(index, 'price', e.target.value)}
                              placeholder="150"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Descriere</Label>
                          <Input
                            value={service.description}
                            onChange={(e) => updateService(index, 'description', e.target.value)}
                            placeholder="Ex: Primești 50+ poze editate profesional"
                          />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Cantitate maximă</Label>
                            <Input
                              type="number"
                              value={service.maxQuantity}
                              onChange={(e) => updateService(index, 'maxQuantity', e.target.value)}
                              placeholder="1"
                              min="1"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <Checkbox
                              id={`required-${index}`}
                              checked={service.isRequired}
                              onCheckedChange={(checked) => updateService(index, 'isRequired', !!checked)}
                            />
                            <Label htmlFor={`required-${index}`} className="cursor-pointer">
                              Obligatoriu (inclus automat)
                            </Label>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
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
