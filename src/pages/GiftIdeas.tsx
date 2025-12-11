import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Gift, Heart, Sparkles, Users, Calendar, Star } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

const GiftIdeas = () => {
  const { t } = useTranslation();

  const giftCollections = [
    {
      id: "romantic",
      titleKey: "giftIdeas.romantic",
      descKey: "giftIdeas.romanticDesc",
      icon: Heart,
      color: "from-rose-500 to-pink-500",
      slug: "romantic",
      experiences: 45,
    },
    {
      id: "adventure",
      titleKey: "giftIdeas.adventure",
      descKey: "giftIdeas.adventureDesc",
      icon: Sparkles,
      color: "from-orange-500 to-red-500",
      slug: "aventura",
      experiences: 87,
    },
    {
      id: "relaxation",
      titleKey: "giftIdeas.relaxation",
      descKey: "giftIdeas.relaxationDesc",
      icon: Star,
      color: "from-cyan-500 to-blue-500",
      slug: "spa-relaxare",
      experiences: 124,
    },
    {
      id: "gastronomy",
      titleKey: "giftIdeas.gastronomy",
      descKey: "giftIdeas.gastronomyDesc",
      icon: Gift,
      color: "from-amber-500 to-orange-500",
      slug: "gastronomie",
      experiences: 93,
    },
    {
      id: "groups",
      titleKey: "giftIdeas.groups",
      descKey: "giftIdeas.groupsDesc",
      icon: Users,
      color: "from-green-500 to-emerald-500",
      slug: "sport",
      experiences: 72,
    },
    {
      id: "special",
      titleKey: "giftIdeas.special",
      descKey: "giftIdeas.specialDesc",
      icon: Calendar,
      color: "from-purple-500 to-pink-500",
      slug: "toate-categoriile",
      experiences: 200,
    },
  ];

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
                {t('giftIdeas.title')}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                {t('giftIdeas.heroTitle')}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {t('giftIdeas.heroSubtitle')}
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
                          {t(collection.titleKey)}
                        </CardTitle>
                        <CardDescription>{t(collection.descKey)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {collection.experiences} {t('giftIdeas.experiences')}
                          </span>
                          <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                            {t('common.explore')}
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
                {t('giftIdeas.haveVoucher')}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t('giftIdeas.haveVoucherDesc')}
              </p>
              <Button asChild size="lg">
                <Link to="/redeem-voucher">
                  <Gift className="w-5 h-5 mr-2" />
                  {t('giftIdeas.useVoucher')}
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