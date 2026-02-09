import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { Loader2 } from "lucide-react";

const Terms = () => {
  const { data, isLoading } = useHomepageContent("terms");
  const content = data?.content as { title?: string; lastUpdated?: string; sections?: { heading: string; text: string }[] } | undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-28 pb-16 max-w-3xl">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">{content?.title || "Termeni și Condiții"}</h1>
            <p className="text-muted-foreground mb-8">Ultima actualizare: {content?.lastUpdated || "Februarie 2026"}</p>
            <div className="space-y-6">
              {(content?.sections || []).map((section, i) => (
                <div key={i}>
                  <h2 className="text-xl font-semibold mb-2">{section.heading}</h2>
                  <p className="text-muted-foreground">{section.text}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
