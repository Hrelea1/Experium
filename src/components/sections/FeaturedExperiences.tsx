import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Star, MapPin, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { supabase } from "@/integrations/supabase/client";
import { ExperienceImage } from "@/components/ExperienceImage";

const experiences = [
  {
    id: 1,
    title: "Zbor cu Balonul în Transilvania",
    location: "Brașov, Transilvania",
    price: 899,
    originalPrice: 1099,
    rating: 4.9,
    reviews: 127,
    duration: "3 ore",
    image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&h=400&fit=crop",
    badge: "Bestseller",
    badgeColor: "bg-primary",
  },
  {
    id: 2,
    title: "Degustare de Vinuri Premium",
    location: "Dealu Mare, Muntenia",
    price: 349,
    rating: 4.8,
    reviews: 89,
    duration: "4 ore",
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&h=400&fit=crop",
    badge: "Popular",
    badgeColor: "bg-accent",
  },
  {
    id: 3,
    title: "Retreat Spa & Wellness",
    location: "Băile Felix, Bihor",
    price: 599,
    rating: 4.9,
    reviews: 203,
    duration: "1 zi",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop",
    badge: "Nou",
    badgeColor: "bg-secondary",
  },
  {
    id: 4,
    title: "Curs de Gătit Tradițional",
    location: "Sibiu, Transilvania",
    price: 279,
    rating: 4.7,
    reviews: 56,
    duration: "5 ore",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop",
  },
  {
    id: 5,
    title: "Rafting pe Olt",
    location: "Călimănești, Vâlcea",
    price: 199,
    rating: 4.8,
    reviews: 145,
    duration: "2.5 ore",
    image: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=600&h=400&fit=crop",
    badge: "Aventură",
    badgeColor: "bg-coral-dark",
  },
  {
    id: 6,
    title: "Tur Ghidat Castelul Bran",
    location: "Bran, Brașov",
    price: 149,
    rating: 4.6,
    reviews: 312,
    duration: "3 ore",
    image: "https://images.unsplash.com/photo-1580213576896-f1e8d2f85d60?w=600&h=400&fit=crop",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function FeaturedExperiences() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: content } = useHomepageContent("featured");
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const sectionContent = content?.content || {
    badge: "Recomandate",
    title: t('featured.title'),
    subtitle: t('featured.subtitle'),
    ctaText: "Vezi Toate"
  };

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const { data, error } = await supabase
          .from('experiences')
          .select(`
            *,
            categories(name),
             experience_images(image_url, is_primary, focal_x, focal_y)
          `)
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;

        const formattedExperiences = data?.map((exp: any) => {
          const primary =
            exp.experience_images?.find((img: any) => img.is_primary) || exp.experience_images?.[0];
          const primaryImageUrl =
            primary?.image_url ||
            "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&h=400&fit=crop";

          return {
            id: exp.id,
            title: exp.title,
            location: exp.location_name,
            price: Number(exp.price),
            originalPrice: exp.original_price ? Number(exp.original_price) : undefined,
            rating: exp.avg_rating || 4.5,
            reviews: exp.total_reviews || 0,
            duration: exp.duration_minutes ? `${Math.floor(exp.duration_minutes / 60)} ore` : "Variabil",
            image: primaryImageUrl,
            focal_x: primary?.focal_x ?? 50,
            focal_y: primary?.focal_y ?? 50,
            badge: exp.categories?.name || null,
            badgeColor: "bg-primary"
          };
        }) || [];

        setExperiences(formattedExperiences);
      } catch (error) {
        console.error('Error fetching experiences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, []);

  return (
    <section id="experiences" className="py-12 lg:py-16 bg-cream">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14"
        >
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              {sectionContent.badge}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {sectionContent.title}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              {sectionContent.subtitle}
            </p>
          </div>
          <Button variant="outline" className="sm:w-auto" asChild>
            <Link to="/category/toate-categoriile">
              {sectionContent.ctaText}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Se încarcă experiențele...</p>
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nu există experiențe disponibile momentan.</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {experiences.map((exp) => (
            <motion.article
              key={exp.id}
              variants={cardVariants}
              whileHover={{ y: -8 }}
              onClick={() => navigate(`/experience/${exp.id}`)}
              className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50 cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <ExperienceImage
                  src={exp.image}
                  alt={exp.title}
                  focalX={exp.focal_x}
                  focalY={exp.focal_y}
                  className="h-full w-full"
                  imgClassName="group-hover:scale-110 transition-transform duration-500"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Wishlist Button */}
                <button className="absolute top-3 right-3 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors shadow-md">
                  <Heart className="w-5 h-5 text-foreground hover:text-primary transition-colors" />
                </button>

                {/* Badge */}
                {exp.badge && (
                  <span className={`absolute top-3 left-3 px-3 py-1 rounded-full ${exp.badgeColor} text-primary-foreground text-xs font-semibold`}>
                    {exp.badge}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Location & Duration */}
                <div className="flex items-center gap-4 text-muted-foreground text-sm mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {exp.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {exp.duration}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {exp.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="font-semibold text-foreground">{exp.rating}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    ({exp.reviews} {t('featured.reviews')})
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">{exp.price} {t('common.lei')}</span>
                    {exp.originalPrice && (
                      <span className="text-muted-foreground line-through text-sm">
                        {exp.originalPrice} {t('common.lei')}
                      </span>
                    )}
                  </div>
                  <Button 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/experience/${exp.id}`);
                    }}
                  >
                    {t('experience.book')}
                  </Button>
                </div>
              </div>
            </motion.article>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
