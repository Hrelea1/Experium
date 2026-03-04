import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye, Send } from "lucide-react";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const BlogEditor = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    meta_title: "",
    meta_description: "",
    featured_image: "",
    content: "",
    author: "",
    category_id: "",
    tags: [] as string[],
    status: "draft" as "draft" | "published",
  });

  useEffect(() => {
    supabase.from("blog_categories").select("*").order("name").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    supabase.from("blog_posts").select("*").eq("id", id).single().then(({ data, error }) => {
      if (data && !error) {
        setForm({
          title: data.title,
          slug: data.slug,
          meta_title: data.meta_title || "",
          meta_description: data.meta_description || "",
          featured_image: data.featured_image || "",
          content: data.content || "",
          author: data.author || "",
          category_id: data.category_id || "",
          tags: data.tags || [],
          status: data.status as "draft" | "published",
        });
        setTagsInput((data.tags || []).join(", "));
      }
    });
  }, [id, isEdit]);

  const handleTitleChange = (title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: isEdit ? prev.slug : slugify(title),
      meta_title: prev.meta_title || title,
    }));
  };

  const handleTagsChange = (val: string) => {
    setTagsInput(val);
    setForm(prev => ({
      ...prev,
      tags: val.split(",").map(t => t.trim()).filter(Boolean),
    }));
  };

  const handleSave = async (publishNow?: boolean) => {
    if (!form.title || !form.slug) {
      toast({ title: "Titlul este obligatoriu", variant: "destructive" });
      return;
    }
    setLoading(true);

    const payload: any = {
      title: form.title,
      slug: form.slug,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      featured_image: form.featured_image || null,
      content: form.content || null,
      author: form.author || null,
      category_id: form.category_id || null,
      tags: form.tags,
      status: publishNow ? "published" : form.status,
    };
    if (publishNow) payload.published_at = new Date().toISOString();

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("blog_posts").update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(payload));
    }

    setLoading(false);
    if (error) {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    } else {
      toast({ title: publishNow ? "Articol publicat!" : "Articol salvat!" });
      navigate("/admin/blog");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/blog")}>
            <ArrowLeft className="w-4 h-4 mr-1" />Înapoi
          </Button>
          <h1 className="text-2xl font-bold">{isEdit ? "Editează Articol" : "Articol Nou"}</h1>
          <Badge variant={form.status === "published" ? "default" : "secondary"} className="ml-auto">
            {form.status === "published" ? "Publicat" : "Ciornă"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle>Conținut</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Titlu *</Label>
                  <Input value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Titlul articolului" />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))} placeholder="url-articol" />
                </div>
                <div className="space-y-2">
                  <Label>Conținut (HTML)</Label>
                  <Textarea
                    value={form.content}
                    onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Scrie conținutul articolului..."
                    rows={16}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Publicare</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => handleSave(false)} disabled={loading} className="w-full" variant="outline">
                  <Save className="w-4 h-4 mr-2" />{loading ? "Se salvează..." : "Salvează ciornă"}
                </Button>
                <Button onClick={() => handleSave(true)} disabled={loading} className="w-full">
                  <Send className="w-4 h-4 mr-2" />Publică
                </Button>
                {isEdit && form.slug && (
                  <Button variant="ghost" className="w-full" onClick={() => window.open(`/#/blog/${form.slug}`, "_blank")}>
                    <Eye className="w-4 h-4 mr-2" />Previzualizare
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Detalii</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Autor</Label>
                  <Input value={form.author} onChange={e => setForm(prev => ({ ...prev, author: e.target.value }))} placeholder="Numele autorului" />
                </div>
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select value={form.category_id} onValueChange={v => setForm(prev => ({ ...prev, category_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Alege categoria" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Taguri (separate prin virgulă)</Label>
                  <Input value={tagsInput} onChange={e => handleTagsChange(e.target.value)} placeholder="travel, romania, aventură" />
                </div>
                <div className="space-y-2">
                  <Label>Imagine principală (URL)</Label>
                  <Input value={form.featured_image} onChange={e => setForm(prev => ({ ...prev, featured_image: e.target.value }))} placeholder="https://..." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input value={form.meta_title} onChange={e => setForm(prev => ({ ...prev, meta_title: e.target.value }))} placeholder="Titlu SEO" />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea value={form.meta_description} onChange={e => setForm(prev => ({ ...prev, meta_description: e.target.value }))} placeholder="Descriere SEO" rows={3} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BlogEditor;
