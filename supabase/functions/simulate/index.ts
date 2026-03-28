import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are ScenarioMind, a multi-agent scenario simulation engine with graph-based reasoning. You must analyze the user's scenario input and produce a structured JSON response simulating multiple possible futures using relationship graphs.

You operate as 10 coordinated agents in sequence:
1. Input Analysis: Parse the scenario, extract entities, keywords, intent
2. Knowledge Retrieval: Recall relevant historical events, political/economic patterns
3. Actor Identification: Identify key actors (countries, groups, systems) with goals and capabilities
4. Graph Builder: Construct a relationship graph with actors as nodes and their relationships (ally, enemy, neutral, influence, dependency) as edges with strength scores
5. Graph Reasoning: Traverse the graph to detect alliances, conflict clusters, central actors, cascading effects, escalation paths, and indirect relationships
6. Strategy Analysis: Predict possible actions for each actor, informed by graph centrality and edge strengths
7. Chain Simulation: Simulate chain reactions between actors using graph paths
8. Scenario Generation: Generate 4 distinct possible outcome scenarios
9. Probability Assessment: Assign probability levels (High/Medium/Low)
10. Explanation: Explain reasoning for each scenario, referencing graph relationships

Your reasoning must be grounded in real-world patterns, historical precedents, and network/graph logic.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario } = await req.json();
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

    const userPrompt = `Analyze this scenario and run a full multi-agent simulation with graph-based reasoning:

"${scenario}"

Return your analysis as a JSON object with this exact structure:
{
  "agentOutputs": {
    "inputAnalysis": "Brief summary of extracted entities, keywords, and intent",
    "knowledgeRetrieved": ["3-5 relevant historical/pattern insights retrieved"],
    "actorsIdentified": [
      {
        "name": "Actor name",
        "role": "Their role in this scenario",
        "goals": ["Goal 1", "Goal 2"],
        "capabilities": ["Capability 1", "Capability 2"]
      }
    ],
    "actionsPredicted": ["Action 1 predicted", "Action 2 predicted"],
    "graphBuilderSummary": "Brief summary of the relationship graph constructed",
    "graphReasoningSummary": "Brief summary of graph-based insights (clusters, central actors, indirect relationships)",
    "simulationSummary": "Brief summary of simulation paths explored"
  },
  "graph": {
    "nodes": [
      { "id": "unique-id", "label": "Display Name", "type": "country|organization|person|event", "importance": 0.0-1.0 }
    ],
    "edges": [
      { "source": "node-id", "target": "node-id", "type": "ally|enemy|neutral|influence|dependency", "strength": 0.0-1.0, "label": "Brief description" }
    ]
  },
  "scenarios": [
    {
      "title": "Short descriptive title",
      "probability": "High|Medium|Low",
      "summary": "2-3 sentence summary",
      "details": "Detailed 3-5 sentence explanation of how this unfolds",
      "chainReactions": ["Step 1 → Consequence 1", "Step 2 → Consequence 2", "Step 3 → Consequence 3", "Step 4 → Consequence 4"],
      "reasoning": "Why this scenario is plausible based on graph relationships and evidence"
    }
  ]
}

IMPORTANT RULES:
- Generate exactly 4 scenarios with varying probabilities
- Generate 5-10 graph nodes representing key actors/entities
- Generate 8-15 graph edges representing relationships between them
- Node IDs must be lowercase-kebab-case (e.g., "united-states", "nato")
- Edge source/target must reference valid node IDs
- Make scenarios specific, not generic. Use real names and historical parallels
- Use graph reasoning: reference alliances, conflicts, centrality, and indirect relationships in scenario reasoning`;

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
        temperature: 0.8,
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
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

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
