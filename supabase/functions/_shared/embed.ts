// Embedding helper using Lovable AI Gateway (Gemini text-embedding-004 → 768 dims)
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(`${GATEWAY}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "raw-fetch",
    },
    body: JSON.stringify({
      model: "google/text-embedding-004",
      input: texts,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`embeddings ${res.status}: ${t}`);
  }
  const json = await res.json();
  return (json.data || []).map((d: any) => d.embedding as number[]);
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embedTexts([text]);
  return v;
}
