import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { uploadExperienceImageFile } from "@/lib/experienceImages";
import { FocalPointPicker } from "@/components/admin/FocalPointPicker";
import { ExperienceImage } from "@/components/ExperienceImage";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

type CategoryOption = { id: string; name: string };
type RegionOption = { id: string; name: string };

type ExperienceRow = {
  id: string;
  title: string;
  description: string;
  short_description: string | null;
  includes: string[];
  location_name: string;
  price: number;
  original_price: number | null;
  category_id: string;
  region_id: string;
  duration_minutes: number | null;
  max_participants: number | null;
  min_age: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
};

type ExperienceImageRow = {
  id: string;
  image_url: string;
  is_primary: boolean | null;
  display_order: number | null;
  focal_x: number;
  focal_y: number;
};

type ExperienceServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_required: boolean;
  max_quantity: number;
  is_active: boolean;
  display_order: number;
};

type ImageDraft = {
  id?: string;
  clientId: string;
  image_url: string;
  is_primary: boolean;
  focal_x: number;
  focal_y: number;
};

type ServiceDraft = {
  id?: string;
  clientId: string;
  name: string;
  description: string;
  price: string;
  is_required: boolean;
  max_quantity: string;
  is_active: boolean;
};

const newClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function normalizeNumberInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function isEqualNullableNumber(a: number | null, b: number | null) {
  return (a ?? null) === (b ?? null);
}

function normalizeIncludes(items: string[]) {
  return items
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

function isEqualStringArray(a: string[] | null | undefined, b: string[] | null | undefined) {
  const aa = a ?? [];
  const bb = b ?? [];
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return false;
  return true;
}

export default function EditExperience() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [regions, setRegions] = useState<RegionOption[]>([]);

  const [originalExperience, setOriginalExperience] = useState<ExperienceRow | null>(null);
  const [originalImages, setOriginalImages] = useState<ExperienceImageRow[]>([]);
  const [originalServices, setOriginalServices] = useState<ExperienceServiceRow[]>([]);

  // Experience form state
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [regionId, setRegionId] = useState<string>("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [minAge, setMinAge] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [includes, setIncludes] = useState<string[]>([]);

  const [thumbPreset, setThumbPreset] = useState<"square" | "wide" | "classic">("wide");

  const thumbRatio = useMemo(() => {
    switch (thumbPreset) {
      case "square":
        return 1;
      case "classic":
        return 4 / 3;
      case "wide":
      default:
        return 16 / 9;
    }
  }, [thumbPreset]);

  const [images, setImages] = useState<ImageDraft[]>([]);
  const [services, setServices] = useState<ServiceDraft[]>([]);

  const canSave = useMemo(() => {
    if (!id) return false;
    if (!title.trim()) return false;
    if (!description.trim()) return false;
    if (!locationName.trim()) return false;
    if (!categoryId) return false;
    if (!regionId) return false;
    const p = normalizeNumberInput(price);
    if (p === null || p < 0) return false;
    return true;
  }, [id, title, description, locationName, categoryId, regionId, price]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const [expRes, imgRes, svcRes, catRes, regRes] = await Promise.all([
          supabase
            .from("experiences")
            .select(
              "id,title,description,short_description,includes,location_name,price,original_price,category_id,region_id,duration_minutes,max_participants,min_age,is_active,is_featured"
            )
            .eq("id", id)
            .maybeSingle(),
          supabase
            .from("experience_images")
            .select("id,image_url,is_primary,display_order,focal_x,focal_y")
            .eq("experience_id", id)
            .order("display_order", { ascending: true }),
          supabase
            .from("experience_services")
            .select(
              "id,name,description,price,is_required,max_quantity,is_active,display_order"
            )
            .eq("experience_id", id)
            .order("display_order", { ascending: true }),
          supabase
            .from("categories")
            .select("id,name")
            .order("display_order", { ascending: true }),
          supabase
            .from("regions")
            .select("id,name")
            .order("display_order", { ascending: true }),
        ]);

        if (expRes.error) throw expRes.error;
        if (!expRes.data) throw new Error("Experiența nu a fost găsită");
        if (imgRes.error) throw imgRes.error;
        if (svcRes.error) throw svcRes.error;
        if (catRes.error) throw catRes.error;
        if (regRes.error) throw regRes.error;

        const exp = expRes.data as ExperienceRow;
        const imgs = (imgRes.data ?? []) as unknown as ExperienceImageRow[];
        const svcs = (svcRes.data ?? []) as unknown as ExperienceServiceRow[];

        setOriginalExperience(exp);
        setOriginalImages(imgs);
        setOriginalServices(svcs);
        setCategories((catRes.data ?? []) as CategoryOption[]);
        setRegions((regRes.data ?? []) as RegionOption[]);

        // hydrate form state
        setTitle(exp.title ?? "");
        setShortDescription(exp.short_description ?? "");
        setDescription(exp.description ?? "");
        setIncludes(Array.isArray(exp.includes) ? exp.includes : []);
        setLocationName(exp.location_name ?? "");
        setCategoryId(exp.category_id ?? "");
        setRegionId(exp.region_id ?? "");
        setPrice(exp.price?.toString?.() ?? "");
        setOriginalPrice(exp.original_price?.toString?.() ?? "");
        setDurationMinutes(exp.duration_minutes?.toString?.() ?? "");
        setMaxParticipants(exp.max_participants?.toString?.() ?? "");
        setMinAge(exp.min_age?.toString?.() ?? "");
        setIsActive(exp.is_active ?? true);
        setIsFeatured(exp.is_featured ?? false);

        const draftImages: ImageDraft[] = imgs.map((i) => ({
          id: i.id,
          clientId: i.id,
          image_url: i.image_url,
          is_primary: Boolean(i.is_primary),
          focal_x: (i as any).focal_x ?? 50,
          focal_y: (i as any).focal_y ?? 50,
        }));
        // Ensure exactly one primary (if any images exist)
        if (draftImages.length > 0 && !draftImages.some((x) => x.is_primary)) {
          draftImages[0].is_primary = true;
        }
        setImages(draftImages);

        const draftServices: ServiceDraft[] = svcs.map((s) => ({
          id: s.id,
          clientId: s.id,
          name: s.name,
          description: s.description ?? "",
          price: s.price?.toString?.() ?? "0",
          is_required: s.is_required,
          max_quantity: s.max_quantity?.toString?.() ?? "1",
          is_active: s.is_active,
        }));
        setServices(draftServices);
      } catch (e: any) {
        toast({
          title: "Eroare",
          description: e?.message ?? "Nu am putut încărca experiența",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const moveItem = <T,>(arr: T[], from: number, to: number) => {
    if (to < 0 || to >= arr.length) return arr;
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  const setPrimaryImage = (clientId: string) => {
    setImages((prev) => prev.map((img) => ({ ...img, is_primary: img.clientId === clientId })));
  };

  const addImage = () => {
    setImages((prev) => {
      const next = [
        ...prev,
        {
          clientId: newClientId(),
          image_url: "",
          is_primary: prev.length === 0,
          focal_x: 50,
          focal_y: 50,
        },
      ];
      return next;
    });
  };

  const uploadAndSetImage = async (clientId: string, file: File) => {
    if (!id) return;
    try {
      setSaving(true);
      const url = await uploadExperienceImageFile({ experienceId: id, file });
      setImages((prev) =>
        prev.map((x) => (x.clientId === clientId ? { ...x, image_url: url } : x))
      );
      toast({
        title: "Imagine încărcată",
        description: "Am încărcat fișierul și am setat URL-ul automat.",
      });
    } catch (e: any) {
      toast({
        title: "Eroare upload",
        description: e?.message ?? "Nu am putut încărca imaginea",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeImage = (clientId: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.clientId !== clientId);
      if (next.length > 0 && !next.some((x) => x.is_primary)) {
        next[0] = { ...next[0], is_primary: true };
      }
      return next;
    });
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      {
        clientId: newClientId(),
        name: "",
        description: "",
        price: "0",
        is_required: false,
        max_quantity: "1",
        is_active: true,
      },
    ]);
  };

  const removeService = (clientId: string) => {
    setServices((prev) => prev.filter((s) => s.clientId !== clientId));
  };

  const buildExperiencePatch = () => {
    if (!originalExperience) return null;
    const patch: Record<string, any> = {};

    const nextPrice = normalizeNumberInput(price);
    const nextOriginalPrice = normalizeNumberInput(originalPrice);
    const nextDuration = normalizeNumberInput(durationMinutes);
    const nextMax = normalizeNumberInput(maxParticipants);
    const nextMinAge = normalizeNumberInput(minAge);

    if (title.trim() !== originalExperience.title) patch.title = title.trim();
    if (description.trim() !== originalExperience.description) patch.description = description.trim();
    if ((shortDescription.trim() || null) !== (originalExperience.short_description ?? null)) {
      patch.short_description = shortDescription.trim() || null;
    }
    if (locationName.trim() !== originalExperience.location_name) patch.location_name = locationName.trim();
    if (categoryId !== originalExperience.category_id) patch.category_id = categoryId;
    if (regionId !== originalExperience.region_id) patch.region_id = regionId;

    const nextIncludes = normalizeIncludes(includes);
    if (!isEqualStringArray(nextIncludes, normalizeIncludes(originalExperience.includes ?? []))) {
      patch.includes = nextIncludes;
    }

    if (!isEqualNullableNumber(nextPrice, originalExperience.price)) patch.price = nextPrice;
    if (!isEqualNullableNumber(nextOriginalPrice, originalExperience.original_price ?? null)) {
      patch.original_price = nextOriginalPrice;
    }
    if (!isEqualNullableNumber(nextDuration, originalExperience.duration_minutes ?? null)) {
      patch.duration_minutes = nextDuration;
    }
    if (!isEqualNullableNumber(nextMax, originalExperience.max_participants ?? null)) {
      patch.max_participants = nextMax;
    }
    if (!isEqualNullableNumber(nextMinAge, originalExperience.min_age ?? null)) {
      patch.min_age = nextMinAge;
    }

    if ((originalExperience.is_active ?? true) !== isActive) patch.is_active = isActive;
    if ((originalExperience.is_featured ?? false) !== isFeatured) patch.is_featured = isFeatured;

    return patch;
  };

  const save = async () => {
    if (!id || !originalExperience) return;
    if (!canSave) {
      toast({
        title: "Formular incomplet",
        description: "Completează câmpurile obligatorii înainte de a salva.",
        variant: "destructive",
      });
      return;
    }

    // Basic front validation for drafts
    const cleanImages = images
      .map((img) => ({ ...img, image_url: img.image_url.trim() }))
      .filter((img) => img.image_url.length > 0);

    const cleanServices = services
      .map((s) => ({
        ...s,
        name: s.name.trim(),
        description: s.description.trim(),
      }))
      .filter((s) => s.name.length > 0);

    setSaving(true);
    try {
      // 1) Experience details patch
      const patch = buildExperiencePatch();
      if (patch && Object.keys(patch).length > 0) {
        const { error } = await supabase.from("experiences").update(patch).eq("id", id);
        if (error) throw error;
      }

      // 2) Images incremental sync
      {
        const currentById = new Map(cleanImages.filter((x) => x.id).map((x) => [x.id!, x]));
        const originalIds = new Set(originalImages.map((x) => x.id));

        const toDelete = originalImages
          .filter((o) => !currentById.has(o.id))
          .map((o) => o.id);

        const updates = cleanImages
          .map((img, idx) => ({
            ...img,
            display_order: idx,
          }))
          .filter((img): img is ImageDraft & { id: string; display_order: number } => Boolean(img.id))
          .filter((img) => {
            const o = originalImages.find((x) => x.id === img.id);
            if (!o) return false;
            const oPrimary = Boolean(o.is_primary);
            const oOrder = o.display_order ?? 0;
             const oFocalX = (o as any).focal_x ?? 50;
             const oFocalY = (o as any).focal_y ?? 50;
            return (
              o.image_url !== img.image_url ||
              oPrimary !== img.is_primary ||
               oOrder !== img.display_order ||
               oFocalX !== img.focal_x ||
               oFocalY !== img.focal_y
            );
          })
          .map((img) => ({
            id: img.id,
            image_url: img.image_url,
            is_primary: img.is_primary,
            display_order: img.display_order,
            focal_x: img.focal_x,
            focal_y: img.focal_y,
          }));

        const inserts = cleanImages
          .map((img, idx) => ({ ...img, display_order: idx }))
          .filter((img) => !img.id)
          .map((img) => ({
            experience_id: id,
            image_url: img.image_url,
            is_primary: img.is_primary,
            display_order: img.display_order,
            focal_x: img.focal_x,
            focal_y: img.focal_y,
          }));

        if (toDelete.length > 0) {
          const { error } = await supabase
            .from("experience_images")
            .delete()
            .in("id", toDelete);
          if (error) throw error;
        }

        if (updates.length > 0) {
          const results = await Promise.all(
            updates.map((u) =>
              supabase
                .from("experience_images")
                .update({
                  image_url: u.image_url,
                  is_primary: u.is_primary,
                  display_order: u.display_order,
                  focal_x: u.focal_x,
                  focal_y: u.focal_y,
                })
                .eq("id", u.id)
            )
          );
          const firstError = results.find((r) => r.error)?.error;
          if (firstError) throw firstError;
        }

        if (inserts.length > 0) {
          const { error } = await supabase.from("experience_images").insert(inserts);
          if (error) throw error;
        }

        // If we deleted all original images and user kept none, that's OK.
        // But if we still have images, ensure we have exactly one primary.
        if (cleanImages.length > 0) {
          const primaryCount = cleanImages.filter((i) => i.is_primary).length;
          if (primaryCount !== 1) {
            // Best effort fix: force the first one as primary.
            const first = cleanImages[0];
            if (first.id && originalIds.has(first.id)) {
              await supabase
                .from("experience_images")
                .update({ is_primary: true })
                .eq("id", first.id);
            }
          }
        }
      }

      // 3) Services incremental sync
      {
        const curr = cleanServices.map((s, idx) => ({ ...s, display_order: idx }));
        const currentById = new Map(curr.filter((x) => x.id).map((x) => [x.id!, x]));
        const toDelete = originalServices
          .filter((o) => !currentById.has(o.id))
          .map((o) => o.id);

        const updates = curr
          .filter((s): s is ServiceDraft & { id: string; display_order: number } => Boolean(s.id))
          .filter((s) => {
            const o = originalServices.find((x) => x.id === s.id);
            if (!o) return false;
            const nextPrice = normalizeNumberInput(s.price) ?? 0;
            const nextMax = normalizeNumberInput(s.max_quantity) ?? 1;
            return (
              o.name !== s.name ||
              (o.description ?? "") !== s.description ||
              o.price !== nextPrice ||
              o.is_required !== s.is_required ||
              o.max_quantity !== nextMax ||
              o.is_active !== s.is_active ||
              o.display_order !== s.display_order
            );
          })
          .map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description || null,
            price: normalizeNumberInput(s.price) ?? 0,
            is_required: s.is_required,
            max_quantity: normalizeNumberInput(s.max_quantity) ?? 1,
            is_active: s.is_active,
            display_order: s.display_order,
          }));

        const inserts = curr
          .filter((s) => !s.id)
          .map((s) => ({
            experience_id: id,
            name: s.name,
            description: s.description || null,
            price: normalizeNumberInput(s.price) ?? 0,
            is_required: s.is_required,
            max_quantity: normalizeNumberInput(s.max_quantity) ?? 1,
            is_active: s.is_active,
            display_order: s.display_order,
          }));

        if (toDelete.length > 0) {
          const { error } = await supabase
            .from("experience_services")
            .delete()
            .in("id", toDelete);
          if (error) throw error;
        }

        if (updates.length > 0) {
          const results = await Promise.all(
            updates.map((u) =>
              supabase
                .from("experience_services")
                .update({
                  name: u.name,
                  description: u.description,
                  price: u.price,
                  is_required: u.is_required,
                  max_quantity: u.max_quantity,
                  is_active: u.is_active,
                  display_order: u.display_order,
                })
                .eq("id", u.id)
            )
          );
          const firstError = results.find((r) => r.error)?.error;
          if (firstError) throw firstError;
        }

        if (inserts.length > 0) {
          const { error } = await supabase.from("experience_services").insert(inserts);
          if (error) throw error;
        }
      }

      toast({ title: "Salvat", description: "Experiența a fost actualizată." });
      navigate("/admin/experiences");
    } catch (e: any) {
      toast({
        title: "Eroare",
        description: e?.message ?? "Nu am putut salva modificările",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Editează experiența</h2>
            <p className="text-muted-foreground">Actualizează detaliile, imaginile și serviciile.</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/experiences")}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Renunță
            </Button>
            <Button onClick={save} disabled={!canSave || saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Se salvează..." : "Salvează"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalii de bază</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titlu *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Locație *</Label>
                    <Input
                      id="location"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Categorie *</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alege categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Regiune *</Label>
                    <Select value={regionId} onValueChange={setRegionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alege regiunea" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preț (RON) *</Label>
                    <Input
                      id="price"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="original_price">Preț original (promo)</Label>
                    <Input
                      id="original_price"
                      inputMode="decimal"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Durată (minute)</Label>
                    <Input
                      id="duration"
                      inputMode="numeric"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_participants">Max. participanți</Label>
                    <Input
                      id="max_participants"
                      inputMode="numeric"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_age">Vârstă minimă</Label>
                    <Input
                      id="min_age"
                      inputMode="numeric"
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Descriere scurtă</Label>
                  <Textarea
                    id="short_description"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descriere *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={7}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Ce include (bullet-uri)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIncludes((prev) => [...prev, ""])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adaugă rând
                    </Button>
                  </div>
                  {includes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nu ai adăugat încă elemente.</p>
                  ) : (
                    <div className="space-y-2">
                      {includes.map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={item}
                            onChange={(e) =>
                              setIncludes((prev) =>
                                prev.map((x, i) => (i === idx ? e.target.value : x))
                              )
                            }
                            placeholder="Ex: Echipament complet"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setIncludes((prev) => moveItem(prev, idx, idx - 1))}
                            disabled={idx === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setIncludes((prev) => moveItem(prev, idx, idx + 1))}
                            disabled={idx === includes.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setIncludes((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">
                        Elementele goale sunt ignorate la salvare.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="is_active"
                      checked={isActive}
                      onCheckedChange={(v) => setIsActive(Boolean(v))}
                    />
                    <Label htmlFor="is_active">Activ</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="is_featured"
                      checked={isFeatured}
                      onCheckedChange={(v) => setIsFeatured(Boolean(v))}
                    />
                    <Label htmlFor="is_featured">Evidențiat</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Imagini</CardTitle>
                <Button variant="outline" onClick={addImage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă imagine
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border bg-card p-4 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-medium">Preview thumbnails (încadrare)</div>
                      <p className="text-xs text-muted-foreground">
                        Verifică rapid cum arată punctul de focus pe diverse formate.
                      </p>
                    </div>

                    <ToggleGroup
                      type="single"
                      value={thumbPreset}
                      onValueChange={(v) => {
                        if (v === "square" || v === "wide" || v === "classic") setThumbPreset(v);
                      }}
                      className="justify-start sm:justify-end"
                    >
                      <ToggleGroupItem value="square" aria-label="Pătrat">
                        1:1
                      </ToggleGroupItem>
                      <ToggleGroupItem value="wide" aria-label="Wide">
                        16:9
                      </ToggleGroupItem>
                      <ToggleGroupItem value="classic" aria-label="Clasic">
                        4:3
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {images.filter((i) => i.image_url.trim().length > 0).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Adaugă un URL / încarcă o imagine ca să vezi thumbnails.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {images
                        .filter((i) => i.image_url.trim().length > 0)
                        .map((img, idx) => (
                          <div key={`thumb-${img.clientId}`} className="space-y-2">
                            <AspectRatio ratio={thumbRatio} className="overflow-hidden rounded-md border bg-muted">
                              <ExperienceImage
                                src={img.image_url}
                                alt={`Thumbnail ${idx + 1}`}
                                focalX={img.focal_x}
                                focalY={img.focal_y}
                                className="h-full w-full"
                              />

                              <div className="pointer-events-none absolute left-2 top-2 rounded bg-background/70 px-2 py-0.5 text-[11px] text-foreground backdrop-blur-sm">
                                #{idx + 1}{img.is_primary ? " • principală" : ""}
                              </div>
                            </AspectRatio>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {images.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nu există imagini.</p>
                ) : (
                  <div className="space-y-3">
                    {images.map((img, idx) => (
                      <div
                        key={img.clientId}
                        className="rounded-md border bg-card p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">
                            Imagine {idx + 1}{" "}
                            {img.is_primary ? (
                              <span className="text-muted-foreground">(principală)</span>
                            ) : null}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setImages((prev) => moveItem(prev, idx, idx - 1))}
                              disabled={idx === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setImages((prev) => moveItem(prev, idx, idx + 1))}
                              disabled={idx === images.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeImage(img.clientId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">
                          <div className="md:col-span-3 space-y-2">
                            <Label>URL imagine</Label>
                            <Input
                              value={img.image_url}
                              onChange={(e) =>
                                setImages((prev) =>
                                  prev.map((x) =>
                                    x.clientId === img.clientId
                                      ? { ...x, image_url: e.target.value }
                                      : x
                                  )
                                )
                              }
                              placeholder="https://..."
                            />

                            <div className="flex items-center gap-2">
                              <Label
                                className="inline-flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-accent w-fit"
                                htmlFor={`img-upload-${img.clientId}`}
                              >
                                Încarcă fișier
                              </Label>
                              <input
                                id={`img-upload-${img.clientId}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadAndSetImage(img.clientId, file);
                                }}
                              />
                              <span className="text-xs text-muted-foreground">
                                Acceptă PNG/JPEG/WebP etc.
                              </span>
                            </div>

                            <div className="space-y-2">
                              <Label>Punct de focus (încadrare)</Label>
                              <FocalPointPicker
                                src={img.image_url}
                                alt={`Imagine ${idx + 1}`}
                                focalX={img.focal_x}
                                focalY={img.focal_y}
                                onChange={({ focalX, focalY }) =>
                                  setImages((prev) =>
                                    prev.map((x) =>
                                      x.clientId === img.clientId
                                        ? { ...x, focal_x: focalX, focal_y: focalY }
                                        : x
                                    )
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant={img.is_primary ? "default" : "outline"}
                              className="w-full"
                              onClick={() => setPrimaryImage(img.clientId)}
                            >
                              {img.is_primary ? "Principală" : "Setează ca principală"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Servicii adiționale</CardTitle>
                <Button variant="outline" onClick={addService}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă serviciu
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nu există servicii.</p>
                ) : (
                  <div className="space-y-3">
                    {services.map((svc, idx) => (
                      <div key={svc.clientId} className="rounded-md border bg-card p-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">Serviciu {idx + 1}</div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setServices((prev) => moveItem(prev, idx, idx - 1))}
                              disabled={idx === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setServices((prev) => moveItem(prev, idx, idx + 1))}
                              disabled={idx === services.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeService(svc.clientId)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Nume</Label>
                            <Input
                              value={svc.name}
                              onChange={(e) =>
                                setServices((prev) =>
                                  prev.map((x) =>
                                    x.clientId === svc.clientId ? { ...x, name: e.target.value } : x
                                  )
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Preț (RON)</Label>
                            <Input
                              inputMode="decimal"
                              value={svc.price}
                              onChange={(e) =>
                                setServices((prev) =>
                                  prev.map((x) =>
                                    x.clientId === svc.clientId ? { ...x, price: e.target.value } : x
                                  )
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Descriere</Label>
                          <Textarea
                            value={svc.description}
                            onChange={(e) =>
                              setServices((prev) =>
                                prev.map((x) =>
                                  x.clientId === svc.clientId
                                    ? { ...x, description: e.target.value }
                                    : x
                                )
                              )
                            }
                            rows={3}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Cantitate maximă</Label>
                            <Input
                              inputMode="numeric"
                              value={svc.max_quantity}
                              onChange={(e) =>
                                setServices((prev) =>
                                  prev.map((x) =>
                                    x.clientId === svc.clientId
                                      ? { ...x, max_quantity: e.target.value }
                                      : x
                                  )
                                )
                              }
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <Checkbox
                              id={`svc-required-${svc.clientId}`}
                              checked={svc.is_required}
                              onCheckedChange={(v) =>
                                setServices((prev) =>
                                  prev.map((x) =>
                                    x.clientId === svc.clientId
                                      ? { ...x, is_required: Boolean(v) }
                                      : x
                                  )
                                )
                              }
                            />
                            <Label htmlFor={`svc-required-${svc.clientId}`}>Obligatoriu</Label>
                          </div>
                          <div className="flex items-end gap-2">
                            <Checkbox
                              id={`svc-active-${svc.clientId}`}
                              checked={svc.is_active}
                              onCheckedChange={(v) =>
                                setServices((prev) =>
                                  prev.map((x) =>
                                    x.clientId === svc.clientId
                                      ? { ...x, is_active: Boolean(v) }
                                      : x
                                  )
                                )
                              }
                            />
                            <Label htmlFor={`svc-active-${svc.clientId}`}>Activ</Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
