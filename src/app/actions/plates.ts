"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitise } from "@/lib/sanitise";
import { sendNotifEmail } from "@/lib/sendNotifEmail";
import { sendPlateSubmittedEmail } from "@/lib/email";

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

  // Get AI rating — also validates it's actually food
  let aiResult: { rating: number; comment: string; notFood?: boolean };
  try {
    aiResult = await getAIRating(publicUrl, title, description);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[getAIRating] failed:", msg);
    // Don't block the upload — use a real Ramsay-style fallback
    const catchFallbacks = [
      { rating: 5, comment: "Bloody hell, even my camera is refusing to look at this. Could be magnificent, could be a war crime — we'll never know." },
      { rating: 5, comment: "My AI consultant has walked out. On appearances alone though, it looks like it needs help." },
      { rating: 5, comment: "Something went wrong in my kitchen brain. Based on the title alone — I'd approach with caution." },
    ];
    aiResult = catchFallbacks[Math.floor(Math.random() * catchFallbacks.length)];
  }

  if (aiResult.notFood) {
    // Remove the uploaded image since we're rejecting the plate
    await supabase.storage.from("plates").remove([fileName]);
    return { error: "That doesn't look like food. Ramsay says: get out of his kitchen." };
  }

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

  // Notify admin of new pending plate (fire-and-forget)
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    sendPlateSubmittedEmail({
      adminEmail,
      uploaderUsername: profile?.username ?? "unknown",
      plateTitle: title,
      plateId: plate.id,
      aiRating: aiResult.rating,
      aiComment: aiResult.comment,
    }).catch(() => {});
  }

  revalidatePath("/");
  redirect(`/plate/${plate.id}`);
}

async function getAIRating(
  imageUrl: string,
  title: string,
  description: string
): Promise<{ rating: number; comment: string; notFood?: boolean }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) {
    const fallbacks = [
      { rating: 3, comment: "Bloody hell — I've seen better plating at a motorway service station. This is an absolute disgrace. Back to basics." },
      { rating: 5, comment: "It's edible. Just about. The presentation looks like it was plated by someone wearing oven gloves with their eyes closed." },
      { rating: 4, comment: "This dish is crying out for help. The colours are all wrong, the balance is off, and quite frankly it looks like it gave up halfway through." },
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Try Gemini first, fall back to Groq on quota exhaustion
  if (geminiKey) {
    try {
      return await rateWithGemini(geminiKey, imageUrl, title, description);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") && groqKey) {
        console.warn("[getAIRating] Gemini quota hit, falling back to Groq");
      } else if (!groqKey) {
        throw err;
      } else {
        console.warn("[getAIRating] Gemini failed, falling back to Groq:", msg);
      }
    }
  }

  return await rateWithGroq(groqKey!, imageUrl, title, description);

}

function buildRamsayPrompt(title: string, description: string): string {
  return `You are Gordon Ramsay — the world's most brutally honest Michelin-star chef.

STEP 1 — FOOD DETECTION:
Does this image contain food, a prepared dish, a drink, raw ingredients, or anything edible?
Count as NOT FOOD ONLY IF: person, selfie, pet, landscape, building, car, screenshot, meme, cartoon.
If truly NOT food respond ONLY with: {"notFood": true, "rating": 1, "comment": "That's not food. Get out of my kitchen."}

STEP 2 — CRITIQUE (only if IS food):
Dish: "${title}"${description ? ` — "${description}"` : ""}.
Judge: presentation, plating, colours, textures, portion, composition.
Be BRUTALLY honest. Ramsay voice: "bloody hell", "donkey", "disgrace", "stunning", etc.
Score: 1-3=disaster, 4-5=below average, 6-7=solid home cook, 8-9=impressive, 10=near perfection.
2-3 sentences MAX.

Respond ONLY with valid JSON, no markdown:
{"notFood": false, "rating": <integer 1-10>, "comment": "<critique>"}`;
}

function parseRamsayJSON(text: string): { rating: number; comment: string; notFood?: boolean } {
  const clean = text.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(clean);
  if (parsed.notFood) return { rating: 1, comment: "That's not food. Get out of my kitchen.", notFood: true };
  const rating = Math.min(10, Math.max(1, Math.round(Number(parsed.rating))));
  if (!parsed.comment) throw new Error("No comment in AI response");
  return { rating, comment: String(parsed.comment) };
}

async function rateWithGemini(
  apiKey: string,
  imageUrl: string,
  title: string,
  description: string
): Promise<{ rating: number; comment: string; notFood?: boolean }> {
  const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
  const imgBuffer = await imgRes.arrayBuffer();
  const rawMime = imgRes.headers.get("content-type") ?? "image/jpeg";
  const detectedMime = rawMime.split(";")[0].trim();
  const supportedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const mimeType = supportedMimes.includes(detectedMime) ? detectedMime : "image/jpeg";
  const base64 = Buffer.from(imgBuffer).toString("base64");
  const prompt = buildRamsayPrompt(title, description);

  const body = JSON.stringify({
    contents: [{ parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.9, maxOutputTokens: 300 },
  });

  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
  let response: Response | null = null;
  for (const model of models) {
    let lastRes: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body }
      );
      if (r.ok) { response = r; break; }
      if (r.status === 429) {
        lastRes = r;
        if (attempt < 2) await new Promise((res) => setTimeout(res, (attempt + 1) * 2000));
        continue;
      }
      if (r.status === 404 || r.status === 403) break;
      response = r; break;
    }
    if (response) break;
    if (lastRes) { response = lastRes; break; }
  }
  if (!response) throw new Error("No Gemini model available");
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API ${response.status}: ${errText}`);
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`No text in Gemini response: ${JSON.stringify(data)}`);
  return parseRamsayJSON(text);
}

async function rateWithGroq(
  apiKey: string,
  imageUrl: string,
  title: string,
  description: string
): Promise<{ rating: number; comment: string; notFood?: boolean }> {
  const prompt = buildRamsayPrompt(title, description);
  const body = JSON.stringify({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl } },
          { type: "text", text: prompt },
        ],
      },
    ],
    temperature: 0.9,
    max_tokens: 300,
    response_format: { type: "json_object" },
  });

  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body,
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Groq API ${r.status}: ${errText}`);
  }
  const data = await r.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`No text in Groq response: ${JSON.stringify(data)}`);
  return parseRamsayJSON(text);
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
  revalidatePath("/");
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
