import { useState } from "react";
import { motion } from "framer-motion";
import { Handshake, CheckCircle, TrendingUp, Users, Globe, Send } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const benefits = [
  {
    icon: Globe,
    title: "Vizibilitate Națională",
    description: "Expune-ți experiențele către mii de clienți potențiali din toată România.",
  },
  {
    icon: TrendingUp,
    title: "Creșterea Vânzărilor",
    description: "Beneficiază de platforma noastră de marketing și crește-ți veniturile.",
  },
  {
    icon: Users,
    title: "Clienți Noi",
    description: "Atrage clienți care caută experiențe unice și sunt dispuși să plătească pentru calitate.",
  },
  {
    icon: CheckCircle,
    title: "Suport Dedicat",
    description: "Echipa noastră te ajută să-ți optimizezi listările și să maximizezi conversiile.",
  },
];

const Partners = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    experienceType: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Aplicație trimisă cu succes!",
      description: "Echipa noastră te va contacta în curând pentru a discuta despre parteneriat.",
    });

    setFormData({
      businessName: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      experienceType: "",
      description: "",
    });
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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
                <Handshake className="w-4 h-4" />
                Parteneriat
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Devino partenerul nostru
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Alătură-te rețelei Experium și oferă experiențele tale clienților noștri. 
                Împreună creăm amintiri memorabile pentru mii de oameni din România.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 lg:py-24">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                De ce să devii partener Experium?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Oferim toate instrumentele și suportul necesar pentru succesul tău.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full text-center hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <benefit.icon className="w-7 h-7 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{benefit.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Application Form Section */}
        <section className="py-16 lg:py-24 bg-muted/50">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Aplică pentru parteneriat
                </h2>
                <p className="text-muted-foreground">
                  Completează formularul și echipa noastră te va contacta în cel mai scurt timp.
                </p>
              </motion.div>

              <Card>
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Numele firmei *</Label>
                        <Input
                          id="businessName"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          placeholder="SC Experiențe SRL"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactName">Persoană de contact *</Label>
                        <Input
                          id="contactName"
                          name="contactName"
                          value={formData.contactName}
                          onChange={handleChange}
                          placeholder="Ion Popescu"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="contact@firma.ro"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+40 721 234 567"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          name="website"
                          type="url"
                          value={formData.website}
                          onChange={handleChange}
                          placeholder="https://www.firma.ro"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experienceType">Tipul de experiență *</Label>
                        <Input
                          id="experienceType"
                          name="experienceType"
                          value={formData.experienceType}
                          onChange={handleChange}
                          placeholder="ex: Spa, Aventură, Gastronomie"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrierea experiențelor oferite *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Descrieți pe scurt experiențele pe care le oferiți și ce vă diferențiază..."
                        rows={4}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? (
                        "Se trimite..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Trimite aplicația
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 lg:py-24">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Cum funcționează?
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Aplică", description: "Completează formularul de mai sus cu detaliile despre afacerea ta." },
                { step: "2", title: "Discutăm", description: "Echipa noastră te contactează pentru a discuta detaliile parteneriatului." },
                { step: "3", title: "Publicăm", description: "Îți creăm profilul și publicăm experiențele tale pe platformă." },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Partners;