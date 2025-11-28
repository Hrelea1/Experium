import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Mountain, 
  Sparkles, 
  UtensilsCrossed, 
  Palette, 
  Dumbbell, 
  TreePine, 
  Heart,
  Plane
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHomepageContent } from "@/hooks/useHomepageContent";

const categories = [
  {
    icon: Mountain,
    titleKey: "categories.adventure",
    slug: "aventura",
    descKey: "categories.adventureDesc",
    count: 87,
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Sparkles,
    titleKey: "categories.spa",
    slug: "spa-relaxare",
    descKey: "categories.spaDesc",
    count: 124,
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: UtensilsCrossed,
    titleKey: "categories.gastronomy",
    slug: "gastronomie",
    descKey: "categories.gastronomyDesc",
    count: 93,
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Palette,
    titleKey: "categories.culture",
    slug: "arta-cultura",
    descKey: "categories.cultureDesc",
    count: 56,
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Dumbbell,
    titleKey: "categories.sports",
    slug: "sport",
    descKey: "categories.sportsDesc",
    count: 72,
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: TreePine,
    titleKey: "categories.nature",
    slug: "natura",
    descKey: "categories.natureDesc",
    count: 68,
    color: "from-teal-500 to-green-500",
  },
  {
    icon: Heart,
    titleKey: "categories.romantic",
    slug: "romantic",
    descKey: "categories.romanticDesc",
    count: 45,
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Plane,
    titleKey: "categories.travel",
    slug: "calatorii",
    descKey: "categories.travelDesc",
    count: 34,
    color: "from-indigo-500 to-purple-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function Categories() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: content } = useHomepageContent("categories");
  
  const sectionContent = content?.content || {
    badge: "Categorii",
    title: t('categories.title'),
    subtitle: t('categories.subtitle')
  };

  return (
    <section id="categories" className="py-20 lg:py-28 bg-background">
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

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6"
        >
          {categories.map((category) => (
            <motion.div
              key={category.titleKey}
              onClick={() => navigate(`/category/${category.slug}`)}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer overflow-hidden border border-border/50"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <category.icon className="w-7 h-7 text-card" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {t(category.titleKey)}
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                {t(category.descKey)}
              </p>

              {/* Count Badge */}
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                {category.count} {t('categories.experiences')}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
