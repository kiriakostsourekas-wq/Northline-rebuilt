const phraseMap: Array<[RegExp, string]> = [
  [/\bkali(?:s|σ)?pera\b/gi, "καλησπέρα"],
  [/\bkalimera\b/gi, "καλημέρα"],
  [/\bthelo\b/gi, "θέλω"],
  [/\b8elo\b/gi, "θέλω"],
  [/\bendiaferomai\b/gi, "ενδιαφέρομαι"],
  [/\bplirofories\b/gi, "πληροφορίες"],
  [/\bprosfora\b/gi, "προσφορά"],
  [/\btimi\b/gi, "τιμή"],
  [/\btimes\b/gi, "τιμές"],
  [/\bkostos\b/gi, "κόστος"],
  [/\bposo\b/gi, "πόσο"],
  [/\bposa\b/gi, "πόσα"],
  [/\brantevou\b/gi, "ραντεβού"],
  [/\bkratisi\b/gi, "κράτηση"],
  [/\bkleiso\b/gi, "κλείσω"],
  [/\bypiresia\b/gi, "υπηρεσία"],
  [/\bypiresies\b/gi, "υπηρεσίες"],
  [/\btilefono\b/gi, "τηλέφωνο"],
  [/\bkinito\b/gi, "κινητό"],
  [/\bavrio\b/gi, "αύριο"],
  [/\bsimera\b/gi, "σήμερα"],
  [/\bamesa\b/gi, "άμεσα"],
  [/\bathina\b/gi, "αθήνα"],
  [/\bathens\b/gi, "αθήνα"],
  [/\bthessaloniki\b/gi, "θεσσαλονίκη"],
  [/\bpatra\b/gi, "πάτρα"],
  [/\biraklio\b/gi, "ηράκλειο"],
];

const digraphs: Array<[RegExp, string]> = [
  [/th/gi, "θ"],
  [/ch/gi, "χ"],
  [/ps/gi, "ψ"],
  [/ks/gi, "ξ"],
  [/ou/gi, "ου"],
  [/ai/gi, "αι"],
  [/ei/gi, "ει"],
  [/oi/gi, "οι"],
];

const charMap: Record<string, string> = {
  a: "α",
  b: "β",
  c: "κ",
  d: "δ",
  e: "ε",
  f: "φ",
  g: "γ",
  h: "η",
  i: "ι",
  j: "τζ",
  k: "κ",
  l: "λ",
  m: "μ",
  n: "ν",
  o: "ο",
  p: "π",
  q: "κ",
  r: "ρ",
  s: "σ",
  t: "τ",
  u: "υ",
  v: "β",
  w: "ω",
  x: "ξ",
  y: "υ",
  z: "ζ",
};

export function transliterateGreeklishText(value: string) {
  let result = value;
  for (const [pattern, replacement] of phraseMap) {
    result = result.replace(pattern, replacement);
  }

  return result
    .split(/(\s+|[.,!?;:()/"'])/)
    .map((token) => transliterateToken(token))
    .join("");
}

export function greeklishSignals(value: string) {
  const lower = value.toLowerCase();
  const signals: string[] = [];

  for (const [pattern] of phraseMap) {
    const source = pattern.source.replaceAll("\\b", "").replaceAll("(?:s|σ)?", "s");
    const simple = source.split("|")[0].replace(/[()?:\\]/g, "");
    if (simple && lower.includes(simple)) signals.push(simple);
  }

  for (const signal of ["thelo", "einai", "gia", "stin", "sto", "sas", "mou"]) {
    if (lower.includes(signal)) signals.push(signal);
  }

  return Array.from(new Set(signals)).slice(0, 8);
}

function transliterateToken(token: string) {
  if (!/^[a-z0-9]+$/i.test(token)) return token;
  if (token.length <= 2 || /^(email|ai|crm|api|url|web|demo)$/i.test(token)) {
    return token;
  }

  let result = token;
  for (const [pattern, replacement] of digraphs) {
    result = result.replace(pattern, replacement);
  }

  return result
    .split("")
    .map((char) => charMap[char.toLowerCase()] ?? char)
    .join("")
    .replace(/σ\b/g, "ς");
}
