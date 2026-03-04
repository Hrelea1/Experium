import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import DOMPurify from "dompurify";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  featured_image: string | null;
  author: string | null;
  tags: string[];
  published_at: string | null;
  category_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  meta_description: string | null;
}

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();

      if (data && !error) {
        setPost(data);
        // Update page title
        document.title = data.meta_title || data.title;

        // Fetch category name
        if (data.category_id) {
          const { data: cat } = await supabase
            .from("blog_categories")
            .select("name")
            .eq("id", data.category_id)
            .single();
          if (cat) setCategoryName(cat.name);
        }

        // Fetch related posts (same category or tags overlap)
        const { data: relatedData } = await supabase
          .from("blog_posts")
          .select("id, title, slug, featured_image, meta_description")
          .eq("status", "published")
          .neq("id", data.id)
          .limit(3);
        if (relatedData) setRelated(relatedData);
      }
      setLoading(false);
    };
    if (slug) fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container pt-28 pb-16 max-w-3xl">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-64 w-full rounded-lg mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container pt-28 pb-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Articol negăsit</h1>
          <p className="text-muted-foreground mb-6">Acest articol nu există sau nu este publicat.</p>
          <Button asChild><Link to="/blog">Înapoi la Blog</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-28 pb-16">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-1" />Înapoi la Blog</Link>
          </Button>

          {categoryName && <Badge variant="secondary" className="mb-3">{categoryName}</Badge>}

          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            {post.author && (
              <span className="flex items-center gap-1"><User className="w-4 h-4" />{post.author}</span>
            )}
            {post.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(post.published_at), "d MMMM yyyy", { locale: ro })}
              </span>
            )}
          </div>

          {post.featured_image && (
            <div className="rounded-xl overflow-hidden mb-8">
              <img src={post.featured_image} alt={post.title} className="w-full h-auto max-h-[500px] object-cover" />
            </div>
          )}

          {post.content && (
            <div
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
            />
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t">
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline">
                  <Tag className="w-3 h-3 mr-1" />{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <div className="max-w-5xl mx-auto mt-16">
            <h2 className="text-2xl font-bold mb-6">Articole Similare</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(r => (
                <Link
                  key={r.id}
                  to={`/blog/${r.slug}`}
                  className="group border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-card"
                >
                  {r.featured_image ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={r.featured_image} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center"><span className="text-3xl">📝</span></div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">{r.title}</h3>
                    {r.meta_description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{r.meta_description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
