import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllHomepageContent, useUpdateHomepageContent, useUploadHomepageImage } from "@/hooks/useHomepageContent";
import { Loader2, Upload, Eye } from "lucide-react";
import { Link } from "react-router-dom";

export default function ContentEditor() {
  const { data: sections, isLoading } = useAllHomepageContent();
  const updateContent = useUpdateHomepageContent();
  const uploadImage = useUploadHomepageImage();
  
  const [editedContent, setEditedContent] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const handleContentChange = (sectionKey: string, field: string, value: any) => {
    setEditedContent((prev) => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || sections?.find(s => s.section_key === sectionKey)?.content || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async (sectionKey: string) => {
    const content = editedContent[sectionKey] || sections?.find(s => s.section_key === sectionKey)?.content;
    if (content) {
      await updateContent.mutateAsync({ sectionKey, content });
      setEditedContent((prev) => {
        const newState = { ...prev };
        delete newState[sectionKey];
        return newState;
      });
    }
  };

  const handleImageUpload = async (sectionKey: string, field: string, file: File) => {
    setUploading(`${sectionKey}-${field}`);
    try {
      const url = await uploadImage.mutateAsync(file);
      handleContentChange(sectionKey, field, url);
    } finally {
      setUploading(null);
    }
  };

  const getContent = (sectionKey: string) => {
    return editedContent[sectionKey] || sections?.find(s => s.section_key === sectionKey)?.content || {};
  };

  const renderHeroEditor = () => {
    const content = getContent("hero");
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Badge Text</Label>
          <Input
            value={content.badge || ""}
            onChange={(e) => handleContentChange("hero", "badge", e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={content.title || ""}
            onChange={(e) => handleContentChange("hero", "title", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Title Highlight</Label>
          <Input
            value={content.titleHighlight || ""}
            onChange={(e) => handleContentChange("hero", "titleHighlight", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Textarea
            value={content.subtitle || ""}
            onChange={(e) => handleContentChange("hero", "subtitle", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Primary CTA Text</Label>
          <Input
            value={content.ctaPrimary || ""}
            onChange={(e) => handleContentChange("hero", "ctaPrimary", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Primary CTA Link</Label>
          <Input
            value={content.ctaPrimaryLink || ""}
            onChange={(e) => handleContentChange("hero", "ctaPrimaryLink", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Secondary CTA Text</Label>
          <Input
            value={content.ctaSecondary || ""}
            onChange={(e) => handleContentChange("hero", "ctaSecondary", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Secondary CTA Link</Label>
          <Input
            value={content.ctaSecondaryLink || ""}
            onChange={(e) => handleContentChange("hero", "ctaSecondaryLink", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Background Image</Label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload("hero", "backgroundImage", file);
              }}
              disabled={uploading === "hero-backgroundImage"}
            />
            {uploading === "hero-backgroundImage" && <Loader2 className="w-5 h-5 animate-spin" />}
          </div>
          <p className="text-xs text-muted-foreground">
            Max 5MB. Formate acceptate: JPG, PNG, WebP
          </p>
          {content.backgroundImage && (
            <img src={content.backgroundImage} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" />
          )}
        </div>

        <Button onClick={() => handleSave("hero")} disabled={updateContent.isPending}>
          {updateContent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Salvează Modificările
        </Button>
      </div>
    );
  };

  const renderSimpleSectionEditor = (sectionKey: string, title: string) => {
    const content = getContent(sectionKey);
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Badge</Label>
          <Input
            value={content.badge || ""}
            onChange={(e) => handleContentChange(sectionKey, "badge", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={content.title || ""}
            onChange={(e) => handleContentChange(sectionKey, "title", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Textarea
            value={content.subtitle || ""}
            onChange={(e) => handleContentChange(sectionKey, "subtitle", e.target.value)}
            rows={3}
          />
        </div>

        {sectionKey === "featured" && (
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input
              value={content.ctaText || ""}
              onChange={(e) => handleContentChange(sectionKey, "ctaText", e.target.value)}
            />
          </div>
        )}

        <Button onClick={() => handleSave(sectionKey)} disabled={updateContent.isPending}>
          {updateContent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Salvează Modificările
        </Button>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Editor Conținut Homepage</h2>
            <p className="text-muted-foreground">Editează text, imagini și linkuri pentru fiecare secțiune</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/content/audit">
                <Upload className="w-4 h-4 mr-2" />
                Istoric
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">
                <Eye className="w-4 h-4 mr-2" />
                Previzualizează
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="categories">Categorii</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="regions">Regiuni</TabsTrigger>
            <TabsTrigger value="how-it-works">Cum Funcționează</TabsTrigger>
            <TabsTrigger value="testimonials">Testimoniale</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          </TabsList>

          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Secțiunea Hero</CardTitle>
                <CardDescription>Editează conținutul principal din partea de sus a paginii</CardDescription>
              </CardHeader>
              <CardContent>{renderHeroEditor()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Secțiunea Categorii</CardTitle>
                <CardDescription>Editează titlul și descrierea secțiunii de categorii</CardDescription>
              </CardHeader>
              <CardContent>{renderSimpleSectionEditor("categories", "Categorii")}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured">
            <Card>
              <CardHeader>
                <CardTitle>Secțiunea Experiențe Featured</CardTitle>
                <CardDescription>Editează titlul și descrierea experiențelor recomandate</CardDescription>
              </CardHeader>
              <CardContent>{renderSimpleSectionEditor("featured", "Featured")}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regions">
            <Card>
              <CardHeader>
                <CardTitle>Secțiunea Regiuni</CardTitle>
                <CardDescription>Editează titlul și descrierea secțiunii de regiuni</CardDescription>
              </CardHeader>
              <CardContent>{renderSimpleSectionEditor("regions", "Regiuni")}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="how-it-works">
            <Card>
              <CardHeader>
                <CardTitle>Secțiunea Cum Funcționează</CardTitle>
                <CardDescription>Editează titlul și descrierea secțiunii despre procesul de utilizare</CardDescription>
              </CardHeader>
              <CardContent>{renderSimpleSectionEditor("how-it-works", "Cum Funcționează")}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonials">
            <Card>
              <CardHeader>
                <CardTitle>Secțiunea Testimoniale</CardTitle>
                <CardDescription>Editează titlul și descrierea secțiunii de recenzii</CardDescription>
              </CardHeader>
              <CardContent>{renderSimpleSectionEditor("testimonials", "Testimoniale")}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="newsletter">
            <Card>
              <CardHeader>
                <CardTitle>Secțiunea Newsletter</CardTitle>
                <CardDescription>Editează conținutul secțiunii de abonare la newsletter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={getContent("newsletter").title || ""}
                      onChange={(e) => handleContentChange("newsletter", "title", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Textarea
                      value={getContent("newsletter").subtitle || ""}
                      onChange={(e) => handleContentChange("newsletter", "subtitle", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email Placeholder</Label>
                    <Input
                      value={getContent("newsletter").placeholder || ""}
                      onChange={(e) => handleContentChange("newsletter", "placeholder", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={getContent("newsletter").ctaText || ""}
                      onChange={(e) => handleContentChange("newsletter", "ctaText", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Disclaimer</Label>
                    <Input
                      value={getContent("newsletter").disclaimer || ""}
                      onChange={(e) => handleContentChange("newsletter", "disclaimer", e.target.value)}
                    />
                  </div>

                  <Button onClick={() => handleSave("newsletter")} disabled={updateContent.isPending}>
                    {updateContent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Salvează Modificările
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}