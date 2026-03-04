import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Pagina nu a fost găsită</p>
        <Button asChild variant="outline">
          <Link to="/" className="inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            Înapoi la pagina principală
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
