import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { useRegions } from "@/hooks/useRegions";

// Static fallback images
import transilvaniaImg from "@/assets/regions/transilvania.jpg";
import bucovinaImg from "@/assets/regions/bucovina.jpg";
import maramuresImg from "@/assets/regions/maramures.jpg";
import dobrogeaImg from "@/assets/regions/dobrogea.jpg";
import banatImg from "@/assets/regions/banat.jpg";

const staticImages: Record<string, string> = {
  transilvania: transilvaniaImg,
  bucovina: bucovinaImg,
  maramures: maramuresImg,
  maramureș: maramuresImg,
  dobrogea: dobrogeaImg,
  banat: banatImg,
};

// Experience counts (could be dynamic in the future)
const experienceCounts: Record<string, number> = {
  transilvania: 156,
  bucovina: 48,
  maramures: 42,
  maramureș: 42,
  dobrogea: 67,
  banat: 54,
  bucurești: 89,
  moldova: 35,
  muntenia: 45,
  oltenia: 28,
};

export function Regions() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: content } = useHomepageContent("regions");
  const { data: dbRegions } = useRegions();

  const sectionContent = content?.content || {
    badge: "Regiuni",
    title: t("regions.title"),
    subtitle: t("regions.subtitle"),
  };

  // Build regions array from DB, with fallback images
  const regions = (dbRegions || []).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    image: r.image_url || staticImages[r.slug.toLowerCase()] || transilvaniaImg,
    experiences: experienceCounts[r.slug.toLowerCase()] || 0,
  }));

  // If no regions in DB, show default set
  const displayRegions =
    regions.length > 0
      ? regions
      : [
          { id: "1", name: "Transilvania", slug: "transilvania", image: transilvaniaImg, experiences: 156 },
          { id: "2", name: "Bucovina", slug: "bucovina", image: bucovinaImg, experiences: 48 },
          { id: "3", name: "Maramureș", slug: "maramures", image: maramuresImg, experiences: 42 },
          { id: "4", name: "Dobrogea", slug: "dobrogea", image: dobrogeaImg, experiences: 67 },
          { id: "5", name: "Banat", slug: "banat", image: banatImg, experiences: 54 },
        ];

  const handleRegionClick = (slug: string) => {
    navigate(`/category/toate-categoriile?region=${slug}`);
  };

  // First region is featured (large)
  const featured = displayRegions[0];
  const others = displayRegions.slice(1);

  return (
    <section id="regions" className="py-12 lg:py-16 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            {sectionContent.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {sectionContent.title}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {sectionContent.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Region - Large */}
          {featured && (
            <motion.div
              onClick={() => handleRegionClick(featured.slug)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="md:col-span-2 lg:row-span-2 group relative rounded-2xl overflow-hidden min-h-[300px] lg:min-h-[500px] cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <img
                src={featured.image}
                alt={featured.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/30 to-transparent group-hover:from-secondary/90 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold mb-3 group-hover:scale-110 transition-transform">
                  Cel mai popular
                </span>
                <h3 className="text-2xl lg:text-4xl font-bold text-card mb-2 group-hover:text-primary transition-colors">
                  {featured.name}
                </h3>
                <p className="text-card/80 mb-4">
                  {featured.experiences} {t("regions.experiences")}
                </p>
                <div className="flex items-center gap-2 text-card font-medium group-hover:text-primary transition-colors">
                  {t("regions.explore")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Other Regions */}
          {others.map((region, index) => (
            <motion.div
              key={region.id}
              onClick={() => handleRegionClick(region.slug)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="group relative rounded-2xl overflow-hidden min-h-[200px] cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <img
                src={region.image}
                alt={region.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/20 to-transparent group-hover:from-secondary/70 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-xl font-bold text-card mb-1 group-hover:text-primary transition-colors">
                  {region.name}
                </h3>
                <p className="text-card/80 text-sm group-hover:text-card transition-colors">
                  {region.experiences} experiențe
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
