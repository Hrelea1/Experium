import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Star, MapPin, Clock, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Mock data - all experiences with categories
const allExperiences = [
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
    category: "aventură",
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
    category: "gastronomie",
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
    category: "spa & relaxare",
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
    category: "gastronomie",
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
    category: "aventură",
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
    category: "artă & cultură",
  },
  {
    id: 7,
    title: "Masaj Relaxant Full Body",
    location: "București",
    price: 299,
    rating: 4.9,
    reviews: 178,
    duration: "1.5 ore",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&h=400&fit=crop",
    category: "spa & relaxare",
  },
  {
    id: 8,
    title: "Paragliding în Carpați",
    location: "Brașov, Transilvania",
    price: 450,
    rating: 4.8,
    reviews: 92,
    duration: "2 ore",
    image: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=600&h=400&fit=crop",
    category: "aventură",
  },
  {
    id: 9,
    title: "Workshop Pictură",
    location: "Cluj-Napoca",
    price: 189,
    rating: 4.7,
    reviews: 45,
    duration: "3 ore",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=400&fit=crop",
    category: "artă & cultură",
  },
  {
    id: 10,
    title: "Cină Romantică pe Yacht",
    location: "Constanța, Dobrogea",
    price: 799,
    rating: 4.9,
    reviews: 67,
    duration: "3 ore",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    category: "romantic",
  },
  {
    id: 11,
    title: "Lecție de Golf",
    location: "București",
    price: 350,
    rating: 4.6,
    reviews: 34,
    duration: "2 ore",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop",
    category: "sport",
  },
  {
    id: 12,
    title: "Safari Foto Delta Dunării",
    location: "Tulcea, Dobrogea",
    price: 499,
    rating: 4.9,
    reviews: 156,
    duration: "1 zi",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop",
    category: "natură",
  },
];

const categoryTitles: Record<string, string> = {
  "aventura": "Aventură",
  "spa-relaxare": "Spa & Relaxare",
  "gastronomie": "Gastronomie",
  "arta-cultura": "Artă & Cultură",
  "sport": "Sport",
  "natura": "Natură",
  "romantic": "Romantic",
  "calatorii": "Călătorii",
};

const categoryMapping: Record<string, string> = {
  "aventura": "aventură",
  "spa-relaxare": "spa & relaxare",
  "gastronomie": "gastronomie",
  "arta-cultura": "artă & cultură",
  "sport": "sport",
  "natura": "natură",
  "romantic": "romantic",
  "calatorii": "călătorii",
};

export default function CategorySearch() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  
  const categoryKey = category?.toLowerCase() || "";
  const categoryTitle = categoryTitles[categoryKey] || "Toate Experiențele";
  const categoryFilter = categoryMapping[categoryKey];
  
  const filteredExperiences = categoryFilter 
    ? allExperiences.filter(exp => exp.category === categoryFilter)
    : allExperiences;

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
              {categoryTitle}
            </motion.h1>
            <p className="text-primary-foreground/80 text-lg">
              {filteredExperiences.length} experiențe disponibile
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-card border-b border-border sticky top-16 z-30">
          <div className="container py-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtre
              </Button>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                Preț: Orice
              </Button>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                Rating: 4+
              </Button>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                Durată: Orice
              </Button>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="container py-10">
          {filteredExperiences.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-4">
                Nu am găsit experiențe în această categorie.
              </p>
              <Button onClick={() => navigate("/")}>
                Vezi toate experiențele
              </Button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
      </main>

      <Footer />
    </div>
  );
}
