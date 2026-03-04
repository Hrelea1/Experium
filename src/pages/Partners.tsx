import { useState } from "react";
import { motion } from "framer-motion";
import {
  Handshake, CheckCircle, TrendingUp, Users, Globe, Send,
  Eye, Phone, CreditCard, CalendarCheck, Shield, MapPin,
  Rocket, Building, AlertTriangle
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Partners = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    city: "",
    experience_type: "",
    description: "",
    website: "",
    gdpr_consent: false,
    terms_accepted: false,
  });

  const problems = [
    { icon: Eye, text: "Vizibilitate limitată – clienții nu te găsesc online" },
    { icon: Phone, text: "Rezervări prin telefon sau Instagram – pierdere de timp" },
    { icon: AlertTriangle, text: "Lipsă sistem automat de rezervări și plăți" },
    { icon: CreditCard, text: "Marketing costisitor fără rezultate garantate" },
    { icon: Users, text: "Dependență totală de recomandări" },
  ];

  const benefits = [
    { icon: Users, title: "Acces la clienți noi", desc: "Mii de utilizatori caută experiențe unice pe platforma noastră" },
    { icon: TrendingUp, title: "Marketing fără cost fix", desc: "Investim în promovare pentru tine, plătești doar la rezultat" },
    { icon: CalendarCheck, title: "Sistem digital de rezervări", desc: "Clienții rezervă online 24/7, tu primești confirmare instant" },
    { icon: Shield, title: "Control total", desc: "Setezi prețurile, disponibilitatea și politica de anulare" },
    { icon: Globe, title: "Vizibilitate națională", desc: "Experiența ta devine vizibilă în toată România" },
    { icon: CheckCircle, title: "Suport dedicat", desc: "Echipă dedicată care te ajută să crești" },
  ];

  const steps = [
    { step: "1", title: "Listezi experiența", desc: "Creezi un profil cu descrierea, pozele și prețul experiențelor tale." },
    { step: "2", title: "Clientul rezervă online", desc: "Clienții descoperă experiența ta și rezervă direct pe platformă." },
    { step: "3", title: "Platforma procesează plata", desc: "Plata se face securizat. Tu nu trebuie să te ocupi de nimic." },
    { step: "4", title: "Livrezi experiența", desc: "Te concentrezi pe ce faci mai bine – să oferi o experiență memorabilă." },
  ];

  const collaboration = [
    "Fără taxă de listare",
    "Fără abonament lunar",
    "Comision doar la rezervare confirmată",
    "Control total asupra prețurilor și disponibilității",
  ];

  const growth = [
    { phase: "Faza 1", desc: "Lansare pilot în Dolj" },
    { phase: "Faza 2", desc: "Extindere în București, Cluj, Brașov" },
    { phase: "Faza 3", desc: "Creștere la nivel național" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gdpr_consent || !formData.terms_accepted) {
      toast({ title: "Trebuie să accepți termenii și GDPR", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { error } = await supabase.from("partner_applications").insert({
      full_name: formData.full_name,
      business_name: formData.business_name,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      experience_type: formData.experience_type,
      description: formData.description,
      website: formData.website || null,
      gdpr_consent: formData.gdpr_consent,
      terms_accepted: formData.terms_accepted,
    });

    setLoading(false);
    if (error) {
      toast({ title: "Eroare", description: "Nu s-a putut trimite aplicația. Încearcă din nou.", variant: "destructive" });
    } else {
      toast({ title: "Aplicație trimisă cu succes! 🎉", description: "Echipa noastră te va contacta în curând." });
      setFormData({ full_name: "", business_name: "", email: "", phone: "", city: "", experience_type: "", description: "", website: "", gdpr_consent: false, terms_accepted: false });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/10 to-background">
          <div className="container text-center max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                <Handshake className="w-4 h-4" />Devino Furnizor Fondator
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Tu creezi experiența, noi o facem vizibilă.
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Alătură-te Experium – marketplace-ul digital care conectează furnizori de experiențe cu clienți din toată România.
              </p>
              <Button size="lg" onClick={() => document.getElementById("apply-form")?.scrollIntoView({ behavior: "smooth" })}>
                <Send className="w-4 h-4 mr-2" />Aplică Acum
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Problem */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Problema furnizorilor locali</h2>
              <p className="text-muted-foreground">Dacă te regăsești în aceste situații, Experium este soluția.</p>
            </motion.div>
            <div className="grid gap-4 max-w-2xl mx-auto">
              {problems.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                  <p.icon className="w-5 h-5 text-destructive shrink-0" />
                  <p className="text-sm">{p.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What is Experium */}
        <section className="py-16 lg:py-24">
          <div className="container max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Building className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Ce este Experium?</h2>
              <p className="text-muted-foreground text-lg mb-6">
                Un marketplace digital care listează experiențele tale, procesează rezervări și plăți, 
                aplicând un comision doar la vânzare confirmată. <strong>Fără taxă de listare. Fără abonament inițial.</strong>
              </p>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Cum funcționează?</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {steps.map((s, i) => (
                <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                    {s.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 lg:py-24">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Beneficii pentru furnizori</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((b, i) => (
                <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                        <b.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{b.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{b.desc}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Collaboration Model */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Model de colaborare</h2>
            </motion.div>
            <div className="grid gap-3 max-w-lg mx-auto">
              {collaboration.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Growth Plan */}
        <section className="py-16 lg:py-24">
          <div className="container max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
              <Rocket className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-3xl font-bold mb-4">Plan de creștere</h2>
            </motion.div>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              {growth.map((g, i) => (
                <motion.div key={g.phase} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                  className="flex-1 p-6 rounded-xl border bg-card text-center">
                  <div className="text-sm font-bold text-primary mb-1">{g.phase}</div>
                  <p className="text-muted-foreground text-sm">{g.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Application Form */}
        <section id="apply-form" className="py-16 lg:py-24 bg-muted/30">
          <div className="container max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Aplică ca Partener</h2>
              <p className="text-muted-foreground">Completează formularul și echipa noastră te va contacta în 24-48 ore.</p>
            </motion.div>

            <Card>
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nume complet *</Label>
                      <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required placeholder="Ion Popescu" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Numele business-ului *</Label>
                      <Input id="business_name" name="business_name" value={formData.business_name} onChange={handleChange} required placeholder="SC Aventuri SRL" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="contact@firma.ro" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon *</Label>
                      <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="+40 721 234 567" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Oraș *</Label>
                      <Input id="city" name="city" value={formData.city} onChange={handleChange} required placeholder="Craiova" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience_type">Tip experiență *</Label>
                      <Input id="experience_type" name="experience_type" value={formData.experience_type} onChange={handleChange} required placeholder="ex: Aventură, Spa, Gastronomie" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrierea experiențelor *</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={4}
                      placeholder="Descrieți pe scurt experiențele pe care le oferiți și ce vă diferențiază..." />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website / Instagram (opțional)</Label>
                    <Input id="website" name="website" value={formData.website} onChange={handleChange} placeholder="https://www.firma.ro sau @instagram" />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-2">
                      <Checkbox id="gdpr" checked={formData.gdpr_consent}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, gdpr_consent: !!checked }))} />
                      <Label htmlFor="gdpr" className="text-sm leading-snug cursor-pointer">
                        Sunt de acord cu prelucrarea datelor personale conform politicii GDPR *
                      </Label>
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox id="terms" checked={formData.terms_accepted}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, terms_accepted: !!checked }))} />
                      <Label htmlFor="terms" className="text-sm leading-snug cursor-pointer">
                        Accept termenii și condițiile platformei Experium *
                      </Label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Se trimite..." : (
                      <><Send className="w-4 h-4 mr-2" />Trimite Aplicația</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Partners;
