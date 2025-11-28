import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Star, MapPin, Clock, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { allExperiences, categoryTitles, categoryMapping } from "@/data/experiences";
import { useExperienceFilters } from "@/hooks/useExperienceFilters";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { ActiveFilters } from "@/components/filters/ActiveFilters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export default function CategorySearch() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  const categoryKey = category?.toLowerCase() || "";
  const regionParam = searchParams.get('region');
  
  const categoryTitle = categoryTitles[categoryKey] || "Toate Experiențele";
  const categoryFilter = categoryMapping[categoryKey];
  
  // Filter by category first
  let categoryExperiences = categoryFilter 
    ? allExperiences.filter(exp => exp.category === categoryFilter)
    : allExperiences;
  
  // Then filter by region if parameter exists
  if (regionParam) {
    categoryExperiences = categoryExperiences.filter(exp => 
      exp.region.toLowerCase() === regionParam.toLowerCase()
    );
  }

  const { 
    filters, 
    filteredExperiences, 
    updateFilter, 
    resetFilters,
    activeFiltersCount 
  } = useExperienceFilters(categoryExperiences);

  // Build active filters array for display
  const activeFilters = [];
  if (filters.region) {
    activeFilters.push({
      key: "region",
      label: filters.region,
      onRemove: () => updateFilter("region", null),
    });
  }
  if (filters.county) {
    activeFilters.push({
      key: "county",
      label: filters.county,
      onRemove: () => updateFilter("county", null),
    });
  }
  if (filters.city) {
    activeFilters.push({
      key: "city",
      label: filters.city,
      onRemove: () => updateFilter("city", null),
    });
  }
  if (filters.minRating) {
    activeFilters.push({
      key: "rating",
      label: `Rating ${filters.minRating}+`,
      onRemove: () => updateFilter("minRating", null),
    });
  }
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
    activeFilters.push({
      key: "price",
      label: `${filters.priceRange[0]}-${filters.priceRange[1]} lei`,
      onRemove: () => updateFilter("priceRange", [0, 10000]),
    });
  }
  filters.durations.forEach((duration) => {
    const labels: Record<string, string> = {
      "sub-2h": "Sub 2h",
      "2-4h": "2-4h",
      "4-8h": "4-8h",
      "1-zi": "1 zi",
      "multi-zi": "Multi-zi",
    };
    activeFilters.push({
      key: `duration-${duration}`,
      label: labels[duration],
      onRemove: () => updateFilter("durations", filters.durations.filter(d => d !== duration)),
    });
  });

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
              {categoryExperiences.length} experiențe disponibile
            </p>
          </div>
        </div>

        {/* Filters & Results Section */}
        <div className="container py-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filter Sidebar */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <FilterSidebar
                filters={filters}
                onFilterChange={updateFilter}
                onReset={resetFilters}
                resultCount={filteredExperiences.length}
              />
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Filter Button & Sort */}
              <div className="flex items-center justify-between gap-4 mb-6">
                {/* Mobile Filters */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filtre {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filtre</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSidebar
                        filters={filters}
                        onFilterChange={updateFilter}
                        onReset={resetFilters}
                        resultCount={filteredExperiences.length}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    Sortare:
                  </span>
                  <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
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
              </div>

              {/* Active Filters */}
              <div className="mb-6">
                <ActiveFilters filters={activeFilters} onResetAll={resetFilters} />
              </div>

              {/* Results Grid */}
              {filteredExperiences.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg mb-4">
                    Nu am găsit experiențe care să corespundă filtrelor selectate.
                  </p>
                  <Button onClick={resetFilters}>
                    Resetează filtrele
                  </Button>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {filteredExperiences.map((exp, index) => (
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
                          src={exp.image}
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
                        {exp.originalPrice && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                            -{Math.round((1 - exp.price / exp.originalPrice) * 100)}%
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Location & Duration */}
                        <div className="flex items-center gap-3 text-muted-foreground text-xs mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {exp.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {exp.duration}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {exp.title}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="w-4 h-4 fill-accent text-accent" />
                          <span className="font-semibold text-sm text-foreground">{exp.rating}</span>
                          <span className="text-muted-foreground text-xs">
                            ({exp.reviews})
                          </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-primary">{exp.price} lei</span>
                          {exp.originalPrice && (
                            <span className="text-muted-foreground line-through text-sm">
                              {exp.originalPrice} lei
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
