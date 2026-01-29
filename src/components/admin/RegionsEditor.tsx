import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegions, useUpdateRegionImage, useUploadRegionImage } from "@/hooks/useRegions";
import { Loader2, Upload, ImageIcon } from "lucide-react";

export function RegionsEditor() {
  const { data: regions, isLoading } = useRegions();
  const updateImage = useUpdateRegionImage();
  const uploadImage = useUploadRegionImage();
  
  const [uploading, setUploading] = useState<string | null>(null);

  const handleImageUpload = async (regionId: string, file: File) => {
    setUploading(regionId);
    try {
      const url = await uploadImage.mutateAsync(file);
      await updateImage.mutateAsync({ regionId, imageUrl: url });
    } finally {
      setUploading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!regions || regions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nu există regiuni în baza de date.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {regions.map((region) => (
          <Card key={region.id} className="overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {region.image_url ? (
                <img
                  src={region.image_url}
                  alt={region.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                </div>
              )}
              {uploading === region.id && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{region.name}</CardTitle>
              <CardDescription>/{region.slug}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor={`image-${region.id}`} className="text-sm">
                  Schimbă imaginea
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`image-${region.id}`}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(region.id, file);
                    }}
                    disabled={uploading === region.id}
                    className="text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Max 5MB. Formate: JPG, PNG, WebP
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
