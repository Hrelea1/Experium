import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { supabase } from "@/integrations/supabase/client";
import { ExperienceImage } from "@/components/ExperienceImage";

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
              {sectionContent.ctaText} →
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
                  <span>{exp.location}</span>
                  <span>{exp.duration}</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {exp.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-accent">★</span>
                  <span className="font-semibold text-foreground">{exp.rating}</span>
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
