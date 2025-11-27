import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Experience } from "@/data/experiences";

export interface FilterState {
  region: string | null;
  county: string | null;
  city: string | null;
  priceRange: [number, number];
  minRating: number | null;
  durations: string[];
  sortBy: string;
}

export function useExperienceFilters(experiences: Experience[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse current filters from URL
  const filters: FilterState = useMemo(() => ({
    region: searchParams.get("region"),
    county: searchParams.get("county"),
    city: searchParams.get("city"),
    priceRange: [
      parseInt(searchParams.get("minPrice") || "0"),
      parseInt(searchParams.get("maxPrice") || "10000"),
    ],
    minRating: searchParams.get("rating") ? parseFloat(searchParams.get("rating")!) : null,
    durations: searchParams.getAll("duration"),
    sortBy: searchParams.get("sort") || "recommended",
  }), [searchParams]);

  // Apply filters
  const filteredExperiences = useMemo(() => {
    let result = [...experiences];

    // Region filter
    if (filters.region) {
      result = result.filter(exp => exp.region === filters.region);
    }

    // County filter
    if (filters.county) {
      result = result.filter(exp => exp.county === filters.county);
    }

    // City filter
    if (filters.city) {
      result = result.filter(exp => exp.city === filters.city);
    }

    // Price range filter
    result = result.filter(exp => 
      exp.price >= filters.priceRange[0] && exp.price <= filters.priceRange[1]
    );

    // Rating filter
    if (filters.minRating) {
      result = result.filter(exp => exp.rating >= filters.minRating!);
    }

    // Duration filter
    if (filters.durations.length > 0) {
      result = result.filter(exp => {
        const minutes = exp.durationMinutes;
        return filters.durations.some(duration => {
          if (duration === "sub-2h") return minutes < 120;
          if (duration === "2-4h") return minutes >= 120 && minutes < 240;
          if (duration === "4-8h") return minutes >= 240 && minutes < 480;
          if (duration === "1-zi") return minutes >= 480 && minutes < 1440;
          if (duration === "multi-zi") return minutes >= 1440;
          return false;
        });
      });
    }

    // Sorting
    switch (filters.sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // Recommended: sort by rating * reviews
        result.sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews));
    }

    return result;
  }, [experiences, filters]);

  // Update filter function
  const updateFilter = (key: keyof FilterState, value: any) => {
    const newParams = new URLSearchParams(searchParams);

    if (key === "priceRange") {
      newParams.set("minPrice", value[0].toString());
      newParams.set("maxPrice", value[1].toString());
    } else if (key === "durations") {
      newParams.delete("duration");
      value.forEach((d: string) => newParams.append("duration", d));
    } else if (value === null || value === "") {
      newParams.delete(key);
    } else {
      newParams.set(key, value.toString());
    }

    setSearchParams(newParams);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchParams({});
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.region) count++;
    if (filters.county) count++;
    if (filters.city) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++;
    if (filters.minRating) count++;
    if (filters.durations.length > 0) count++;
    return count;
  }, [filters]);

  return {
    filters,
    filteredExperiences,
    updateFilter,
    resetFilters,
    activeFiltersCount,
  };
}
