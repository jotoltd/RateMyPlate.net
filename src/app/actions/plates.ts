"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitise } from "@/lib/sanitise";
import { sendNotifEmail } from "@/lib/sendNotifEmail";

export async function uploadPlate(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Rate limit: max 5 uploads per user per day
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("plates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= 5) return { error: "You can only upload 5 plates per day. Try again tomorrow!" };

  const title = sanitise(formData.get("title") as string);
  const description = sanitise((formData.get("description") as string) || "");
  const category = sanitise((formData.get("category") as string) || "other");
  const file = formData.get("image") as File;

  if (!file || file.size === 0) return { error: "No image provided" };
  if (file.size > 10 * 1024 * 1024) return { error: "Image must be under 10MB" };
  if (!file.type.startsWith("image/")) return { error: "File must be an image" };

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
      category,
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
    const prompt = `You are Gordon Ramsay — the world's most brutally honest, foul-mouthed (but bleeped) Michelin-star chef. You do NOT sugarcoat. You call out every flaw with sharp wit and zero mercy, but when something genuinely impresses you, you grudgingly admit it.

You are rating a dish called "${title}"${description ? ` described as: "${description}"` : ""}.

Study the image carefully. Judge it on:
- Presentation & plating (is it restaurant-quality or a student's first attempt?)
- Colour, texture, and visual appeal
- Portion size & balance
- Whether it looks actually cooked/edible or an absolute disaster

Rules:
- Be BRUTALLY honest. If it looks terrible, destroy it. If it's decent, say so with backhanded praise. If it's genuinely good, reluctant admiration only.
- Write in Gordon Ramsay's voice — sharp, direct, colourful. Use "bloody hell", "donkey", "disgrace", "stunning", etc. as appropriate.
- DO NOT be generically positive. The rating must reflect reality.
- Rating distribution guide: 1-3 = genuinely awful (raw, burnt, disgusting plating), 4-5 = below average, 6-7 = decent home cook level, 8-9 = impressive, 10 = near perfection (rarely given).
- Critique must be 2-3 sentences MAX. No fluff.

Respond ONLY in this exact JSON format (no markdown, no extra text):
{"rating": <integer 1-10>, "comment": "<your critique in Ramsay's voice>"}`;

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

    // Strip markdown code fences if Gemini wraps the JSON
    const clean = text.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);
    const rating = Math.min(10, Math.max(1, Math.round(Number(parsed.rating))));
    if (!parsed.comment) throw new Error("No comment in response");
    return { rating, comment: String(parsed.comment) };
  } catch {
    const fallbacks = [
      { rating: 3, comment: "Bloody hell — I've seen better plating at a motorway service station. This is an absolute disgrace. Back to basics." },
      { rating: 5, comment: "It's edible. Just about. The presentation looks like it was plated by someone wearing oven gloves with their eyes closed." },
      { rating: 4, comment: "This dish is crying out for help. The colours are all wrong, the balance is off, and quite frankly it looks like it gave up halfway through." },
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
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

  // Rate limit: max 20 ratings per hour
  const sinceRating = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: ratingCount } = await supabase
    .from("ratings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", sinceRating);
  if ((ratingCount ?? 0) >= 20) return { error: "You're rating too fast. Slow down a bit!" };

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
    const actorRes = await supabase.from("profiles").select("username").eq("id", user.id).single();
    const plateInfoRes = await supabase.from("plates").select("title").eq("id", plateId).single();
    sendNotifEmail({
      recipientUserId: plate.user_id,
      actorUserId: user.id,
      actorUsername: actorRes.data?.username ?? "Someone",
      type: "rating",
      plateTitle: plateInfoRes.data?.title,
      plateId,
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
