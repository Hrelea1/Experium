import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const GDPR = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container pt-28 pb-16 max-w-3xl prose prose-neutral dark:prose-invert">
      <h1>Conformitate GDPR</h1>
      <p className="text-muted-foreground">Ultima actualizare: Februarie 2026</p>
      <h2>Angajamentul nostru</h2>
      <p>Experium respectă Regulamentul General privind Protecția Datelor (GDPR) al Uniunii Europene. Protecția datelor dumneavoastră personale este o prioritate.</p>
      <h2>Drepturile dumneavoastră</h2>
      <ul>
        <li><strong>Dreptul de acces</strong> — puteți solicita o copie a datelor personale</li>
        <li><strong>Dreptul la rectificare</strong> — puteți corecta datele inexacte</li>
        <li><strong>Dreptul la ștergere</strong> — puteți solicita ștergerea datelor</li>
        <li><strong>Dreptul la portabilitate</strong> — puteți primi datele într-un format structurat</li>
        <li><strong>Dreptul de opoziție</strong> — vă puteți opune prelucrării datelor</li>
      </ul>
      <h2>Responsabilul cu protecția datelor</h2>
      <p>Pentru orice solicitare GDPR, contactați-ne la: <a href="mailto:gdpr@experium.ro">gdpr@experium.ro</a></p>
    </main>
    <Footer />
  </div>
);

export default GDPR;
