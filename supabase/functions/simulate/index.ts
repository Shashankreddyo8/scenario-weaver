import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are ScenarioMind, a multi-agent scenario simulation engine with graph-based reasoning, live web grounding, and multi-horizon forecasting.

You operate as 10 coordinated agents in sequence:
1. Input Analysis — parse scenario, extract entities and intent
2. Knowledge Retrieval — recall relevant historical events AND cite real recent sources (news outlets, think tanks, academic) with realistic URLs you are confident exist
3. Actor Identification — identify key actors with goals and capabilities
4. Graph Builder — construct relationship graph (ally, enemy, neutral, influence, dependency) with strength scores
5. Graph Reasoning — detect alliances, conflict clusters, central actors, cascading effects
6. Strategy Analysis — predict actor actions informed by graph centrality
7. Chain Simulation — simulate cascading reactions across the graph
8. Scenario Generation — generate distinct outcomes with short/mid/long horizons
9. Probability + Confidence — assign probability tier AND a 0-100 confidence score per scenario
10. Explanation — explain reasoning, citing source indexes [1], [2] from the sources list

Ground all reasoning in real-world patterns and historical precedent.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario, parentScenario, twist } = await req.json();
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

    const userPrompt = `Run a full multi-agent simulation with graph reasoning, live grounding, and multi-horizon forecasting for:

"${scenario}"${branchContext}

Return your analysis as a single JSON object (no markdown, no commentary) with this exact structure:
{
  "agentOutputs": {
    "inputAnalysis": "Brief summary of extracted entities, keywords, intent",
    "knowledgeRetrieved": ["3-5 historical/pattern insights"],
    "actorsIdentified": [
      { "name": "Actor name", "role": "Role", "goals": ["..."], "capabilities": ["..."] }
    ],
    "actionsPredicted": ["Action 1", "Action 2"],
    "graphBuilderSummary": "Brief graph construction summary",
    "graphReasoningSummary": "Clusters, central actors, indirect effects",
    "simulationSummary": "Brief simulation paths summary"
  },
  "sources": [
    { "title": "Article/report title", "url": "https://realistic-domain.com/path", "snippet": "1-2 sentence relevant excerpt", "domain": "realistic-domain.com" }
  ],
  "graph": {
    "nodes": [{ "id": "kebab-case-id", "label": "Display Name", "type": "country|organization|person|event", "importance": 0.0-1.0 }],
    "edges": [{ "source": "node-id", "target": "node-id", "type": "ally|enemy|neutral|influence|dependency", "strength": 0.0-1.0, "label": "..." }]
  },
  "scenarios": [
    {
      "title": "Short descriptive title",
      "probability": "High|Medium|Low",
      "confidence": 0-100,
      "summary": "2-3 sentence summary",
      "details": "Detailed 3-5 sentence explanation",
      "chainReactions": ["Step 1 → Consequence", "Step 2 → ...", "Step 3 → ...", "Step 4 → ..."],
      "reasoning": "Why this is plausible — reference graph relationships AND cite source indexes like [1] [2]",
      "citations": [0, 2],
      "horizons": {
        "short": { "summary": "Weeks: immediate reactions...", "chainReactions": ["..."], "intensity": 0.0-1.0 },
        "mid":   { "summary": "Months: structural shifts...",  "chainReactions": ["..."], "intensity": 0.0-1.0 },
        "long":  { "summary": "Years: systemic outcomes...",   "chainReactions": ["..."], "intensity": 0.0-1.0 }
      }
    }
  ]
}

RULES:
- Generate exactly ${numScenarios} scenarios with varying probabilities
- Generate 4-6 sources with realistic titles, URLs, and domains (e.g. reuters.com, ft.com, foreignaffairs.com, brookings.edu, bloomberg.com, nytimes.com, csis.org). Sources must look like real articles you'd find via search.
- Each scenario MUST include "citations" (array of source indexes 0-based into "sources") and "horizons" with all three time horizons
- Generate 5-10 graph nodes and 8-15 graph edges
- Node IDs lowercase-kebab-case; edges must reference valid node IDs
- Make scenarios specific with real names and historical parallels
- "confidence" reflects how sure you are about THIS specific scenario unfolding (independent of probability tier)`;

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
        temperature: 0.85,
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
