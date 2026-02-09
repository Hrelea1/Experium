import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Cum funcționează un voucher Experium?", a: "Achiziționezi un voucher pentru experiența dorită, primești un cod unic pe email, apoi îl folosești pentru a rezerva o dată convenabilă. Voucherul este valabil 12 luni de la achiziție." },
  { q: "Pot oferi un voucher cadou?", a: "Da! La checkout poți selecta opțiunea de cadou. Voucherul poate fi trimis direct persoanei dorite sau descărcat ca PDF." },
  { q: "Cum anulez o rezervare?", a: "Poți anula gratuit cu cel puțin 48 de ore înainte de experiență din secțiunea 'Rezervările mele' din dashboard." },
  { q: "Pot reprograma o rezervare?", a: "Da, fiecare rezervare poate fi reprogramată o singură dată, fără costuri, cu minim 48 de ore înainte." },
  { q: "Ce se întâmplă dacă voucherul expiră?", a: "Voucherele au o valabilitate de 12 luni. După expirare, nu mai pot fi utilizate, dar poți contacta echipa noastră pentru soluții alternative." },
  { q: "Cum devin furnizor de experiențe?", a: "Contactează-ne prin formularul de parteneri sau trimite un email la contact@experium.ro cu detalii despre experiențele pe care le oferi." },
  { q: "Este inclus TVA-ul în preț?", a: "Da, toate prețurile afișate pe platformă includ TVA." },
  { q: "Cum plătesc?", a: "Acceptăm plăți online prin card bancar. Toate tranzacțiile sunt procesate securizat." },
];

const FAQ = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container pt-28 pb-16">
      <h1 className="text-3xl font-bold mb-2">Întrebări Frecvente</h1>
      <p className="text-muted-foreground mb-8">Răspunsuri la cele mai comune întrebări despre Experium.</p>
      <Accordion type="single" collapsible className="max-w-3xl">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
            <AccordionContent>{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
    <Footer />
  </div>
);

export default FAQ;
