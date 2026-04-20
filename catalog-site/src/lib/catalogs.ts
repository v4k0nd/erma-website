const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRcSnKN65amdCXAHfu6lM9uph3BAEKIGJu6sFcCG0z4Nr-7NkvVL0wHSZLX0KYWTFamdGtVHHThIdAj/pub?gid=0&single=true&output=csv";

export interface Catalog {
  id: string;
  name: string;
  url: string;
  image: string;
  type: string;
}

export const TYPE_ORDER = [
  "balcon",
  "gradina",
  "seminte",
  "crizanteme",
  "radacini",
  "poinsettia",
] as const;

export const TYPE_LABELS: Record<string, { ro: string; hu: string }> = {
  balcon:     { ro: "Butași mușcate și flori de balcon",                   hu: "Muskátli és erkélyvirágok" },
  gradina:    { ro: "Răsaduri și butași flori anuale / bienale / perene",  hu: "Palánták és évelő/kétnyári virágok" },
  seminte:    { ro: "Semințe",                                             hu: "Virág magok" },
  crizanteme: { ro: "Butași crizanteme",                                   hu: "Krizantém dugványok" },
  radacini:   { ro: "Rădăcini plante perene",                              hu: "Évelő virág gyökerek" },
  poinsettia: { ro: "Poinsettia pentru sărbători",                         hu: "Poinsettia az ünnepekre" },
};

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuote = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export async function fetchActiveCatalogs(): Promise<Catalog[]> {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split("\n");

  return lines
    .slice(1) // skip header
    .map((line) => {
      const cols = parseCSVLine(line);
      return {
        id:     cols[0] ?? "",
        name:   cols[1] ?? "",
        url:    cols[2] ?? "",
        image:  cols[3] ?? "",
        type:   cols[4] ?? "",
        active: cols[5] ?? "",
      };
    })
    .filter((row) => row.active === "1" && row.name && row.url)
    .map(({ active: _active, ...rest }) => rest);
}

export function groupByType(catalogs: Catalog[]): [string, Catalog[]][] {
  const map = new Map<string, Catalog[]>();
  for (const c of catalogs) {
    const group = map.get(c.type) ?? [];
    group.push(c);
    map.set(c.type, group);
  }
  // Return sections in TYPE_ORDER; any unknown type falls to the end
  const known = TYPE_ORDER.filter((t) => map.has(t)).map((t) => [t, map.get(t)!] as [string, Catalog[]]);
  const unknown = [...map.entries()].filter(([t]) => !(TYPE_ORDER as readonly string[]).includes(t));
  return [...known, ...unknown];
}
