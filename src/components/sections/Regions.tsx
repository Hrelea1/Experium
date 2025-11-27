import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import transilvaniaImg from "@/assets/regions/transilvania.jpg";
import bucovinaImg from "@/assets/regions/bucovina.jpg";
import maramuresImg from "@/assets/regions/maramures.jpg";
import dobrogeaImg from "@/assets/regions/dobrogea.jpg";
import banatImg from "@/assets/regions/banat.jpg";

const regions = [
  {
    name: "Transilvania",
    experiences: 156,
    image: transilvaniaImg,
    featured: true,
  },
  {
    name: "Bucovina",
    experiences: 48,
    image: bucovinaImg,
  },
  {
    name: "Maramureș",
    experiences: 42,
    image: maramuresImg,
  },
  {
    name: "Dobrogea",
    experiences: 67,
    image: dobrogeaImg,
  },
  {
    name: "Banat",
    experiences: 54,
    image: banatImg,
  },
];

export function Regions() {
  const navigate = useNavigate();

  const handleRegionClick = (regionName: string) => {
    navigate(`/category/all?region=${regionName}`);
  };

  return (
    <section id="regions" className="py-20 lg:py-28 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Regiuni
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Descoperă România
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explorează experiențe unice în cele mai frumoase regiuni ale țării,
            de la munții Carpați la litoralul Mării Negre.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Region - Large */}
          <motion.div
            onClick={() => handleRegionClick(regions[0].name)}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -8 }}
            className="md:col-span-2 lg:row-span-2 group relative rounded-2xl overflow-hidden min-h-[300px] lg:min-h-[500px] cursor-pointer"
          >
            <img
              src={regions[0].image}
              alt={regions[0].name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
              <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold mb-3">
                Cel mai popular
              </span>
              <h3 className="text-2xl lg:text-4xl font-bold text-card mb-2">
                {regions[0].name}
              </h3>
              <p className="text-card/80 mb-4">
                {regions[0].experiences} experiențe disponibile
              </p>
              <div className="flex items-center gap-2 text-card font-medium group-hover:text-primary transition-colors">
                Explorează
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </motion.div>

          {/* Other Regions */}
          {regions.slice(1).map((region, index) => (
            <motion.div
              key={region.name}
              onClick={() => handleRegionClick(region.name)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl overflow-hidden min-h-[200px] cursor-pointer"
            >
              <img
                src={region.image}
                alt={region.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-xl font-bold text-card mb-1">
                  {region.name}
                </h3>
                <p className="text-card/80 text-sm">
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
