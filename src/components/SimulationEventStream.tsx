import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  event_type: string;
  source: string;
  payload: any;
  created_at: string;
}

export default function SimulationEventStream({ simulationId }: { simulationId: string | null }) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!simulationId) return;
    setEvents([]);
    supabase.from("simulation_events").select("*").eq("simulation_id", simulationId)
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setEvents((data as any) || []));

    const ch = supabase.channel(`sim:${simulationId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "simulation_events",
        filter: `simulation_id=eq.${simulationId}`,
      }, (payload) => setEvents((prev) => [payload.new as Event, ...prev].slice(0, 50)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [simulationId]);

  if (!simulationId) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-accent" />
        <h4 className="text-sm font-semibold">Live Event Stream</h4>
        <span className="ml-auto relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
      </div>
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 text-xs p-2 rounded-lg bg-secondary/30 border border-border/40"
            >
              <Zap className="w-3 h-3 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[10px] text-muted-foreground">
                  {new Date(e.created_at).toLocaleTimeString()} · {e.source}
                </div>
                <div className="text-foreground/90 truncate">
                  {e.payload?.title || e.event_type}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {!events.length && (
          <p className="text-xs text-muted-foreground text-center py-4">No events yet.</p>
        )}
      </div>
    </div>
  );
}
