import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Circle } from "lucide-react";
import { Agent } from "@/lib/simulation-types";

interface AgentPipelineProps {
  agents: Agent[];
}

export default function AgentPipeline({ agents }: AgentPipelineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 gradient-border"
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
        Agent Pipeline
      </h3>
      <div className="space-y-1">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 relative"
          >
            {/* Connector line */}
            {i < agents.length - 1 && (
              <div className="absolute left-[13px] top-[28px] w-px h-[calc(100%)] bg-border" />
            )}

            {/* Status icon */}
            <div className="relative z-10 mt-1 flex-shrink-0">
              <AnimatePresence mode="wait">
                {agent.status === "complete" ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-[26px] h-[26px] rounded-full bg-primary/20 flex items-center justify-center"
                  >
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </motion.div>
                ) : agent.status === "running" ? (
                  <motion.div
                    key="running"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-[26px] h-[26px] rounded-full bg-accent/20 flex items-center justify-center"
                  >
                    <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                  </motion.div>
                ) : (
                  <div className="w-[26px] h-[26px] rounded-full bg-secondary flex items-center justify-center">
                    <Circle className="w-2.5 h-2.5 text-muted-foreground" />
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Agent info */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-base">{agent.icon}</span>
                <span className={`text-sm font-medium ${agent.status === "running" ? "text-accent" : agent.status === "complete" ? "text-foreground" : "text-muted-foreground"}`}>
                  {agent.name}
                </span>
              </div>
              {agent.output && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-xs text-muted-foreground mt-1 ml-7 font-mono"
                >
                  {agent.output}
                </motion.p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
