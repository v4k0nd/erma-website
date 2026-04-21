import Papa from "papaparse";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRcSnKN65amdCXAHfu6lM9uph3BAEKIGJu6sFcCG0z4Nr-7NkvVL0wHSZLX0KYWTFamdGtVHHThIdAj/pub?gid=0&single=true&output=csv";

export interface Catalog {
  id: string;
  name: string;
  url: string;
  image: string;
  type: string;
  supplier: string;
  createdAt: string;
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

export async function fetchActiveCatalogs(): Promise<Catalog[]> {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const text = await res.text();

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length) {
    console.warn("CSV parse errors:", parsed.errors);
  }

  return parsed.data
    .filter((row) => row.active?.trim() === "1" && row.name?.trim() && row.url?.trim())
    .map((row) => ({
      id:        row.id?.trim()         ?? "",
      name:      row.name.trim(),
      url:       row.url.trim(),
      image:     row.image?.trim()      ?? "",
      type:      row.type?.trim()       ?? "",
      supplier:  row.supplier?.trim()   ?? "",
      createdAt: row.created_at?.trim() ?? "",
    }));
}

export function groupByType(catalogs: Catalog[]): [string, Catalog[]][] {
  const map = new Map<string, Catalog[]>();
  for (const c of catalogs) {
    const group = map.get(c.type) ?? [];
    group.push(c);
    map.set(c.type, group);
  }
  const known = TYPE_ORDER.filter((t) => map.has(t)).map((t) => [t, map.get(t)!] as [string, Catalog[]]);
  const unknown = [...map.entries()].filter(([t]) => !(TYPE_ORDER as readonly string[]).includes(t));
  return [...known, ...unknown];
}
