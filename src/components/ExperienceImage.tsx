import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  focalX?: number | null;
  focalY?: number | null;
  className?: string;
  imgClassName?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function ExperienceImage({
  src,
  alt,
  focalX,
  focalY,
  className,
  imgClassName,
}: Props) {
  const x = clamp(typeof focalX === "number" ? focalX : 50, 0, 100);
  const y = clamp(typeof focalY === "number" ? focalY : 50, 0, 100);
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        className={cn("h-full w-full object-cover", imgClassName)}
        style={{ objectPosition: `${x}% ${y}%` }}
        loading="lazy"
      />
    </div>
  );
}
