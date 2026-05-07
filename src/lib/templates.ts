export interface ScenarioTemplate {
  category: string;
  icon: string;
  title: string;
  prompt: string;
  description: string;
}

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    category: "Geopolitics",
    icon: "🌍",
    title: "Trade war escalation",
    prompt: "Trade war between US and China escalates with new semiconductor export bans",
    description: "Chip controls, supply chains, and allied responses",
  },
  {
    category: "Geopolitics",
    icon: "🛡️",
    title: "NATO eastern crisis",
    prompt: "Russia masses troops near a NATO member state's border",
    description: "Deterrence, Article 5 calculus, energy markets",
  },
  {
    category: "Markets",
    icon: "📉",
    title: "Banking liquidity shock",
    prompt: "A major regional bank collapses triggering liquidity contagion",
    description: "Fed response, deposit flight, sector contagion",
  },
  {
    category: "Markets",
    icon: "🛢️",
    title: "Oil supply shock",
    prompt: "OPEC+ announces a sudden 2 million barrel/day production cut",
    description: "Inflation, central banks, geopolitical realignment",
  },
  {
    category: "Technology",
    icon: "🤖",
    title: "AGI capability leap",
    prompt: "A frontier AI lab announces a major capability jump in reasoning models",
    description: "Regulation, labor markets, geopolitical race",
  },
  {
    category: "Crisis",
    icon: "🦠",
    title: "Novel pathogen outbreak",
    prompt: "A novel respiratory pathogen spreads from a regional hub to three continents",
    description: "WHO response, travel restrictions, vaccine race",
  },
  {
    category: "Product",
    icon: "🚀",
    title: "Disruptive product launch",
    prompt: "A new entrant launches an iPhone competitor at half the price with similar specs",
    description: "Market share, supply chains, incumbent response",
  },
  {
    category: "Climate",
    icon: "🌊",
    title: "Climate tipping event",
    prompt: "A major Antarctic ice shelf collapse accelerates sea level rise projections",
    description: "Migration, insurance markets, policy shifts",
  },
];
