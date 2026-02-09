import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container pt-28 pb-16 max-w-3xl prose prose-neutral dark:prose-invert">
      <h1>Politica de Confidențialitate</h1>
      <p className="text-muted-foreground">Ultima actualizare: Februarie 2026</p>
      <h2>1. Date colectate</h2>
      <p>Colectăm informații precum: numele, adresa de email, numărul de telefon și detaliile de plată necesare pentru procesarea comenzilor.</p>
      <h2>2. Scopul prelucrării</h2>
      <p>Datele sunt utilizate pentru: procesarea comenzilor, comunicarea cu utilizatorii, îmbunătățirea serviciilor și respectarea obligațiilor legale.</p>
      <h2>3. Partajarea datelor</h2>
      <p>Datele personale nu sunt vândute terților. Informațiile necesare sunt partajate doar cu furnizorii de experiențe pentru realizarea rezervărilor.</p>
      <h2>4. Securitate</h2>
      <p>Implementăm măsuri tehnice și organizatorice adecvate pentru protecția datelor personale.</p>
      <h2>5. Drepturile utilizatorilor</h2>
      <p>Aveți dreptul de acces, rectificare, ștergere, restricționare și portabilitate a datelor. Contactați-ne la privacy@experium.ro.</p>
    </main>
    <Footer />
  </div>
);

export default Privacy;
