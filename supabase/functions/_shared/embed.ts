// Embedding helper using Google AI Studio (text-embedding-004 → 768 dims)
const URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const res = await fetch(`${URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: texts.map((t) => ({
        model: "models/text-embedding-004",
        content: { parts: [{ text: t }] },
      })),
    }),
  });
  if (!res.ok) throw new Error(`embeddings ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return (json.embeddings || []).map((e: any) => e.values as number[]);
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embedTexts([text]);
  return v;
}
