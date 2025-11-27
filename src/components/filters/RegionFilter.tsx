import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { regions, getCountiesForRegion, getCitiesForCounty } from "@/data/locations";

interface RegionFilterProps {
  region: string | null;
  county: string | null;
  city: string | null;
  onRegionChange: (value: string | null) => void;
  onCountyChange: (value: string | null) => void;
  onCityChange: (value: string | null) => void;
}

export function RegionFilter({
  region,
  county,
  city,
  onRegionChange,
  onCountyChange,
  onCityChange,
}: RegionFilterProps) {
  const availableCounties = region ? getCountiesForRegion(region) : [];
  const availableCities = region && county ? getCitiesForCounty(region, county) : [];

  const handleRegionChange = (value: string) => {
    onRegionChange(value === "all" ? null : value);
    onCountyChange(null);
    onCityChange(null);
  };

  const handleCountyChange = (value: string) => {
    onCountyChange(value === "all" ? null : value);
    onCityChange(null);
  };

  const handleCityChange = (value: string) => {
    onCityChange(value === "all" ? null : value);
  };

  return (
    <div className="space-y-3">
      {/* Region */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Regiune
        </label>
        <Select value={region || "all"} onValueChange={handleRegionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Toate regiunile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate regiunile</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* County */}
      {region && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Județ
          </label>
          <Select value={county || "all"} onValueChange={handleCountyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Toate județele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate județele</SelectItem>
              {availableCounties.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* City */}
      {region && county && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Oraș
          </label>
          <Select value={city || "all"} onValueChange={handleCityChange}>
            <SelectTrigger>
              <SelectValue placeholder="Toate orașele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate orașele</SelectItem>
              {availableCities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
