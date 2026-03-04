import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ReviewFormProps {
  bookingId: string;
  experienceId: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({ bookingId, experienceId, onReviewSubmitted }: ReviewFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast({ title: "Selectează un rating", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews" as any).insert({
        user_id: user.id,
        experience_id: experienceId,
        booking_id: bookingId,
        rating,
        comment: comment.trim() || null,
      } as any);

      if (error) throw error;

      toast({ title: "Recenzie trimisă", description: "Mulțumim pentru feedback!" });
      onReviewSubmitted();
    } catch (error: any) {
      const msg = error.message?.includes("duplicate")
        ? "Ai lăsat deja o recenzie pentru această rezervare"
        : "Nu am putut trimite recenzia";
      toast({ title: "Eroare", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 p-4 border border-border rounded-xl bg-muted/30">
      <Label className="text-sm font-medium">Lasă o recenzie</Label>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="text-2xl transition-colors"
          >
            <span className={
              star <= (hoveredRating || rating)
                ? "text-amber-500"
                : "text-muted-foreground/30"
            }>
              ★
            </span>
          </button>
        ))}
        {rating > 0 && (
          <span className="text-sm text-muted-foreground ml-2 self-center">{rating}/5</span>
        )}
      </div>

      <Textarea
        placeholder="Spune-ne cum a fost experiența... (opțional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
      />

      <Button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        size="sm"
      >
        {submitting ? "Se trimite..." : "Trimite recenzia"}
      </Button>
    </div>
  );
}
