// Chaos Event Engine — injects dynamic events into a simulation
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const supa = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CHAOS_DECK = [
  { type: "power_failure", title: "Grid failure in district 4", impact: { infrastructure: "degraded", threatLevel: "elevated" } },
  { type: "cyberattack", title: "Ransomware hits dispatch network", impact: { infrastructure: "compromised", threatLevel: "high" } },
  { type: "weather", title: "Storm front escalates winds to 90km/h", impact: { weather: "severe" } },
  { type: "misinformation", title: "Viral false report of secondary attack", impact: { sentiment: "panicked" } },
  { type: "comms_breakdown", title: "Radio repeater offline for 12 minutes", impact: { infrastructure: "degraded" } },
  { type: "secondary_incident", title: "Reported casualty cluster 4 blocks east", impact: { casualties: 8, threatLevel: "high" } },
  { type: "civilian_panic", title: "Crowd surge at evacuation route B", impact: { sentiment: "panicked", casualties: 3 } },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { simulation_id, type } = await req.json();
    if (!simulation_id) return json({ error: "simulation_id required" }, 400);

    const event = type
      ? CHAOS_DECK.find(c => c.type === type) ?? CHAOS_DECK[0]
      : CHAOS_DECK[Math.floor(Math.random() * CHAOS_DECK.length)];

    // Apply impact to simulation state
    const { data: sim } = await supa.from("simulations").select("state").eq("id", simulation_id).single();
    const state = (sim?.state as any) || {};
    const next = { ...state, ...event.impact };
    if (typeof event.impact.casualties === "number") {
      next.casualties = (state.casualties || 0) + event.impact.casualties;
    }

    await supa.from("simulations").update({ state: next, updated_at: new Date().toISOString() }).eq("id", simulation_id);
    const { data: ev } = await supa.from("simulation_events").insert({
      simulation_id,
      event_type: "chaos",
      source: "chaos-engine",
      payload: event,
    }).select().single();

    return json({ event: ev, state: next });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
