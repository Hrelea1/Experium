import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { Categories } from "@/components/sections/Categories";
import { FeaturedExperiences } from "@/components/sections/FeaturedExperiences";
import { Regions } from "@/components/sections/Regions";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Testimonials } from "@/components/sections/Testimonials";
import { Newsletter } from "@/components/sections/Newsletter";
import { Footer } from "@/components/layout/Footer";
import { AIAssistant } from "@/components/AIAssistant";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Categories />
        <FeaturedExperiences />
        <Regions />
        <HowItWorks />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
};

export default Index;
