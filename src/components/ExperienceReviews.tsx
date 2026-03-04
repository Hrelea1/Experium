import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: { full_name: string | null };
}

interface ExperienceReviewsProps {
  experienceId: string;
}

export function ExperienceReviews({ experienceId }: ExperienceReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("reviews" as any)
        .select("id, rating, comment, created_at, user_id")
        .eq("experience_id", experienceId)
        .order("created_at", { ascending: false })
        .limit(10) as any;

      if (data && data.length > 0) {
        // Fetch profile names
        const userIds = [...new Set(data.map((r: any) => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds as string[]);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

        setReviews(
          data.map((r: any) => ({
            ...r,
            profiles: { full_name: profileMap.get(r.user_id) || null },
          }))
        );
      }
      setLoading(false);
    };
    fetch();
  }, [experienceId]);

  if (loading || reviews.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Recenzii ({reviews.length})
      </h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 font-medium">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {review.profiles?.full_name || "Anonim"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), "dd.MM.yyyy")}
              </span>
            </div>
            {review.comment && (
              <p className="text-sm text-foreground">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
