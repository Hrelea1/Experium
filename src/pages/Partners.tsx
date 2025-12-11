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
import { useTranslation } from "react-i18next";

const Partners = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
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

  const benefits = [
    {
      icon: Globe,
      titleKey: "partners.visibility",
      descKey: "partners.visibilityDesc",
    },
    {
      icon: TrendingUp,
      titleKey: "partners.sales",
      descKey: "partners.salesDesc",
    },
    {
      icon: Users,
      titleKey: "partners.clients",
      descKey: "partners.clientsDesc",
    },
    {
      icon: CheckCircle,
      titleKey: "partners.support",
      descKey: "partners.supportDesc",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: t('partners.successTitle'),
      description: t('partners.successDesc'),
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

  const steps = [
    { step: "1", titleKey: "partners.step1Title", descKey: "partners.step1Desc" },
    { step: "2", titleKey: "partners.step2Title", descKey: "partners.step2Desc" },
    { step: "3", titleKey: "partners.step3Title", descKey: "partners.step3Desc" },
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
                <Handshake className="w-4 h-4" />
                {t('partners.badge')}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                {t('partners.heroTitle')}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {t('partners.heroSubtitle')}
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
                {t('partners.whyPartner')}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('partners.whyPartnerSubtitle')}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.titleKey}
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
                      <CardTitle className="text-lg">{t(benefit.titleKey)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{t(benefit.descKey)}</CardDescription>
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
                  {t('partners.applyTitle')}
                </h2>
                <p className="text-muted-foreground">
                  {t('partners.applySubtitle')}
                </p>
              </motion.div>

              <Card>
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">{t('partners.businessName')} *</Label>
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
                        <Label htmlFor="contactName">{t('partners.contactName')} *</Label>
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
                        <Label htmlFor="email">{t('partners.email')} *</Label>
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
                        <Label htmlFor="phone">{t('partners.phone')} *</Label>
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
                        <Label htmlFor="website">{t('partners.website')}</Label>
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
                        <Label htmlFor="experienceType">{t('partners.experienceType')} *</Label>
                        <Input
                          id="experienceType"
                          name="experienceType"
                          value={formData.experienceType}
                          onChange={handleChange}
                          placeholder={t('partners.experienceTypePlaceholder')}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">{t('partners.description')} *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder={t('partners.descriptionPlaceholder')}
                        rows={4}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? (
                        t('partners.submitting')
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {t('partners.submit')}
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
                {t('partners.howItWorks')}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {steps.map((item, index) => (
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
                  <h3 className="text-xl font-semibold mb-2">{t(item.titleKey)}</h3>
                  <p className="text-muted-foreground">{t(item.descKey)}</p>
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