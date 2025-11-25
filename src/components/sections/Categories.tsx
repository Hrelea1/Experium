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
const categories = [
  {
    icon: Mountain,
    title: "Aventură",
    slug: "aventura",
    description: "Rafting, paragliding, escaladă",
    count: 87,
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Sparkles,
    title: "Spa & Relaxare",
    slug: "spa-relaxare",
    description: "Masaje, tratamente, wellness",
    count: 124,
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: UtensilsCrossed,
    title: "Gastronomie",
    slug: "gastronomie",
    description: "Degustări, cursuri de gătit",
    count: 93,
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Palette,
    title: "Artă & Cultură",
    slug: "arta-cultura",
    description: "Workshop-uri, tururi ghidate",
    count: 56,
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Dumbbell,
    title: "Sport",
    slug: "sport",
    description: "Golf, tenis, karting",
    count: 72,
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: TreePine,
    title: "Natură",
    slug: "natura",
    description: "Safari, pescuit, camping",
    count: 68,
    color: "from-teal-500 to-green-500",
  },
  {
    icon: Heart,
    title: "Romantic",
    slug: "romantic",
    description: "Cină romantică, escapade",
    count: 45,
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Plane,
    title: "Călătorii",
    slug: "calatorii",
    description: "City break, excursii",
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
            Categorii
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Explorează După Interes
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Alege categoria perfectă pentru tine sau pentru cei dragi și descoperă 
            experiențe memorabile în toată România.
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
              key={category.title}
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
                {category.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                {category.description}
              </p>

              {/* Count Badge */}
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                {category.count} experiențe
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
