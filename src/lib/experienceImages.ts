import { supabase } from "@/integrations/supabase/client";

const BUCKET = "experience-images";

function getFileExt(filename: string) {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

export async function uploadExperienceImageFile(params: {
  experienceId: string;
  file: File;
}) {
  const { experienceId, file } = params;

  if (!file.type.startsWith("image/")) {
    throw new Error("Fișier invalid: te rog selectează o imagine.");
  }

  const ext = getFileExt(file.name);
  const fileName = `${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now()}${
    ext ? `.${ext}` : ""
  }`;
  const path = `experiences/${experienceId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Nu am putut genera URL-ul public pentru imagine.");
  }
  return data.publicUrl;
}
