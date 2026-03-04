import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Gift, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: content } = useHomepageContent("newsletter");
  
  const sectionContent = content?.content || {
    title: t('newsletter.title'),
    subtitle: t('newsletter.subtitle'),
    placeholder: t('newsletter.placeholder'),
    ctaText: t('newsletter.button'),
    disclaimer: "Ne angajăm să nu îți trimitem spam. Poți să te dezabonezi oricând."
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !gdprConsent) {
      if (!gdprConsent) toast({ title: "Consimțământ GDPR", description: "Trebuie să accepți termenii pentru a te abona.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email,
      gdpr_consent: true,
      gdpr_consent_date: new Date().toISOString(),
      segment: "general",
    });
    setIsLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Deja abonat", description: "Acest email este deja înregistrat." });
      } else {
        toast({ title: "Eroare", description: "Nu am putut salva abonamentul.", variant: "destructive" });
      }
      return;
    }

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail("");
      setGdprConsent(false);
    }, 3000);
  };

  return (
    <section id="contact" className="py-12 lg:py-16 bg-background relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Gift className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {sectionContent.title}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            {sectionContent.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={sectionContent.placeholder}
                  className="w-full h-12 px-5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitted || isLoading || !gdprConsent}
                className="sm:w-auto"
              >
                {isSubmitted ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {t('newsletter.success')}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {isLoading ? "Se trimite..." : sectionContent.ctaText}
                  </>
                )}
              </Button>
            </div>
            <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                className="mt-1 rounded border-border"
              />
              <span>Sunt de acord cu prelucrarea datelor personale conform <a href="/#/gdpr" className="text-primary underline">Politicii GDPR</a> și doresc să primesc newsletter.</span>
            </label>
          </form>

          <p className="text-muted-foreground text-sm mt-4">
            {sectionContent.disclaimer}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
