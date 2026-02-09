import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container pt-28 pb-16 max-w-3xl prose prose-neutral dark:prose-invert">
      <h1>Termeni și Condiții</h1>
      <p className="text-muted-foreground">Ultima actualizare: Februarie 2026</p>
      <h2>1. Informații generale</h2>
      <p>Platforma Experium este operată de Experium SRL, cu sediul în Craiova, România. Prin accesarea și utilizarea platformei, acceptați acești termeni și condiții.</p>
      <h2>2. Servicii</h2>
      <p>Experium oferă o platformă de intermediere între utilizatori și furnizori de experiențe. Nu suntem furnizori direcți ai experiențelor listate pe platformă.</p>
      <h2>3. Vouchere</h2>
      <p>Voucherele achiziționate prin platformă sunt valabile 12 luni de la data achiziției. Prețurile includ TVA. Voucherele nu sunt rambursabile după achiziție, cu excepția situațiilor prevăzute de lege.</p>
      <h2>4. Rezervări și anulări</h2>
      <p>Anularea gratuită este disponibilă cu cel puțin 48 de ore înainte de data experieneței. Reprogramarea este permisă o singură dată per rezervare.</p>
      <h2>5. Limitarea răspunderii</h2>
      <p>Experium nu este responsabil pentru calitatea experiențelor furnizate de partenerii noștri, dar depunem toate eforturile pentru a asigura standarde ridicate.</p>
      <h2>6. Modificări</h2>
      <p>Ne rezervăm dreptul de a modifica acești termeni. Utilizatorii vor fi notificați prin email despre modificări semnificative.</p>
    </main>
    <Footer />
  </div>
);

export default Terms;
