import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RegionNotificationSignupProps {
  regionSlug: string;
  regionName: string;
}

export function RegionNotificationSignup({ regionSlug, regionName }: RegionNotificationSignupProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // First get the region ID from slug
      const { data: region } = await supabase
        .from("regions")
        .select("id")
        .eq("slug", regionSlug)
        .single();

      if (!region) {
        toast({ title: "Eroare", description: "Regiunea nu a fost găsită.", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("region_notifications").insert({
        region_id: region.id,
        email,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Deja înregistrat", description: "Acest email este deja abonat pentru această regiune." });
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast({ title: "Succes!", description: "Te vom notifica când apar experiențe noi." });
      }
    } catch {
      toast({ title: "Eroare", description: "Nu am putut salva abonamentul.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">✓</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Mulțumim!</h3>
        <p className="text-muted-foreground">
          Te vom notifica pe email când apar experiențe noi în {regionName}.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <h3 className="text-xl font-bold text-foreground mb-2">
        Nu există experiențe momentan în {regionName}
      </h3>
      <p className="text-muted-foreground mb-6">
        Lasă adresa ta de email și te notificăm când apar experiențe noi în această regiune.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="adresa@email.com"
          required
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Se trimite..." : "Notifică-mă"}
        </Button>
      </form>
    </div>
  );
}
