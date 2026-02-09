import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { Loader2 } from "lucide-react";

const defaultFaqs = [
  { q: "Cum funcționează un voucher Experium?", a: "Achiziționezi un voucher, primești un cod unic, apoi rezervi." },
  { q: "Pot oferi un voucher cadou?", a: "Da! La checkout selectezi opțiunea de cadou." },
  { q: "Este inclus TVA-ul?", a: "Da, toate prețurile includ TVA." },
];

const FAQ = () => {
  const { data, isLoading } = useHomepageContent("faq");
  const content = data?.content as { items?: { q: string; a: string }[] } | undefined;
  const faqs = content?.items || defaultFaqs;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-28 pb-16">
        <h1 className="text-3xl font-bold mb-2">Întrebări Frecvente</h1>
        <p className="text-muted-foreground mb-8">Răspunsuri la cele mai comune întrebări despre Experium.</p>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <Accordion type="single" collapsible className="max-w-3xl">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
