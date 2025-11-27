import { Slider } from "@/components/ui/slider";

interface PriceRangeFilterProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
}

export function PriceRangeFilter({ 
  value, 
  onChange, 
  min = 0, 
  max = 2000 
}: PriceRangeFilterProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{value[0]} lei</span>
        <span className="text-muted-foreground">-</span>
        <span className="font-medium text-foreground">{value[1]} lei</span>
      </div>
      <Slider
        value={value}
        onValueChange={onChange}
        min={min}
        max={max}
        step={50}
        minStepsBetweenThumbs={1}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{min} lei</span>
        <span>{max} lei</span>
      </div>
    </div>
  );
}
