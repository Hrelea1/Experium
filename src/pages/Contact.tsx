import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useHomepageContent } from "@/hooks/useHomepageContent";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { data } = useHomepageContent("contact");
  const content = data?.content as { title?: string; subtitle?: string; phone?: string; email?: string; address?: string; schedule?: string } | undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Mesaj trimis!", description: "Îți vom răspunde în cel mai scurt timp." });
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-28 pb-16">
        <h1 className="text-3xl font-bold mb-2">{content?.title || "Contactează-ne"}</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">{content?.subtitle || "Suntem aici să te ajutăm."}</p>
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl">
          <div>
            <h2 className="text-xl font-semibold mb-6">Trimite-ne un mesaj</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label htmlFor="name">Nume complet</Label><Input id="name" required /></div>
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required /></div>
              <div><Label htmlFor="subject">Subiect</Label><Input id="subject" required /></div>
              <div><Label htmlFor="message">Mesaj</Label><Textarea id="message" rows={5} required /></div>
              <Button type="submit" disabled={loading}>{loading ? "Se trimite..." : "Trimite mesajul"}</Button>
            </form>
          </div>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-6">Informații de contact</h2>
            <div className="space-y-4">
              <a href={`tel:${content?.phone || "+40721234567"}`} className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-5 h-5" /> {content?.phone || "+40 721 234 567"}
              </a>
              <a href={`mailto:${content?.email || "contact@experium.ro"}`} className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-5 h-5" /> {content?.email || "contact@experium.ro"}
              </a>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5" /> {content?.address || "Craiova, România"}
              </div>
            </div>
            <div className="mt-8 p-6 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Program de lucru</h3>
              {(content?.schedule || "Luni-Vineri: 09:00-18:00\nSâmbătă: 10:00-14:00\nDuminică: Închis").split("\n").map((line, i) => (
                <p key={i} className="text-muted-foreground text-sm">{line}</p>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
