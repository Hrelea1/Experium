import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maria Popescu",
    location: "București",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "Am oferit soțului meu zborul cu balonul de ziua lui și a fost cea mai frumoasă surpriză! Recomand cu încredere.",
    experience: "Zbor cu Balonul",
  },
  {
    name: "Andrei Ionescu",
    location: "Cluj-Napoca",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "Experiența de rafting a fost incredibilă! Organizare impecabilă și ghizi profesioniști. Cu siguranță vom reveni.",
    experience: "Rafting pe Olt",
  },
  {
    name: "Elena Dumitrescu",
    location: "Timișoara",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "Retreat-ul spa a fost exact ce aveam nevoie. Un cadou perfect de la prietena mea. Servicii excelente!",
    experience: "Spa & Wellness",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Recenzii
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Ce Spun Clienții Noștri
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Peste 50,000 de clienți fericiți au trăit experiențe memorabile prin platforma noastră.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 lg:p-8 shadow-card border border-border/50 relative"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Experience Tag */}
              <span className="inline-block px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm mb-6">
                {testimonial.experience}
              </span>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-muted-foreground text-sm">{testimonial.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
