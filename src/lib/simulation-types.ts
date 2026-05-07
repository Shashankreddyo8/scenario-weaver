export type ProbabilityLevel = "High" | "Medium" | "Low";

export type EdgeType = "ally" | "enemy" | "neutral" | "influence" | "dependency";

export interface GraphNode {
  id: string;
  label: string;
  type: "country" | "organization" | "person" | "event";
  importance: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  strength: number;
  label?: string;
}

export interface SimulationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Agent {
  id: string;
  name: string;
  icon: string;
  status: "pending" | "running" | "complete";
  output?: string;
}

export interface Actor {
  name: string;
  role: string;
  goals: string[];
  capabilities: string[];
}

export interface Source {
  title: string;
  url: string;
  snippet?: string;
  domain?: string;
}

export interface HorizonForecast {
  summary: string;
  chainReactions: string[];
  intensity: number; // 0-1
}

export interface SimulationScenario {
  id: string;
  title: string;
  probability: ProbabilityLevel;
  confidence: number; // 0-100
  summary: string;
  details: string;
  actors: Actor[];
  chainReactions: string[];
  reasoning: string;
  citations: number[]; // indexes into result.sources
  horizons?: {
    short: HorizonForecast;
    mid: HorizonForecast;
    long: HorizonForecast;
  };
  branches?: SimulationScenario[]; // what-if branches
  parentTwist?: string;
}

export interface SimulationResult {
  scenarios: SimulationScenario[];
  agents: Agent[];
  knowledgeRetrieved: string[];
  actorsIdentified: Actor[];
  actionsPredicted: string[];
  graph?: SimulationGraph;
  sources: Source[];
}

export const AGENTS: Agent[] = [
  { id: "input", name: "Input Analysis", icon: "🔍", status: "pending" },
  { id: "rag", name: "Knowledge Retrieval", icon: "📚", status: "pending" },
  { id: "actor", name: "Actor Identification", icon: "🎭", status: "pending" },
  { id: "graph-build", name: "Graph Builder", icon: "🕸️", status: "pending" },
  { id: "graph-reason", name: "Graph Reasoning", icon: "🧠", status: "pending" },
  { id: "strategy", name: "Strategy Analysis", icon: "♟️", status: "pending" },
  { id: "simulation", name: "Chain Simulation", icon: "⚡", status: "pending" },
  { id: "scenario", name: "Scenario Generation", icon: "🌐", status: "pending" },
  { id: "probability", name: "Probability Assessment", icon: "📊", status: "pending" },
  { id: "explanation", name: "Explanation Engine", icon: "💡", status: "pending" },
];
