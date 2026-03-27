import { motion } from "framer-motion";
import { Agent } from "@/lib/simulation-types";

interface SimulationStatusProps {
  agents: Agent[];
}

export default function SimulationStatus({ agents }: SimulationStatusProps) {
  const running = agents.find(a => a.status === "running");
  const completed = agents.filter(a => a.status === "complete").length;
  const total = agents.length;
  const progress = (completed / total) * 100;

  const statusMessages: Record<string, string> = {
    input: "Analyzing input...",
    rag: "Retrieving knowledge...",
    actor: "Identifying actors...",
    strategy: "Analyzing strategies...",
    simulation: "Simulating outcomes...",
    scenario: "Generating scenarios...",
    probability: "Assessing probabilities...",
    explanation: "Building explanations...",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="glass rounded-xl p-4 gradient-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-sm font-medium text-foreground">
              {running ? statusMessages[running.id] || "Processing..." : "Completing..."}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {completed}/{total} agents
          </span>
        </div>
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, hsl(175 80% 50%), hsl(260 60% 55%))" }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
