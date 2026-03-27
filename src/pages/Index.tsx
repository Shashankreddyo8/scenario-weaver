import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import ScenarioInput from "@/components/ScenarioInput";
import AgentPipeline from "@/components/AgentPipeline";
import ScenarioCard from "@/components/ScenarioCard";
import SimulationStatus from "@/components/SimulationStatus";
import KnowledgePanel from "@/components/KnowledgePanel";
import { Agent, AGENTS, SimulationResult } from "@/lib/simulation-types";
import { runSimulation } from "@/lib/simulation-engine";

export default function Index() {
  const [isRunning, setIsRunning] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [lastInput, setLastInput] = useState("");

  const handleRun = useCallback(async (input: string) => {
    setIsRunning(true);
    setResult(null);
    setLastInput(input);
    setAgents(AGENTS.map(a => ({ ...a, status: "pending", output: undefined })));

    try {
      const simResult = await runSimulation(input, setAgents);
      setResult(simResult);
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const handleRegenerate = useCallback(() => {
    if (lastInput) handleRun(lastInput);
  }, [lastInput, handleRun]);

  const showPipeline = isRunning || result;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, hsl(175 80% 50%), transparent 70%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, hsl(260 60% 55%), transparent 70%)" }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/40">
          <div className="container max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center glow-primary">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">ScenarioMind</h1>
                <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-widest">Multi-Agent Simulation Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono">8 Agents • LangGraph</span>
            </div>
          </div>
        </header>

        {/* Hero / Input section */}
        <section className={`transition-all duration-700 ${showPipeline ? "py-8" : "py-24"}`}>
          <div className="container max-w-7xl mx-auto px-6">
            <AnimatePresence>
              {!showPipeline && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center mb-10"
                >
                  <h2 className="text-4xl md:text-5xl font-bold text-gradient-primary mb-4">
                    Simulate the Future
                  </h2>
                  <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                    Enter any scenario. Our multi-agent AI system analyzes, simulates, and generates possible outcomes.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <ScenarioInput
              onSubmit={handleRun}
              onRegenerate={handleRegenerate}
              isRunning={isRunning}
              hasResults={!!result}
            />

            {isRunning && (
              <div className="mt-6">
                <SimulationStatus agents={agents} />
              </div>
            )}
          </div>
        </section>

        {/* Results */}
        <AnimatePresence>
          {showPipeline && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="pb-16"
            >
              <div className="container max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Agent Pipeline */}
                  <div className="lg:col-span-3">
                    <AgentPipeline agents={agents} />
                  </div>

                  {/* Center: Scenario Cards */}
                  <div className="lg:col-span-6">
                    {result ? (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Generated Scenarios
                        </h3>
                        {result.scenarios.map((s, i) => (
                          <ScenarioCard key={s.id} scenario={s} index={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right: Knowledge Panel */}
                  <div className="lg:col-span-3">
                    {result && <KnowledgePanel result={result} />}
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
