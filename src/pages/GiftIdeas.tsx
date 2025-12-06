import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Gift, Heart, Sparkles, Users, Calendar, Star } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const giftCollections = [
  {
    id: "romantic",
    title: "Cadouri Romantice",
    description: "Experiențe pentru cupluri: cină romantică, spa duo, răsărituri memorabile",
    icon: Heart,
    color: "from-rose-500 to-pink-500",
    slug: "romantic",
    experiences: 45,
  },
  {
    id: "adventure",
    title: "Pentru Aventurieri",
    description: "Adrenalină pură: rafting, paragliding, escaladă, off-road",
    icon: Sparkles,
    color: "from-orange-500 to-red-500",
    slug: "aventura",
    experiences: 87,
  },
  {
    id: "relaxation",
    title: "Relaxare & Wellness",
    description: "Zi de răsfăț: spa, masaje, tratamente de lux",
    icon: Star,
    color: "from-cyan-500 to-blue-500",
    slug: "spa-relaxare",
    experiences: 124,
  },
  {
    id: "gastronomy",
    title: "Experențe Culinare",
    description: "Degustări de vinuri, cooking class, cine gourmet",
    icon: Gift,
    color: "from-amber-500 to-orange-500",
    slug: "gastronomie",
    experiences: 93,
  },
  {
    id: "groups",
    title: "Pentru Grupuri",
    description: "Team building, petreceri, activități de grup memorabile",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    slug: "sport",
    experiences: 72,
  },
  {
    id: "special",
    title: "Ocazii Speciale",
    description: "Zile de naștere, aniversări, momente unice de celebrat",
    icon: Calendar,
    color: "from-purple-500 to-pink-500",
    slug: "toate-categoriile",
    experiences: 200,
  },
];

const GiftIdeas = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/10 to-background">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                <Gift className="w-4 h-4" />
                Idei de Cadouri
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Găsește cadoul perfect pentru orice ocazie
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Descoperă colecțiile noastre tematice și oferă experiențe memorabile celor dragi.
                De la aventuri pline de adrenalină la momente de relaxare, avem ceva pentru fiecare.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Collections Grid */}
        <section className="py-16 lg:py-24">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {giftCollections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/category/${collection.slug}`}>
                    <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:border-primary/30 cursor-pointer overflow-hidden">
                      <CardHeader>
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${collection.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                          <collection.icon className="w-7 h-7 text-white" />
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {collection.title}
                        </CardTitle>
                        <CardDescription>{collection.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {collection.experiences} experiențe
                          </span>
                          <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                            Explorează
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-primary/5">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Ai deja un voucher?
              </h2>
              <p className="text-muted-foreground mb-8">
                Folosește-l acum pentru a-ți rezerva experiența dorită.
              </p>
              <Button asChild size="lg">
                <Link to="/redeem-voucher">
                  <Gift className="w-5 h-5 mr-2" />
                  Folosește Voucher
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GiftIdeas;