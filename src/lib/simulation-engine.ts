import { Agent, AGENTS, SimulationResult } from "./simulation-types";
import { supabase } from "@/integrations/supabase/client";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function runSimulation(
  input: string,
  onAgentUpdate: (agents: Agent[]) => void
): Promise<SimulationResult> {
  const agents = AGENTS.map(a => ({ ...a }));

  const updateAgent = async (id: string, status: Agent["status"], output?: string) => {
    const agent = agents.find(a => a.id === id)!;
    agent.status = status;
    if (output) agent.output = output;
    onAgentUpdate([...agents]);
  };

  const animateAgents = async () => {
    const agentIds = ["input", "rag", "actor", "graph-build", "graph-reason", "strategy", "simulation", "scenario", "probability", "explanation"];
    for (const id of agentIds) {
      await updateAgent(id, "running");
      await delay(350 + Math.random() * 500);
    }
  };

  const animationPromise = animateAgents();

  const { data, error } = await supabase.functions.invoke("simulate", {
    body: { scenario: input },
  });

  await animationPromise;

  if (error) {
    throw new Error(error.message || "Simulation failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  const agentOutputs = data?.agentOutputs || {};
  await updateAgent("input", "complete", agentOutputs.inputAnalysis || "Analysis complete");
  await updateAgent("rag", "complete", `Retrieved ${(agentOutputs.knowledgeRetrieved || []).length} sources`);
  await updateAgent("actor", "complete", `Identified ${(agentOutputs.actorsIdentified || []).length} actors`);
  await updateAgent("graph-build", "complete", agentOutputs.graphBuilderSummary || "Graph constructed");
  await updateAgent("graph-reason", "complete", agentOutputs.graphReasoningSummary || "Graph analysis complete");
  await updateAgent("strategy", "complete", `Predicted ${(agentOutputs.actionsPredicted || []).length} actions`);
  await updateAgent("simulation", "complete", agentOutputs.simulationSummary || "Simulation complete");
  await updateAgent("scenario", "complete", `Generated ${(data?.scenarios || []).length} scenarios`);
  await updateAgent("probability", "complete", "Probabilities assigned");
  await updateAgent("explanation", "complete", "Reasoning chains complete");

  const scenarios = (data?.scenarios || []).map((s: any, i: number) => ({
    id: `scenario-${i}`,
    title: s.title || `Scenario ${i + 1}`,
    probability: s.probability || "Medium",
    summary: s.summary || "",
    details: s.details || "",
    actors: (agentOutputs.actorsIdentified || []).slice(0, 2 + (i % 2)).map((a: any) => ({
      name: a.name || "Unknown",
      role: a.role || "Actor",
      goals: a.goals || [],
      capabilities: a.capabilities || [],
    })),
    chainReactions: s.chainReactions || [],
    reasoning: s.reasoning || "",
  }));

  const graph = data?.graph ? {
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
  } : undefined;

  return {
    scenarios,
    agents,
    knowledgeRetrieved: agentOutputs.knowledgeRetrieved || [],
    actorsIdentified: (agentOutputs.actorsIdentified || []).map((a: any) => ({
      name: a.name || "Unknown",
      role: a.role || "Actor",
      goals: a.goals || [],
      capabilities: a.capabilities || [],
    })),
    actionsPredicted: agentOutputs.actionsPredicted || [],
    graph,
  };
}
