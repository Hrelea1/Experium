import { FilterState } from "@/hooks/useExperienceFilters";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { PriceRangeFilter } from "./PriceRangeFilter";
import { RegionFilter } from "./RegionFilter";
import { RatingFilter } from "./RatingFilter";
import { DurationFilter } from "./DurationFilter";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onReset: () => void;
  resultCount: number;
}

export function FilterSidebar({ filters, onFilterChange, onReset, resultCount }: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState({
    location: true,
    price: true,
    rating: true,
    duration: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-foreground">Filtre</h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Resetează
        </Button>
      </div>

      <div className="space-y-6">
        {/* Location Filter */}
        <Collapsible open={openSections.location} onOpenChange={() => toggleSection("location")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <span className="font-semibold text-foreground">Locație</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${openSections.location ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <RegionFilter
              region={filters.region}
              county={filters.county}
              city={filters.city}
              onRegionChange={(value) => onFilterChange("region", value)}
              onCountyChange={(value) => onFilterChange("county", value)}
              onCityChange={(value) => onFilterChange("city", value)}
            />
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-border" />

        {/* Price Filter */}
        <Collapsible open={openSections.price} onOpenChange={() => toggleSection("price")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <span className="font-semibold text-foreground">Preț</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${openSections.price ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <PriceRangeFilter
              value={filters.priceRange}
              onChange={(value) => onFilterChange("priceRange", value)}
              max={2000}
            />
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-border" />

        {/* Rating Filter */}
        <Collapsible open={openSections.rating} onOpenChange={() => toggleSection("rating")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <span className="font-semibold text-foreground">Rating</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${openSections.rating ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <RatingFilter
              value={filters.minRating}
              onChange={(value) => onFilterChange("minRating", value)}
            />
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-border" />

        {/* Duration Filter */}
        <Collapsible open={openSections.duration} onOpenChange={() => toggleSection("duration")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <span className="font-semibold text-foreground">Durată</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${openSections.duration ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <DurationFilter
              value={filters.durations}
              onChange={(value) => onFilterChange("durations", value)}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Results Count */}
      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-sm text-center text-muted-foreground">
          <span className="font-bold text-primary">{resultCount}</span> experiențe găsite
        </p>
      </div>
    </div>
  );
}
