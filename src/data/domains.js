export const DOMAINS = [
  { k: "config",  name: "Configuration & Setup",        short: "Config",     weight: 15, hue: "#0176D3" },
  { k: "object",  name: "Object Manager & App Builder", short: "Objects",    weight: 15, hue: "#5867E8" },
  { k: "sales",   name: "Sales & Marketing Apps",       short: "Sales",      weight: 10, hue: "#9050E9" },
  { k: "service", name: "Service & Support Apps",       short: "Service",    weight: 10, hue: "#0D9DDA" },
  { k: "prod",    name: "Productivity & Collaboration", short: "Productive", weight: 10, hue: "#06A59A" },
  { k: "data",    name: "Data & Analytics Management",  short: "Data",       weight: 17, hue: "#2E844A" },
  { k: "auto",    name: "Automation",                   short: "Automation", weight: 15, hue: "#FE9339" },
  { k: "agent",   name: "Agentforce",                   short: "Agentforce", weight: 8,  hue: "#E5567A" },
];

export const DMAP = Object.fromEntries(DOMAINS.map(d => [d.k, d]));
