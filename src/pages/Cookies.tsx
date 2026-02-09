import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const Cookies = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container pt-28 pb-16 max-w-3xl prose prose-neutral dark:prose-invert">
      <h1>Politica de Cookies</h1>
      <p className="text-muted-foreground">Ultima actualizare: Februarie 2026</p>
      <h2>Ce sunt cookie-urile?</h2>
      <p>Cookie-urile sunt fișiere mici de text stocate pe dispozitivul dumneavoastră atunci când vizitați site-ul nostru.</p>
      <h2>Cookie-uri utilizate</h2>
      <ul>
        <li><strong>Esențiale:</strong> necesare pentru funcționarea site-ului (autentificare, coș de cumpărături)</li>
        <li><strong>Analitice:</strong> ne ajută să înțelegem cum este utilizat site-ul</li>
        <li><strong>Funcționale:</strong> rețin preferințele dumneavoastră</li>
      </ul>
      <h2>Gestionarea cookie-urilor</h2>
      <p>Puteți gestiona preferințele de cookie-uri din setările browserului dumneavoastră. Dezactivarea cookie-urilor esențiale poate afecta funcționalitatea site-ului.</p>
    </main>
    <Footer />
  </div>
);

export default Cookies;
