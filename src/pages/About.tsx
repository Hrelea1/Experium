import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { motion } from "framer-motion";
import { Users, Heart, Award, MapPin } from "lucide-react";

export default function About() {
  const { data: content, isLoading } = useHomepageContent("about");

  const aboutContent = content?.content || {
    title: "Despre Experium",
    subtitle: "Povestea noastră",
    description: "Experium este platforma de experiențe cadou din România care conectează oamenii cu aventuri, relaxare și momente memorabile din întreaga țară.",
    mission: "Misiunea noastră este să facem din fiecare cadou o experiență de neuitat.",
    vision: "Viziunea noastră este de a deveni cea mai mare platformă de experiențe din Europa de Est.",
    values: [
      { title: "Pasiune", description: "Suntem pasionați de experiențe autentice" },
      { title: "Calitate", description: "Selectăm cu grijă fiecare partener" },
      { title: "Inovație", description: "Căutăm mereu experiențe noi" },
      { title: "Comunitate", description: "Susținem turismul local" },
    ],
    stats: [
      { value: "500+", label: "Experiențe" },
      { value: "42", label: "Județe" },
      { value: "10,000+", label: "Clienți fericiți" },
      { value: "200+", label: "Parteneri" },
    ],
    teamTitle: "Echipa noastră",
    teamDescription: "O echipă dedicată care lucrează pentru a-ți oferi cele mai bune experiențe.",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              {aboutContent.subtitle}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {aboutContent.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {aboutContent.description}
            </p>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="bg-muted/50 py-12 mb-16">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {(aboutContent.stats || []).map((stat: { value: string; label: string }, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="container mb-16">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-2xl p-8 border"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Misiunea noastră</h2>
              <p className="text-muted-foreground">{aboutContent.mission}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-2xl p-8 border"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Viziunea noastră</h2>
              <p className="text-muted-foreground">{aboutContent.vision}</p>
            </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className="container mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Valorile noastre</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(aboutContent.values || []).map((value: { title: string; description: string }, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 border text-center"
              >
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="container">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">{aboutContent.teamTitle}</h2>
            <p className="text-muted-foreground">{aboutContent.teamDescription}</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
