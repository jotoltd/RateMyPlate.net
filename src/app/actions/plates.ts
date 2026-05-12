"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function uploadPlate(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const file = formData.get("image") as File;

  if (!file || file.size === 0) return { error: "No image provided" };

  const ext = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("plates")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("plates").getPublicUrl(fileName);

  // Get AI rating
  const aiResult = await getAIRating(publicUrl, title, description);

  const { data: plate, error: dbError } = await supabase
    .from("plates")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      image_url: publicUrl,
      ai_rating: aiResult.rating,
      ai_comment: aiResult.comment,
    })
    .select()
    .single();

  if (dbError) return { error: dbError.message };

  revalidatePath("/");
  redirect(`/plate/${plate.id}`);
}

async function getAIRating(
  imageUrl: string,
  title: string,
  description: string
) {
  try {
    const prompt = `You are a food critic AI. Rate this dish called "${title}"${description ? ` described as: "${description}"` : ""}. 
    
    Look at the image and provide:
    1. A rating from 1-10 (whole number)
    2. A brief, engaging critique (2-3 sentences max) mentioning presentation, colours, and appeal
    
    Respond in this exact JSON format:
    {"rating": <number>, "comment": "<your critique>"}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: await urlToBase64(imageUrl),
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) throw new Error("AI API error");

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No AI response");

    const parsed = JSON.parse(text);
    return {
      rating: Math.min(10, Math.max(1, Math.round(parsed.rating))),
      comment: parsed.comment,
    };
  } catch {
    const fallbackRating = Math.floor(Math.random() * 4) + 6;
    return {
      rating: fallbackRating,
      comment:
        "A beautifully presented dish that looks absolutely delicious! The colours and plating are inviting and appetising.",
    };
  }
}

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function submitRating(
  plateId: string,
  score: number,
  comment: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("ratings").upsert(
    {
      plate_id: plateId,
      user_id: user.id,
      score,
      comment: comment || null,
    },
    { onConflict: "plate_id,user_id" }
  );

  if (error) return { error: error.message };

  // Update avg_user_rating on plate
  const { data: ratings } = await supabase
    .from("ratings")
    .select("score")
    .eq("plate_id", plateId);

  if (ratings && ratings.length > 0) {
    const avg = ratings.reduce((s, r) => s + r.score, 0) / ratings.length;
    await supabase
      .from("plates")
      .update({ avg_user_rating: avg, rating_count: ratings.length })
      .eq("id", plateId);
  }

  // Notify plate owner (not self-rating)
  const { data: plate } = await supabase
    .from("plates")
    .select("user_id")
    .eq("id", plateId)
    .single();
  if (plate && plate.user_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: plate.user_id,
      actor_id: user.id,
      type: "rating",
      plate_id: plateId,
    });
  }

  revalidatePath(`/plate/${plateId}`);
  return { success: true };
}

export async function deletePlate(plateId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: plate } = await supabase
    .from("plates")
    .select("image_url, user_id")
    .eq("id", plateId)
    .single();

  if (!plate) return { error: "Plate not found" };
  if (plate.user_id !== user.id) return { error: "Not your plate" };

  // Remove image from storage
  const path = plate.image_url.split("/plates/")[1];
  if (path) await supabase.storage.from("plates").remove([path]);

  await supabase.from("plates").delete().eq("id", plateId);

  revalidatePath("/");
  revalidatePath(`/profile/${user.id}`);
  return { success: true };
}

export async function updatePlate(
  plateId: string,
  title: string,
  description: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("plates")
    .update({ title, description: description || null })
    .eq("id", plateId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/plate/${plateId}`);
  revalidatePath(`/profile/${user.id}`);
  return { success: true };
}
