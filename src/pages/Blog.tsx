import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Calendar, User, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  featured_image: string | null;
  author: string | null;
  tags: string[];
  published_at: string | null;
  category_id: string | null;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

const POSTS_PER_PAGE = 9;

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [postsRes, catsRes] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("id, title, slug, meta_description, featured_image, author, tags, published_at, category_id")
          .eq("status", "published")
          .order("published_at", { ascending: false }),
        supabase.from("blog_categories").select("*").order("name"),
      ]);
      if (postsRes.data) setPosts(postsRes.data);
      if (catsRes.data) setCategories(catsRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = posts.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory && p.category_id !== selectedCategory) return false;
    if (selectedTag && !p.tags?.includes(selectedTag)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginated = filtered.slice(page * POSTS_PER_PAGE, (page + 1) * POSTS_PER_PAGE);

  const allTags = [...new Set(posts.flatMap(p => p.tags || []))].sort();

  const getCategoryName = (catId: string | null) => {
    if (!catId) return null;
    return categories.find(c => c.id === catId)?.name || null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground text-lg">Povești, sfaturi și inspirație pentru următoarea ta aventură.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Caută articole..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={!selectedCategory ? "default" : "outline"}
              onClick={() => { setSelectedCategory(null); setPage(0); }}
            >
              Toate
            </Button>
            {categories.map(c => (
              <Button
                key={c.id}
                size="sm"
                variant={selectedCategory === c.id ? "default" : "outline"}
                onClick={() => { setSelectedCategory(c.id); setPage(0); }}
              >
                {c.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {selectedTag && (
              <Badge
                variant="default"
                className="cursor-pointer"
                onClick={() => { setSelectedTag(null); setPage(0); }}
              >
                ✕ {selectedTag}
              </Badge>
            )}
            {allTags.filter(t => t !== selectedTag).slice(0, 15).map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => { setSelectedTag(tag); setPage(0); }}
              >
                <Tag className="w-3 h-3 mr-1" />{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">Niciun articol găsit.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map(post => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-card"
              >
                {post.featured_image ? (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <span className="text-4xl">📝</span>
                  </div>
                )}
                <div className="p-5 space-y-3">
                  {getCategoryName(post.category_id) && (
                    <Badge variant="secondary" className="text-xs">{getCategoryName(post.category_id)}</Badge>
                  )}
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  {post.meta_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.meta_description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    {post.author && (
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
                    )}
                    {post.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(post.published_at), "d MMM yyyy", { locale: ro })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Pagina {page + 1} din {totalPages}
            </span>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
