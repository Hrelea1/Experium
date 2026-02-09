import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin } from "lucide-react";

const positions = [
  { title: "Full Stack Developer", location: "Remote / Craiova", type: "Full-time" },
  { title: "Marketing Manager", location: "Craiova", type: "Full-time" },
  { title: "Customer Support", location: "Remote", type: "Part-time" },
];

const Careers = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container pt-28 pb-16">
      <h1 className="text-3xl font-bold mb-2">Cariere</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">Vino alături de echipa Experium și ajută-ne să oferim experiențe de neuitat în toată România.</p>
      <div className="grid gap-4 max-w-3xl">
        {positions.map((pos, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" />{pos.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{pos.location}</span>
                <span>{pos.type}</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:cariere@experium.ro?subject=Aplicare: {pos.title}">Aplică</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default Careers;
