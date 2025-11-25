import { motion } from "framer-motion";
import { Search, Gift, Calendar, PartyPopper } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Alege Experiența",
    description: "Explorează categoriile și găsește experiența perfectă pentru tine sau cei dragi.",
  },
  {
    icon: Gift,
    title: "Oferă Cadoul",
    description: "Primește un voucher digital sau fizic, personalizat cu un mesaj special.",
  },
  {
    icon: Calendar,
    title: "Programează",
    description: "Beneficiarul alege data și locația care i se potrivește cel mai bine.",
  },
  {
    icon: PartyPopper,
    title: "Bucurați-vă!",
    description: "Trăiește momente memorabile și creează amintiri de neuitat.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 lg:py-28 bg-secondary text-secondary-foreground overflow-hidden">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-semibold mb-4">
            Cum funcționează
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Simplu ca 1, 2, 3, 4
          </h2>
          <p className="text-secondary-foreground/80 text-lg max-w-2xl mx-auto">
            Oferirea de experiențe cadou nu a fost niciodată mai simplă. 
            Urmează acești pași și surprinde pe cei dragi.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative text-center"
            >
              {/* Step Number */}
              <div className="relative z-10 w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <step.icon className="w-9 h-9 text-primary-foreground" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-secondary-foreground/70">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
