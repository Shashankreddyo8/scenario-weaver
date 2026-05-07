import { Agent, AGENTS, SimulationResult, SimulationScenario } from "./simulation-types";
import { supabase } from "@/integrations/supabase/client";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

interface RunOptions {
  parentScenario?: { title: string; summary: string };
  twist?: string;
}

function mapScenario(s: any, i: number, actorsIdentified: any[]): SimulationScenario {
  return {
    id: `scenario-${Date.now()}-${i}`,
    title: s.title || `Scenario ${i + 1}`,
    probability: s.probability || "Medium",
    confidence: typeof s.confidence === "number" ? s.confidence : 60,
    summary: s.summary || "",
    details: s.details || "",
    actors: (actorsIdentified || []).slice(0, 2 + (i % 2)).map((a: any) => ({
      name: a.name || "Unknown",
      role: a.role || "Actor",
      goals: a.goals || [],
      capabilities: a.capabilities || [],
    })),
    chainReactions: s.chainReactions || [],
    reasoning: s.reasoning || "",
    citations: Array.isArray(s.citations) ? s.citations.filter((n: any) => typeof n === "number") : [],
    horizons: s.horizons
      ? {
          short: {
            summary: s.horizons.short?.summary || "",
            chainReactions: s.horizons.short?.chainReactions || [],
            intensity: s.horizons.short?.intensity ?? 0.5,
          },
          mid: {
            summary: s.horizons.mid?.summary || "",
            chainReactions: s.horizons.mid?.chainReactions || [],
            intensity: s.horizons.mid?.intensity ?? 0.5,
          },
          long: {
            summary: s.horizons.long?.summary || "",
            chainReactions: s.horizons.long?.chainReactions || [],
            intensity: s.horizons.long?.intensity ?? 0.5,
          },
        }
      : undefined,
    branches: [],
  };
}

export async function runSimulation(
  input: string,
  onAgentUpdate: (agents: Agent[]) => void,
  options: RunOptions = {}
): Promise<SimulationResult> {
  const agents = AGENTS.map(a => ({ ...a }));

  const updateAgent = async (id: string, status: Agent["status"], output?: string) => {
    const agent = agents.find(a => a.id === id)!;
    agent.status = status;
    if (output) agent.output = output;
    onAgentUpdate([...agents]);
  };

  const animateAgents = async () => {
    const ids = ["input", "rag", "actor", "graph-build", "graph-reason", "strategy", "simulation", "scenario", "probability", "explanation"];
    for (const id of ids) {
      await updateAgent(id, "running");
      await delay(300 + Math.random() * 450);
    }
  };

  const animationPromise = animateAgents();

  const { data, error } = await supabase.functions.invoke("simulate", {
    body: { scenario: input, parentScenario: options.parentScenario, twist: options.twist },
  });

  await animationPromise;

  if (error) throw new Error(error.message || "Simulation failed");
  if (data?.error) throw new Error(data.error);

  const agentOutputs = data?.agentOutputs || {};
  await updateAgent("input", "complete", agentOutputs.inputAnalysis || "Analysis complete");
  await updateAgent("rag", "complete", `${(data?.sources || []).length} sources cited`);
  await updateAgent("actor", "complete", `${(agentOutputs.actorsIdentified || []).length} actors`);
  await updateAgent("graph-build", "complete", agentOutputs.graphBuilderSummary || "Graph constructed");
  await updateAgent("graph-reason", "complete", agentOutputs.graphReasoningSummary || "Graph analysis complete");
  await updateAgent("strategy", "complete", `${(agentOutputs.actionsPredicted || []).length} actions`);
  await updateAgent("simulation", "complete", agentOutputs.simulationSummary || "Simulation complete");
  await updateAgent("scenario", "complete", `${(data?.scenarios || []).length} scenarios`);
  await updateAgent("probability", "complete", "Probabilities + confidence assigned");
  await updateAgent("explanation", "complete", "Reasoning chains complete");

  const actorsIdentified = (agentOutputs.actorsIdentified || []).map((a: any) => ({
    name: a.name || "Unknown",
    role: a.role || "Actor",
    goals: a.goals || [],
    capabilities: a.capabilities || [],
  }));

  const scenarios = (data?.scenarios || []).map((s: any, i: number) => mapScenario(s, i, actorsIdentified));

  const graph = data?.graph
    ? {
        nodes: (data.graph.nodes || []).map((n: any) => ({
          id: n.id,
          label: n.label || n.id,
          type: n.type || "organization",
          importance: n.importance ?? 0.5,
        })),
        edges: (data.graph.edges || []).map((e: any) => ({
          source: e.source,
          target: e.target,
          type: e.type || "neutral",
          strength: e.strength ?? 0.5,
          label: e.label,
        })),
      }
    : undefined;

  const sources = (data?.sources || []).map((s: any) => ({
    title: s.title || "Untitled",
    url: s.url || "#",
    snippet: s.snippet || "",
    domain: s.domain || (() => {
      try { return new URL(s.url).hostname.replace(/^www\./, ""); } catch { return ""; }
    })(),
  }));

  return {
    scenarios,
    agents,
    knowledgeRetrieved: agentOutputs.knowledgeRetrieved || [],
    actorsIdentified,
    actionsPredicted: agentOutputs.actionsPredicted || [],
    graph,
    sources,
  };
}

/** Runs a what-if branch and returns new scenarios (not full result). */
export async function runBranch(
  input: string,
  parent: SimulationScenario,
  twist: string
): Promise<SimulationScenario[]> {
  const { data, error } = await supabase.functions.invoke("simulate", {
    body: {
      scenario: input,
      parentScenario: { title: parent.title, summary: parent.summary },
      twist,
    },
  });
  if (error) throw new Error(error.message || "Branch failed");
  if (data?.error) throw new Error(data.error);
  const actors = (data?.agentOutputs?.actorsIdentified || []).map((a: any) => ({
    name: a.name || "Unknown",
    role: a.role || "Actor",
    goals: a.goals || [],
    capabilities: a.capabilities || [],
  }));
  return (data?.scenarios || []).map((s: any, i: number) => ({
    ...mapScenario(s, i, actors),
    parentTwist: twist,
  }));
}
