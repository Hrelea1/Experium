import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Region = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  display_order: number | null;
};

export function useRegions() {
  return useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .order("display_order", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as Region[];
    },
  });
}

export function useUpdateRegionImage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      regionId,
      imageUrl,
    }: {
      regionId: string;
      imageUrl: string;
    }) => {
      const { data, error } = await supabase
        .from("regions")
        .update({ image_url: imageUrl })
        .eq("id", regionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      toast({
        title: "Succes!",
        description: "Imaginea regiunii a fost actualizată",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUploadRegionImage() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Fișierul este prea mare. Mărimea maximă este 5MB.");
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Tip de fișier invalid. Folosește JPG, PNG sau WebP.");
      }

      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const sanitizedFileName = `regions/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("homepage-images")
        .upload(sanitizedFileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("homepage-images")
        .getPublicUrl(sanitizedFileName);

      return data.publicUrl;
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare la încărcare",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
