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
      const { data, error } = await supabase
        .from("homepage_content")
        .update({ content })
        .eq("section_key", sectionKey)
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
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("homepage-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("homepage-images")
        .getPublicUrl(filePath);

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