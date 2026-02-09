import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type HomepageContent = {
  id: string;
  section_key: string;
  content: Record<string, any>;
  updated_at: string;
};

export function useHomepageContent(sectionKey: string) {
  return useQuery({
    queryKey: ["homepage-content", sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_content")
        .select("*")
        .eq("section_key", sectionKey)
        .single();

      if (error) throw error;
      return data as HomepageContent;
    },
  });
}

export function useAllHomepageContent() {
  return useQuery({
    queryKey: ["homepage-content", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_content")
        .select("*")
        .order("section_key");

      if (error) throw error;
      return data as HomepageContent[];
    },
  });
}

export function useUpdateHomepageContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      sectionKey,
      content,
    }: {
      sectionKey: string;
      content: Record<string, any>;
    }) => {
      // Validate section key
      if (!sectionKey || sectionKey.length > 50) {
        throw new Error("Section key invalid");
      }

      // Validate content is an object
      if (!content || typeof content !== "object" || Array.isArray(content)) {
        throw new Error("Conținutul trebuie să fie un obiect valid");
      }

      // Sanitize string values (remove potentially dangerous characters)
      const sanitizeString = (str: string): string => {
        if (typeof str !== "string") return str;
        // Remove any HTML/script tags
        return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                  .replace(/<[^>]*>/g, "")
                  .trim();
      };

      // Recursively sanitize all string values in content
      const sanitizeContent = (obj: any): any => {
        if (typeof obj === "string") return sanitizeString(obj);
        if (Array.isArray(obj)) return obj.map(sanitizeContent);
        if (typeof obj === "object" && obj !== null) {
          return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, sanitizeContent(v)])
          );
        }
        return obj;
      };

      const sanitizedContent = sanitizeContent(content);

      const { data, error } = await supabase
        .from("homepage_content")
        .upsert({ section_key: sectionKey, content: sanitizedContent }, { onConflict: 'section_key' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-content"] });
      toast({
        title: "Succes!",
        description: "Conținutul a fost actualizat",
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

export function useUploadHomepageImage() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      // Security validations
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Fișierul este prea mare. Mărimea maximă este 5MB.");
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Tip de fișier invalid. Folosește JPG, PNG sau WebP.");
      }

      // Sanitize filename
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const sanitizedFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
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