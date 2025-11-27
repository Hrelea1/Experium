import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onResetAll: () => void;
}

export function ActiveFilters({ filters, onResetAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Active:</span>
      {filters.map((filter) => (
        <Badge 
          key={filter.key} 
          variant="secondary" 
          className="gap-1 pr-1 hover:bg-secondary/80"
        >
          {filter.label}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={filter.onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onResetAll}
        className="h-7 text-xs"
      >
        Resetează toate
      </Button>
    </div>
  );
}
