import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";

interface RatingFilterProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const ratingOptions = [
  { value: 4.0, label: "4.0+" },
  { value: 4.5, label: "4.5+" },
  { value: 4.8, label: "4.8+" },
];

export function RatingFilter({ value, onChange }: RatingFilterProps) {
  return (
    <RadioGroup
      value={value?.toString() || ""}
      onValueChange={(v) => onChange(v ? parseFloat(v) : null)}
    >
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="" id="rating-all" />
          <Label htmlFor="rating-all" className="cursor-pointer">
            Toate rating-urile
          </Label>
        </div>
        {ratingOptions.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value.toString()} id={`rating-${option.value}`} />
            <Label htmlFor={`rating-${option.value}`} className="cursor-pointer flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
}
