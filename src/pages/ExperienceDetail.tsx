import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  Calendar,
  Heart,
  Share2,
  Check,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BookingForm } from "@/components/booking/BookingForm";

// Mock data - in production this would come from an API
const experiencesData: Record<string, {
  id: number;
  title: string;
  location: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  duration: string;
  image: string;
  gallery: string[];
  description: string;
  includes: string[];
  maxParticipants: number;
}> = {
  "1": {
    id: 1,
    title: "Zbor cu Balonul în Transilvania",
    location: "Brașov, Transilvania",
    price: 899,
    originalPrice: 1099,
    rating: 4.9,
    reviews: 127,
    duration: "3 ore",
    image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=1200&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1495539406979-bf61750d02c0?w=600&h=400&fit=crop",
    ],
    description: "Trăiește o experiență de neuitat cu un zbor cu balonul cu aer cald deasupra peisajelor spectaculoase ale Transilvaniei. Admiră cetățile medievale, pădurile de conifere și munții Carpați dintr-o perspectivă unică.",
    includes: ["Transport de la hotel", "Mic dejun champagne", "Certificat de zbor", "Fotografii profesionale", "Asigurare"],
    maxParticipants: 6,
  },
  "2": {
    id: 2,
    title: "Degustare de Vinuri Premium",
    location: "Dealu Mare, Muntenia",
    price: 349,
    rating: 4.8,
    reviews: 89,
    duration: "4 ore",
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=600&h=400&fit=crop",
    ],
    description: "Descoperă secretele vinurilor românești într-o degustare ghidată de sommelieri experimentați. Vizitează cramele tradiționale și învață despre procesul de producție al celor mai apreciate vinuri din regiune.",
    includes: ["Tur al cramei", "Degustare 6 vinuri", "Platou tradițional", "Ghid specializat"],
    maxParticipants: 12,
  },
  "3": {
    id: 3,
    title: "Retreat Spa & Wellness",
    location: "Băile Felix, Bihor",
    price: 599,
    rating: 4.9,
    reviews: 203,
    duration: "1 zi",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
    ],
    description: "O zi completă de relaxare și răsfăț într-unul dintre cele mai renumite complexe balneare din România. Include tratamente spa, acces la piscine termale și mese gourmet.",
    includes: ["Acces piscine termale", "Masaj relaxare 60 min", "Tratament facial", "Prânz gourmet", "Halat și papuci"],
    maxParticipants: 2,
  },
  "4": {
    id: 4,
    title: "Curs de Gătit Tradițional",
    location: "Sibiu, Transilvania",
    price: 279,
    rating: 4.7,
    reviews: 56,
    duration: "5 ore",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&h=400&fit=crop",
    ],
    description: "Învață să prepari cele mai delicioase rețete tradiționale românești alături de un chef experimentat. De la sarmale la cozonac, descoperă secretele bucătăriei noastre.",
    includes: ["Ingrediente premium", "Rețetar complet", "Șorț personalizat", "Masă completă", "Certificat participare"],
    maxParticipants: 8,
  },
  "5": {
    id: 5,
    title: "Rafting pe Olt",
    location: "Călimănești, Vâlcea",
    price: 199,
    rating: 4.8,
    reviews: 145,
    duration: "2.5 ore",
    image: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=1200&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1517868163143-6eb6c78dbf54?w=600&h=400&fit=crop",
    ],
    description: "O aventură plină de adrenalină pe apele repezi ale Oltului. Perfect pentru iubitorii de natură și senzații tari, cu instructori certificați și echipament profesional.",
    includes: ["Echipament complet", "Instructor certificat", "Asigurare", "Fotografii", "Gustare energizantă"],
    maxParticipants: 8,
  },
  "6": {
    id: 6,
    title: "Tur Ghidat Castelul Bran",
    location: "Bran, Brașov",
    price: 149,
    rating: 4.6,
    reviews: 312,
    duration: "3 ore",
    image: "https://images.unsplash.com/photo-1580213576896-f1e8d2f85d60?w=1200&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1580213576896-f1e8d2f85d60?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=600&h=400&fit=crop",
    ],
    description: "Explorează legendarul Castel Bran, cunoscut în întreaga lume ca și Castelul lui Dracula. Un tur ghidat care îți dezvăluie istoria fascinantă și miturile care înconjoară acest loc iconic.",
    includes: ["Bilet intrare", "Ghid autorizat", "Audio guide", "Hartă istorică", "Discount suveniruri"],
    maxParticipants: 15,
  },
};

export default function ExperienceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const experience = id ? experiencesData[id] : null;

  if (!experience) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Experiența nu a fost găsită</h1>
          <Button onClick={() => navigate("/")}>Înapoi la pagina principală</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Back Button */}
        <div className="container py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Înapoi
          </Button>
        </div>

        <div className="container pb-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Images & Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Main Image */}
              <div className="relative rounded-2xl overflow-hidden mb-4">
                <img
                  src={experience.gallery[selectedImage]}
                  alt={experience.title}
                  className="w-full h-[400px] object-cover"
                />
                
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors shadow-md"
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? "fill-primary text-primary" : "text-foreground"}`} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors shadow-md">
                    <Share2 className="w-5 h-5 text-foreground" />
                  </button>
                </div>

                {/* Discount Badge */}
                {experience.originalPrice && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    -{Math.round((1 - experience.price / experience.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex gap-3">
                {experience.gallery.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative rounded-lg overflow-hidden flex-1 h-20 ${
                      selectedImage === index ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Details */}
              <div className="mt-8">
                {/* Location & Duration */}
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {experience.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {experience.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Max {experience.maxParticipants} persoane
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  {experience.title}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-accent text-accent" />
                    <span className="font-semibold text-foreground">{experience.rating}</span>
                  </div>
                  <span className="text-muted-foreground">
                    ({experience.reviews} recenzii)
                  </span>
                </div>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {experience.description}
                </p>

                {/* What's Included */}
                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    Ce include
                  </h3>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {experience.includes.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-muted-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Booking Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:sticky lg:top-24 lg:self-start"
            >
              <BookingForm 
                experience={experience}
              />
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
