// Evaluation: compares user decision against retrieved protocols → compliance + AAR
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { embedOne } from "../_shared/embed.ts";

const supa = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { simulation_id, decision, context } = await req.json();
    if (!decision) return json({ error: "decision required" }, 400);

    // Retrieve relevant protocols
    const embedding = await embedOne(decision + " " + (context || ""));
    const { data: matches } = await supa.rpc("match_chunks", {
      query_embedding: embedding as any,
      query_text: decision,
      match_count: 5,
      hazard_filter: null,
    });

    const protocols = (matches || []).map((m: any) => m.content);

    // LLM compliance scoring
    const key = Deno.env.get("LOVABLE_API_KEY")!;
    const sys = `You are an emergency-response auditor. Score the user's decision against retrieved protocols.
Return strict JSON: {"compliance_score": 0-100, "critical_mistakes": [string], "quality_metrics": {"timeliness": 0-100, "protocol_adherence": 0-100, "communication": 0-100, "resource_use": 0-100}, "after_action_report": "short markdown"}.`;
    const user = `DECISION:\n${decision}\n\nCONTEXT:\n${context || "n/a"}\n\nRETRIEVED PROTOCOLS:\n${protocols.map((p: string, i: number) => `[${i + 1}] ${p}`).join("\n\n")}`;

    const llm = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "raw-fetch" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (!llm.ok) throw new Error(`gateway ${llm.status}: ${await llm.text()}`);
    const j = await llm.json();
    const parsed = JSON.parse(j.choices[0].message.content);

    const { data: evRow } = await supa.from("evaluations").insert({
      simulation_id,
      user_decision: decision,
      retrieved_protocols: matches || [],
      compliance_score: parsed.compliance_score ?? 0,
      critical_mistakes: parsed.critical_mistakes ?? [],
      quality_metrics: parsed.quality_metrics ?? {},
      after_action_report: parsed.after_action_report ?? "",
    }).select().single();

    return json({ evaluation: evRow, retrieved: matches });
  } catch (e: any) {
    console.error("evaluate error:", e);
    return json({ error: e?.message || String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
