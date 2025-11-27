import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DurationFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const durationOptions = [
  { value: "sub-2h", label: "Sub 2 ore" },
  { value: "2-4h", label: "2-4 ore" },
  { value: "4-8h", label: "4-8 ore" },
  { value: "1-zi", label: "1 zi" },
  { value: "multi-zi", label: "Mai multe zile" },
];

export function DurationFilter({ value, onChange }: DurationFilterProps) {
  const handleToggle = (duration: string) => {
    if (value.includes(duration)) {
      onChange(value.filter(d => d !== duration));
    } else {
      onChange([...value, duration]);
    }
  };

  return (
    <div className="space-y-2">
      {durationOptions.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <Checkbox
            id={`duration-${option.value}`}
            checked={value.includes(option.value)}
            onCheckedChange={() => handleToggle(option.value)}
          />
          <Label 
            htmlFor={`duration-${option.value}`} 
            className="cursor-pointer text-sm font-normal"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
