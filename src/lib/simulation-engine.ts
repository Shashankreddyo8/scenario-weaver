import { Agent, AGENTS, SimulationResult, SimulationScenario, ProbabilityLevel } from "./simulation-types";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// Mock simulation engine — simulates multi-agent pipeline
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
    if (status === "running") await delay(600 + Math.random() * 800);
  };

  // Step 1: Input Analysis
  await updateAgent("input", "running");
  const keywords = extractKeywords(input);
  await updateAgent("input", "complete", `Extracted: ${keywords.join(", ")}`);

  // Step 2: Knowledge Retrieval (RAG mock)
  await updateAgent("rag", "running");
  const knowledge = retrieveKnowledge(keywords);
  await updateAgent("rag", "complete", `Retrieved ${knowledge.length} relevant sources`);

  // Step 3: Actor Identification
  await updateAgent("actor", "running");
  const actors = identifyActors(input, keywords);
  await updateAgent("actor", "complete", `Identified ${actors.length} key actors`);

  // Step 4: Strategy Analysis
  await updateAgent("strategy", "running");
  const actions = predictActions(actors);
  await updateAgent("strategy", "complete", `Predicted ${actions.length} possible actions`);

  // Step 5: Chain Simulation
  await updateAgent("simulation", "running");
  await updateAgent("simulation", "complete", "Simulated 3 divergent paths");

  // Step 6: Scenario Generation
  await updateAgent("scenario", "running");
  const scenarios = generateScenarios(input, actors, actions, knowledge);
  await updateAgent("scenario", "complete", `Generated ${scenarios.length} scenarios`);

  // Step 7: Probability
  await updateAgent("probability", "running");
  await updateAgent("probability", "complete", "Probabilities assigned");

  // Step 8: Explanation
  await updateAgent("explanation", "running");
  await updateAgent("explanation", "complete", "Reasoning chains complete");

  return {
    scenarios,
    agents,
    knowledgeRetrieved: knowledge,
    actorsIdentified: actors,
    actionsPredicted: actions,
  };
}

function extractKeywords(input: string): string[] {
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "shall", "of", "in", "to", "for", "with", "on", "at", "from", "by", "about", "as", "into", "through", "during", "before", "after", "between", "and", "but", "or", "if", "then", "that", "this", "what", "which", "who", "whom", "how", "when", "where", "why"]);
  return input.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w)).slice(0, 8);
}

function retrieveKnowledge(keywords: string[]): string[] {
  const knowledgeBase: Record<string, string[]> = {
    war: ["Historical conflicts follow patterns of escalation through alliance networks", "Economic sanctions precede 68% of modern conflicts", "Proxy conflicts often escalate when great power interests overlap"],
    economy: ["Trade wars affect GDP within 6-12 months", "Currency manipulation creates cascading effects across markets", "Supply chain disruptions amplify economic shocks"],
    climate: ["Tipping points create non-linear acceleration", "Climate migration affects 200M+ people by 2050", "Resource scarcity drives geopolitical tension"],
    technology: ["AI capabilities double every 14 months", "Cyber warfare capabilities outpace defensive measures", "Technology export controls reshape global alliances"],
    political: ["Regime changes follow predictable instability patterns", "Democratic backsliding correlates with economic inequality", "Information warfare precedes conventional conflicts"],
    default: ["Complex systems exhibit emergent behaviors", "Multi-actor scenarios produce non-obvious outcomes", "Historical precedents inform but don't determine futures"],
  };

  const results: string[] = [];
  keywords.forEach(k => {
    const matches = Object.entries(knowledgeBase).find(([key]) => k.includes(key) || key.includes(k));
    if (matches) results.push(...matches[1]);
  });
  if (results.length === 0) results.push(...knowledgeBase.default);
  return [...new Set(results)].slice(0, 5);
}

function identifyActors(input: string, keywords: string[]) {
  const actorTemplates = [
    { name: "Nation State A", role: "Primary Actor", goals: ["Maintain regional dominance", "Protect economic interests"], capabilities: ["Military power", "Economic leverage", "Diplomatic networks"] },
    { name: "Nation State B", role: "Opposing Actor", goals: ["Challenge existing order", "Expand influence"], capabilities: ["Asymmetric warfare", "Cyber capabilities", "Resource control"] },
    { name: "International Organization", role: "Mediator", goals: ["Maintain stability", "Enforce international law"], capabilities: ["Diplomatic pressure", "Sanctions authority", "Peacekeeping forces"] },
    { name: "Non-State Actors", role: "Disruptors", goals: ["Advance ideology", "Exploit power vacuums"], capabilities: ["Information warfare", "Network mobility", "Unconventional tactics"] },
  ];

  const count = Math.min(2 + Math.floor(keywords.length / 2), 4);
  return actorTemplates.slice(0, count);
}

function predictActions(actors: ReturnType<typeof identifyActors>): string[] {
  return actors.flatMap(a => [
    `${a.name} deploys ${a.capabilities[0].toLowerCase()}`,
    `${a.name} pursues ${a.goals[0].toLowerCase()}`,
  ]);
}

function generateScenarios(input: string, actors: ReturnType<typeof identifyActors>, actions: string[], knowledge: string[]): SimulationScenario[] {
  const probabilities: ProbabilityLevel[] = ["Medium", "High", "Low", "Low"];
  const templates = [
    {
      titleSuffix: "Escalation Cascade",
      summary: "Tensions escalate through a series of retaliatory actions, drawing in additional actors and creating a multi-front crisis.",
      details: "Initial provocations trigger alliance obligations, leading to rapid escalation. Economic measures fail to de-escalate as both sides face domestic pressure to appear strong. Third-party mediators are sidelined as the situation moves faster than diplomatic processes.",
      chainReactions: ["Initial provocation → Retaliatory response", "Alliance activation → Multi-front escalation", "Economic disruption → Domestic pressure", "Media escalation → Public opinion hardening"],
    },
    {
      titleSuffix: "Negotiated De-escalation",
      summary: "After initial tensions, back-channel diplomacy leads to a negotiated settlement that addresses core grievances.",
      details: "Economic interdependence creates mutual incentives for resolution. International organizations provide face-saving mechanisms for both parties. A phased agreement addresses immediate security concerns while establishing long-term frameworks.",
      chainReactions: ["Economic pain → Willingness to negotiate", "Back-channel contact → Framework agreement", "Phased implementation → Trust building", "International monitoring → Compliance verification"],
    },
    {
      titleSuffix: "Frozen Conflict",
      summary: "Neither escalation nor resolution occurs. The situation enters a prolonged stalemate with periodic flare-ups.",
      details: "Both sides lack sufficient capability or will to force a decisive outcome. The status quo becomes self-reinforcing as institutions adapt to the new normal. Periodic provocations test boundaries but are contained by mutual deterrence.",
      chainReactions: ["Stalemate → Institutional adaptation", "Periodic testing → Boundary reinforcement", "Resource diversion → Economic drag", "Normalization → Reduced urgency for resolution"],
    },
    {
      titleSuffix: "Black Swan Disruption",
      summary: "An unexpected event fundamentally alters the dynamics, creating opportunities for resolution or catastrophic escalation.",
      details: "A technological breakthrough, natural disaster, or internal political upheaval disrupts existing power balances. Previously stable assumptions become invalid, forcing rapid recalculation by all actors.",
      chainReactions: ["Unexpected event → Power rebalancing", "Strategic recalculation → New alliances", "Information vacuum → Miscalculation risk", "Rapid adaptation → New equilibrium or chaos"],
    },
  ];

  return templates.map((t, i) => ({
    id: `scenario-${i}`,
    title: `${t.titleSuffix}`,
    probability: probabilities[i],
    summary: t.summary,
    details: t.details,
    actors: actors.slice(0, 2 + (i % 2)),
    chainReactions: t.chainReactions,
    reasoning: `Based on ${knowledge[i % knowledge.length]?.toLowerCase() || "historical patterns"}, this outcome has a ${probabilities[i].toLowerCase()} probability given the identified actors and their capabilities.`,
  }));
}
