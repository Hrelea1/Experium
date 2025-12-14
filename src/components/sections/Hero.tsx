import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Sparkles, ChevronDown, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroBg from "@/assets/hero-bg.jpg";
import { useHomepageContent } from "@/hooks/useHomepageContent";

const categories = [
  "hero.allCategories",
  "categories.adventure",
  "categories.spa",
  "categories.gastronomy",
  "categories.culture",
  "categories.sports",
  "categories.nature",
  "categories.romantic",
];

// Map translation keys to URL slugs
const categorySlugMap: Record<string, string> = {
  "hero.allCategories": "toate-categoriile",
  "categories.adventure": "aventura",
  "categories.spa": "spa-relaxare",
  "categories.gastronomy": "gastronomie",
  "categories.culture": "arta-cultura",
  "categories.sports": "sport",
  "categories.nature": "natura",
  "categories.romantic": "romantic",
};

export function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("hero.allCategories");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const { data: content } = useHomepageContent("hero");
  
  const heroContent = content?.content || {
    title: t('hero.title'),
    titleHighlight: "",
    subtitle: t('hero.subtitle'),
    badge: t('hero.badge'),
    ctaPrimary: t('hero.discover'),
    ctaPrimaryLink: "/category/toate-categoriile",
    ctaSecondary: t('hero.hasVoucher'),
    ctaSecondaryLink: "/redeem-voucher",
    backgroundImage: "",
  };

  const backgroundImage = heroContent.backgroundImage || heroBg;

  const handleSearch = () => {
    const slug = categorySlugMap[selectedCategory];
    navigate(`/category/${slug}`);
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt="Romanian landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 via-secondary/40 to-secondary/80" />
      </div>

      {/* Content */}
      <div className="container relative z-10 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/20 backdrop-blur-sm text-card text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            {heroContent.badge}
          </motion.span>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-card mb-6 leading-tight">
            {heroContent.title}
            <span className="block text-primary">{heroContent.titleHighlight}</span>
          </h1>

          <p className="text-lg sm:text-xl text-card/90 mb-10 max-w-2xl mx-auto">
            {heroContent.subtitle}
          </p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
          >
            <Button asChild size="lg" className="group">
              <Link to={heroContent.ctaPrimaryLink}>
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                {heroContent.ctaPrimary}
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="group bg-card/20 backdrop-blur-sm border border-card/30 hover:bg-card/30 text-card hover:text-card">
              <Link to={heroContent.ctaSecondaryLink}>
                <Gift className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                {heroContent.ctaSecondary}
              </Link>
            </Button>
          </motion.div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl p-4 shadow-xl max-w-3xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-3">
              {/* Category Dropdown */}
              <div className="relative flex-1">
                <button
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-muted rounded-xl text-left hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">{t(selectedCategory)}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
                </button>
                {isCategoryOpen && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-2xl border border-border max-h-80 overflow-auto z-[100]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsCategoryOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl text-foreground"
                      >
                        {t(category)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Button */}
              <Button size="lg" className="md:w-auto" onClick={handleSearch}>
                <Search className="w-5 h-5 mr-2" />
                {t('hero.search')}
              </Button>

              {/* Show on Map Button */}
              <Button 
                size="lg" 
                variant="secondary" 
                className="md:w-auto"
                asChild
              >
                <Link to="/map">
                  <MapPin className="w-5 h-5 mr-2" />
                  {t('hero.showOnMap')}
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}