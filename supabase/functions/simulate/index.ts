import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are ScenarioMind, a multi-agent simulation engine. In one pass, internally run: input analysis → knowledge retrieval with real cited sources → actor identification → relationship graph (ally/enemy/neutral/influence/dependency with strengths) → graph reasoning (clusters, central actors, cascades) → strategy prediction → chain simulation → scenario generation with short/mid/long horizons → probability + 0-100 confidence → reasoning citing source indexes [1][2].

Every output must stay strictly inside the domain, geography, timeframe and entities of the user's scenario text. Never substitute a generic geopolitical template for the user's actual topic. Be concise. Ground in real-world precedent. Output ONLY a single valid JSON object — no markdown, no prose.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: any = {};
    try {
      const raw = await req.text();
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { scenario, parentScenario, twist } = body;
    if (!scenario || typeof scenario !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'scenario' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isBranch = !!(parentScenario && twist);
    const numScenarios = isBranch ? 2 : 4;

    const branchContext = isBranch
      ? `\n\nThis is a WHAT-IF BRANCH off an existing scenario. Treat this twist as a forced premise that has already happened, then simulate consequences.\n\nParent scenario context:\nTitle: ${parentScenario.title}\nSummary: ${parentScenario.summary}\n\nForced twist (assume this happens): "${twist}"\n\nGenerate ${numScenarios} divergent branch outcomes that flow from this twist.`
      : "";

    // === Fetch REAL sources via Firecrawl search ===
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    let realSources: { title: string; url: string; snippet: string; domain: string }[] = [];
    if (FIRECRAWL_API_KEY) {
      try {
        const searchQuery = isBranch
          ? `${scenario} ${twist}`
          : scenario;
        const fc = await fetch("https://api.firecrawl.dev/v2/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: searchQuery, limit: 6, tbs: "qdr:y" }),
        });
        if (fc.ok) {
          const fcJson = await fc.json();
          const items: any[] = fcJson?.data?.web || fcJson?.data || [];
          realSources = items.slice(0, 6).map((r: any) => {
            const url: string = r.url || r.link || "";
            let domain = "";
            try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch {}
            return {
              title: r.title || r.metadata?.title || domain || "Source",
              url,
              snippet: (r.description || r.snippet || r.content || "").slice(0, 300),
              domain,
            };
          }).filter((s) => s.url.startsWith("http"));
        } else {
          console.error("Firecrawl search failed:", fc.status, await fc.text());
        }
      } catch (e) {
        console.error("Firecrawl search error:", e);
      }
    }

    const sourcesBlock = realSources.length
      ? `\n\nREAL SOURCES (use ONLY these — DO NOT invent URLs). Cite them by 0-based index:\n${realSources.map((s, i) => `[${i}] ${s.title}\n    URL: ${s.url}\n    ${s.snippet}`).join("\n")}`
      : "";

    const userPrompt = `USER SCENARIO (the single source of truth for this simulation):
"""
${scenario}
"""

CONTEXT ANCHORING (highest priority):
- Infer the domain, geography, timeframe, scale and named entities directly from the user scenario above. Do NOT drift into a different domain (e.g. do not turn a public-health or business prompt into a geopolitical war).
- Every actor, graph node, chain reaction and horizon must be plausibly involved in THIS scenario. No generic filler actors.
- Reuse the user's own terminology and named entities verbatim where they appear.
- If the prompt is vague, state the assumptions you adopt in "inputAnalysis" and keep them consistent everywhere else.
- Match the scope of the prompt: a local/organizational scenario stays local; a global one stays global.${branchContext}${sourcesBlock}

Return ONE JSON object, this exact shape:
{
  "agentOutputs": {
    "inputAnalysis": "1-2 sentences",
    "knowledgeRetrieved": ["3-4 historical/pattern insights"],
    "actorsIdentified": [{"name":"","role":"","goals":["..."],"capabilities":["..."]}],
    "actionsPredicted": ["..."],
    "graphBuilderSummary": "1 sentence",
    "graphReasoningSummary": "1-2 sentences",
    "simulationSummary": "1-2 sentences"
  },
  "graph": {
    "nodes": [{"id":"kebab-id","label":"","type":"country|organization|person|event","importance":0.0-1.0}],
    "edges": [{"source":"id","target":"id","type":"ally|enemy|neutral|influence|dependency","strength":0.0-1.0,"label":""}]
  },
  "scenarios": [{
    "title":"","probability":"High|Medium|Low","confidence":0-100,
    "summary":"2 sentences","details":"3-4 sentences",
    "chainReactions":["Step 1 → ...","Step 2 → ...","Step 3 → ...","Step 4 → ..."],
    "reasoning":"reference graph + cite [0][1] using the source indexes above","citations":[0,1],
    "horizons":{
      "short":{"summary":"weeks","chainReactions":["..."],"intensity":0.0-1.0},
      "mid":{"summary":"months","chainReactions":["..."],"intensity":0.0-1.0},
      "long":{"summary":"years","chainReactions":["..."],"intensity":0.0-1.0}
    }
  }]
}

RULES:
- Exactly ${numScenarios} scenarios with varying probabilities, all directly about the user scenario
- ${realSources.length ? "DO NOT include a \"sources\" key — sources are supplied externally. Only reference them via the citations array (indexes into the provided list)." : "Include 4 sources from realistic outlets in a \"sources\" array with title/url/snippet/domain."}
- 6-8 graph nodes, 8-12 edges; edges reference valid node IDs; IDs kebab-case
- Specific real names, entities and historical parallels relevant to the user's domain
- confidence is independent of probability tier`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Inject real sources from Firecrawl (overrides any model-invented ones)
    if (realSources.length) {
      parsed.sources = realSources;
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("simulate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
