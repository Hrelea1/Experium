import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const regions = [
  "Toate Regiunile",
  "Transilvania",
  "Moldova",
  "Muntenia",
  "Dobrogea",
  "Oltenia",
  "Banat",
  "Maramureș",
  "Bucovina",
];

const categories = [
  "Toate Categoriile",
  "Aventură",
  "Spa & Relaxare",
  "Gastronomie",
  "Artă & Cultură",
  "Sport",
  "Natură",
  "Romantic",
];

export function Hero() {
  const [selectedRegion, setSelectedRegion] = useState("Toate Regiunile");
  const [selectedCategory, setSelectedCategory] = useState("Toate Categoriile");
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
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
            Peste 500+ experiențe unice în România
          </motion.span>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-card mb-6 leading-tight">
            Oferă Momente
            <span className="block text-primary">Memorabile</span>
          </h1>

          <p className="text-lg sm:text-xl text-card/90 mb-10 max-w-2xl mx-auto">
            Descoperă cele mai frumoase experiențe din România. De la aventuri 
            în natură la relaxare la spa, găsește cadoul perfect pentru cei dragi.
          </p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl p-4 shadow-xl max-w-3xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-3">
              {/* Region Dropdown */}
              <div className="relative flex-1">
                <button
                  onClick={() => {
                    setIsRegionOpen(!isRegionOpen);
                    setIsCategoryOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-muted rounded-xl text-left hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">{selectedRegion}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isRegionOpen ? "rotate-180" : ""}`} />
                </button>
                {isRegionOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border z-20 max-h-60 overflow-auto">
                    {regions.map((region) => (
                      <button
                        key={region}
                        onClick={() => {
                          setSelectedRegion(region);
                          setIsRegionOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="relative flex-1">
                <button
                  onClick={() => {
                    setIsCategoryOpen(!isCategoryOpen);
                    setIsRegionOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-muted rounded-xl text-left hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">{selectedCategory}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
                </button>
                {isCategoryOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border z-20 max-h-60 overflow-auto">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsCategoryOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Button */}
              <Button size="lg" className="md:w-auto">
                <Search className="w-5 h-5 mr-2" />
                Caută
              </Button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 mt-12"
          >
            {[
              { value: "500+", label: "Experiențe" },
              { value: "42", label: "Județe" },
              { value: "50k+", label: "Clienți Fericiți" },
              { value: "4.9★", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-card">{stat.value}</div>
                <div className="text-card/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-8 h-12 rounded-full border-2 border-card/50 flex items-start justify-center p-2"
        >
          <div className="w-1.5 h-3 bg-card/70 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
