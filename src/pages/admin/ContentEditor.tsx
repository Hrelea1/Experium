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
import { RegionsEditor } from "@/components/admin/RegionsEditor";

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
          <h2 className="text-3xl font-bold">Editor Conținut</h2>
            <p className="text-muted-foreground">Editează text, imagini și linkuri pentru paginile site-ului</p>
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
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="categories">Categorii</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="regions">Regiuni</TabsTrigger>
            <TabsTrigger value="how-it-works">Cum Funcționează</TabsTrigger>
            <TabsTrigger value="testimonials">Testimoniale</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="terms">Termeni</TabsTrigger>
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
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Text Secțiune Regiuni</CardTitle>
                  <CardDescription>Editează titlul și descrierea secțiunii de regiuni</CardDescription>
                </CardHeader>
                <CardContent>{renderSimpleSectionEditor("regions", "Regiuni")}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Imagini Regiuni</CardTitle>
                  <CardDescription>Încarcă imagini personalizate pentru fiecare regiune.</CardDescription>
                </CardHeader>
                <CardContent><RegionsEditor /></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="how-it-works">
            <Card>
              <CardHeader>
                <CardTitle>Secțiunea Cum Funcționează</CardTitle>
                <CardDescription>Editează titlul și descrierea</CardDescription>
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
                <CardDescription>Editează conținutul secțiunii de abonare</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={getContent("newsletter").title || ""} onChange={(e) => handleContentChange("newsletter", "title", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Textarea value={getContent("newsletter").subtitle || ""} onChange={(e) => handleContentChange("newsletter", "subtitle", e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Placeholder</Label>
                    <Input value={getContent("newsletter").placeholder || ""} onChange={(e) => handleContentChange("newsletter", "placeholder", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input value={getContent("newsletter").ctaText || ""} onChange={(e) => handleContentChange("newsletter", "ctaText", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Disclaimer</Label>
                    <Input value={getContent("newsletter").disclaimer || ""} onChange={(e) => handleContentChange("newsletter", "disclaimer", e.target.value)} />
                  </div>
                  <Button onClick={() => handleSave("newsletter")} disabled={updateContent.isPending}>
                    {updateContent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Salvează Modificările
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Editor */}
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Pagina FAQ</CardTitle>
                <CardDescription>Editează întrebările și răspunsurile de pe pagina FAQ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(getContent("faq").items || []).map((item: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Întrebarea {idx + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            const items = [...(getContent("faq").items || [])];
                            items.splice(idx, 1);
                            handleContentChange("faq", "items", items);
                          }}
                        >
                          Șterge
                        </Button>
                      </div>
                      <Input
                        placeholder="Întrebare"
                        value={item.q || ""}
                        onChange={(e) => {
                          const items = [...(getContent("faq").items || [])];
                          items[idx] = { ...items[idx], q: e.target.value };
                          handleContentChange("faq", "items", items);
                        }}
                      />
                      <Textarea
                        placeholder="Răspuns"
                        value={item.a || ""}
                        rows={2}
                        onChange={(e) => {
                          const items = [...(getContent("faq").items || [])];
                          items[idx] = { ...items[idx], a: e.target.value };
                          handleContentChange("faq", "items", items);
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const items = [...(getContent("faq").items || []), { q: "", a: "" }];
                      handleContentChange("faq", "items", items);
                    }}
                  >
                    + Adaugă Întrebare
                  </Button>
                  <div>
                    <Button onClick={() => handleSave("faq")} disabled={updateContent.isPending}>
                      {updateContent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Salvează FAQ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Editor */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Pagina Contact</CardTitle>
                <CardDescription>Editează informațiile de contact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Titlu</Label><Input value={getContent("contact").title || ""} onChange={(e) => handleContentChange("contact", "title", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Subtitlu</Label><Input value={getContent("contact").subtitle || ""} onChange={(e) => handleContentChange("contact", "subtitle", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Telefon</Label><Input value={getContent("contact").phone || ""} onChange={(e) => handleContentChange("contact", "phone", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={getContent("contact").email || ""} onChange={(e) => handleContentChange("contact", "email", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Adresă</Label><Input value={getContent("contact").address || ""} onChange={(e) => handleContentChange("contact", "address", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Program (o linie per rând)</Label><Textarea value={getContent("contact").schedule || ""} onChange={(e) => handleContentChange("contact", "schedule", e.target.value)} rows={3} /></div>
                  <Button onClick={() => handleSave("contact")} disabled={updateContent.isPending}>
                    {updateContent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Salvează Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terms Editor */}
          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle>Pagina Termeni și Condiții</CardTitle>
                <CardDescription>Editează secțiunile din pagina de termeni</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2"><Label>Titlu</Label><Input value={getContent("terms").title || ""} onChange={(e) => handleContentChange("terms", "title", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Ultima actualizare</Label><Input value={getContent("terms").lastUpdated || ""} onChange={(e) => handleContentChange("terms", "lastUpdated", e.target.value)} /></div>
                  
                  {(getContent("terms").sections || []).map((section: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Secțiunea {idx + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            const sections = [...(getContent("terms").sections || [])];
                            sections.splice(idx, 1);
                            handleContentChange("terms", "sections", sections);
                          }}
                        >
                          Șterge
                        </Button>
                      </div>
                      <Input
                        placeholder="Titlu secțiune"
                        value={section.heading || ""}
                        onChange={(e) => {
                          const sections = [...(getContent("terms").sections || [])];
                          sections[idx] = { ...sections[idx], heading: e.target.value };
                          handleContentChange("terms", "sections", sections);
                        }}
                      />
                      <Textarea
                        placeholder="Conținut"
                        value={section.text || ""}
                        rows={3}
                        onChange={(e) => {
                          const sections = [...(getContent("terms").sections || [])];
                          sections[idx] = { ...sections[idx], text: e.target.value };
                          handleContentChange("terms", "sections", sections);
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      const sections = [...(getContent("terms").sections || []), { heading: "", text: "" }];
                      handleContentChange("terms", "sections", sections);
                    }}
                  >
                    + Adaugă Secțiune
                  </Button>
                  <div>
                    <Button onClick={() => handleSave("terms")} disabled={updateContent.isPending}>
                      {updateContent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Salvează Termeni
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}