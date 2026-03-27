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

  // Animate agents running while waiting for AI
  const animateAgents = async () => {
    const agentIds = ["input", "rag", "actor", "strategy", "simulation", "scenario", "probability", "explanation"];
    for (const id of agentIds) {
      await updateAgent(id, "running");
      await delay(400 + Math.random() * 600);
      // Don't mark complete yet — we'll do that after AI responds
    }
  };

  // Start animation and AI call in parallel
  const animationPromise = animateAgents();

  const { data, error } = await supabase.functions.invoke("simulate", {
    body: { scenario: input },
  });

  // Wait for animation to finish
  await animationPromise;

  if (error) {
    throw new Error(error.message || "Simulation failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  // Mark all agents complete with outputs from AI
  const agentOutputs = data?.agentOutputs || {};
  await updateAgent("input", "complete", agentOutputs.inputAnalysis || "Analysis complete");
  await updateAgent("rag", "complete", `Retrieved ${(data?.agentOutputs?.knowledgeRetrieved || []).length} sources`);
  await updateAgent("actor", "complete", `Identified ${(data?.agentOutputs?.actorsIdentified || []).length} actors`);
  await updateAgent("strategy", "complete", `Predicted ${(data?.agentOutputs?.actionsPredicted || []).length} actions`);
  await updateAgent("simulation", "complete", agentOutputs.simulationSummary || "Simulation complete");
  await updateAgent("scenario", "complete", `Generated ${(data?.scenarios || []).length} scenarios`);
  await updateAgent("probability", "complete", "Probabilities assigned");
  await updateAgent("explanation", "complete", "Reasoning chains complete");

  // Map AI response to our types
  const scenarios = (data?.scenarios || []).map((s: any, i: number) => ({
    id: `scenario-${i}`,
    title: s.title || `Scenario ${i + 1}`,
    probability: s.probability || "Medium",
    summary: s.summary || "",
    details: s.details || "",
    actors: (data?.agentOutputs?.actorsIdentified || []).slice(0, 2 + (i % 2)).map((a: any) => ({
      name: a.name || "Unknown",
      role: a.role || "Actor",
      goals: a.goals || [],
      capabilities: a.capabilities || [],
    })),
    chainReactions: s.chainReactions || [],
    reasoning: s.reasoning || "",
  }));

  return {
    scenarios,
    agents,
    knowledgeRetrieved: data?.agentOutputs?.knowledgeRetrieved || [],
    actorsIdentified: (data?.agentOutputs?.actorsIdentified || []).map((a: any) => ({
      name: a.name || "Unknown",
      role: a.role || "Actor",
      goals: a.goals || [],
      capabilities: a.capabilities || [],
    })),
    actionsPredicted: data?.agentOutputs?.actionsPredicted || [],
  };
}
