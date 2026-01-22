import { useCallback, useMemo, useRef } from "react";

type Props = {
  src: string;
  alt: string;
  focalX: number; // 0..100
  focalY: number; // 0..100
  onChange: (next: { focalX: number; focalY: number }) => void;
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Non-destructive framing: click on the image to set a focal point.
 * Stored as percentages and applied with CSS object-position.
 */
export function FocalPointPicker({
  src,
  alt,
  focalX,
  focalY,
  onChange,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  const objectPosition = useMemo(
    () => `${clamp(focalX, 0, 100)}% ${clamp(focalY, 0, 100)}%`,
    [focalX, focalY]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onChange({ focalX: clamp(x, 0, 100), focalY: clamp(y, 0, 100) });
    },
    [onChange]
  );

  if (!src) {
    return (
      <div
        className={
          className ??
          "w-full aspect-[16/9] rounded-md border bg-muted flex items-center justify-center px-3 text-center text-xs text-muted-foreground"
        }
      >
        Setează un URL / încarcă o imagine ca să poți alege punctul de focus.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={
        className ??
        "group relative w-full aspect-[16/9] overflow-hidden rounded-md border bg-muted cursor-crosshair"
      }
      title="Click pe imagine pentru a seta punctul de focus"
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        style={{ objectPosition }}
        loading="lazy"
      />

      <div
        className="pointer-events-none absolute"
        style={{
          left: `${clamp(focalX, 0, 100)}%`,
          top: `${clamp(focalY, 0, 100)}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="h-5 w-5 rounded-full border border-primary/80 bg-background/60 backdrop-blur-sm" />
        <div className="absolute left-1/2 top-1/2 h-10 w-px -translate-x-1/2 -translate-y-1/2 bg-primary/70" />
        <div className="absolute left-1/2 top-1/2 h-px w-10 -translate-x-1/2 -translate-y-1/2 bg-primary/70" />
      </div>

      <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-md bg-background/70 px-2 py-1 text-[11px] text-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        Focus: {Math.round(focalX)}% / {Math.round(focalY)}% (click pentru a schimba)
      </div>
    </div>
  );
}
