import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const Blog = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container pt-28 pb-16">
      <h1 className="text-3xl font-bold mb-2">Blog</h1>
      <p className="text-muted-foreground mb-8">Povești, sfaturi și inspirație pentru următoarea ta aventură.</p>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg">Articolele vor fi disponibile în curând.</p>
        <p className="text-muted-foreground text-sm mt-2">Revino pentru povești despre cele mai frumoase experiențe din România.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Blog;
