import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Star, MapPin, Clock, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Experience {
  id: string;
  title: string;
  location_name: string;
  price: number;
  original_price?: number;
  avg_rating: number;
  total_reviews: number;
  duration_minutes?: number;
  categories: { name: string; slug: string } | null;
  regions: { name: string; slug: string } | null;
  experience_images: { image_url: string; is_primary: boolean }[];
}

const categoryTitles: Record<string, string> = {
  "aventura": "Aventură",
  "spa-relaxare": "Spa & Relaxare",
  "gastronomie": "Gastronomie",
  "arta-cultura": "Artă & Cultură",
  "sport": "Sport",
  "natura": "Natură",
  "romantic": "Romantic",
  "calatorii": "Călătorii",
  "toate-categoriile": "Toate Experiențele",
};

export default function CategorySearch() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recommended");
  
  const categoryKey = category?.toLowerCase() || "";
  const regionParam = searchParams.get('region');
  
  const categoryTitle = categoryTitles[categoryKey] || "Toate Experiențele";

  useEffect(() => {
    const fetchExperiences = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('experiences')
          .select(`
            id,
            title,
            location_name,
            price,
            original_price,
            avg_rating,
            total_reviews,
            duration_minutes,
            categories (name, slug),
            regions (name, slug),
            experience_images (image_url, is_primary)
          `)
          .eq('is_active', true);

        // Filter by category if not "toate-categoriile"
        if (categoryKey && categoryKey !== "toate-categoriile") {
          query = query.eq('categories.slug', categoryKey);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter out experiences without matching category (for join filtering)
        let filteredData = data || [];
        if (categoryKey && categoryKey !== "toate-categoriile") {
          filteredData = filteredData.filter(exp => exp.categories?.slug === categoryKey);
        }
        // Filter by region if provided (match by slug or name)
        if (regionParam) {
          const regionLower = regionParam.toLowerCase();
          filteredData = filteredData.filter(exp => 
            exp.regions?.slug === regionLower || 
            exp.regions?.name?.toLowerCase() === regionLower
          );
        }

        setExperiences(filteredData);
      } catch (error: any) {
        console.error('Error fetching experiences:', error);
        toast({
          title: "Eroare",
          description: "Nu am putut încărca experiențele",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, [categoryKey, regionParam, toast]);

  // Sort experiences
  const sortedExperiences = useMemo(() => {
    const sorted = [...experiences];
    switch (sortBy) {
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "rating":
        return sorted.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
      default:
        return sorted;
    }
  }, [experiences, sortBy]);

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "Variabil";
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} ore`;
    return `${Math.floor(minutes / 1440)} zile`;
  };

  const getExperienceImage = (exp: Experience) => {
    const primaryImage = exp.experience_images?.find(img => img.is_primary);
    if (primaryImage) return primaryImage.image_url;
    if (exp.experience_images?.length > 0) return exp.experience_images[0].image_url;
    return "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&h=400&fit=crop";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary to-coral-dark py-12 lg:py-16">
          <div className="container">
            <Button 
              variant="glass" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi
            </Button>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl lg:text-5xl font-bold text-primary-foreground mb-2"
            >
              {regionParam ? `${categoryTitle} - ${regionParam}` : categoryTitle}
            </motion.h1>
            <p className="text-primary-foreground/80 text-lg">
              {loading ? "Se încarcă..." : `${sortedExperiences.length} experiențe disponibile`}
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="container py-10">
          {/* Sort Dropdown */}
          <div className="flex items-center justify-end gap-4 mb-6">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Sortare:
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recomandate</SelectItem>
                <SelectItem value="price-asc">Preț crescător</SelectItem>
                <SelectItem value="price-desc">Preț descrescător</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedExperiences.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-4">
                Nu am găsit experiențe în această categorie.
              </p>
              <Button onClick={() => navigate('/category/toate-categoriile')}>
                Vezi toate experiențele
              </Button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {sortedExperiences.map((exp, index) => (
                <motion.article
                  key={exp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  onClick={() => navigate(`/experience/${exp.id}`)}
                  className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50 cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getExperienceImage(exp)}
                      alt={exp.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Wishlist Button */}
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors shadow-md"
                    >
                      <Heart className="w-4 h-4 text-foreground hover:text-primary transition-colors" />
                    </button>

                    {/* Discount Badge */}
                    {exp.original_price && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        -{Math.round((1 - exp.price / exp.original_price) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Location & Duration */}
                    <div className="flex items-center gap-3 text-muted-foreground text-xs mb-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {exp.location_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(exp.duration_minutes)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {exp.title}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span className="font-semibold text-sm text-foreground">{exp.avg_rating?.toFixed(1) || "N/A"}</span>
                      <span className="text-muted-foreground text-xs">
                        ({exp.total_reviews || 0})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-primary">{exp.price} lei</span>
                      {exp.original_price && (
                        <span className="text-muted-foreground line-through text-sm">
                          {exp.original_price} lei
                        </span>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}