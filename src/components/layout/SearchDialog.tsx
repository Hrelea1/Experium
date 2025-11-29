import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { allExperiences } from "@/data/experiences";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(allExperiences.slice(0, 6));
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim()) {
      const filtered = allExperiences.filter(
        (exp) =>
          exp.title.toLowerCase().includes(query.toLowerCase()) ||
          exp.location.toLowerCase().includes(query.toLowerCase()) ||
          exp.category.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered.slice(0, 6));
    } else {
      setResults(allExperiences.slice(0, 6));
    }
  }, [query]);

  const handleSelectExperience = (id: number) => {
    navigate(`/experience/${id}`);
    onOpenChange(false);
    setQuery("");
  };

  const handleViewAll = () => {
    navigate(`/category/toate-categoriile?search=${encodeURIComponent(query)}`);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="sr-only">Caută experiențe</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Caută experiențe, locații, categorii..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base bg-muted border-0"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto px-6 pb-6">
          {results.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {results.map((exp) => (
                  <motion.button
                    key={exp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={() => handleSelectExperience(exp.id)}
                    className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                  >
                    <img
                      src={exp.image}
                      alt={exp.title}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {exp.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {exp.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {exp.location}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        {exp.price} lei
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>

              {query && results.length > 0 && (
                <button
                  onClick={handleViewAll}
                  className="w-full mt-4 py-3 text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Vezi toate rezultatele →
                </button>
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {query
                  ? "Niciun rezultat găsit"
                  : "Începe să cauti experiențe..."}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
