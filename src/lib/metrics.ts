/**
 * Metric Intelligence and Quartile classification utilities for AfriJournal Index
 * Designed to prevent "Sea of Zeros" inflation and small-sample distortions.
 */

export type Quartile = "Q1" | "Q2" | "Q3" | "Q4" | "Unrated";

export interface CategorizedJournal {
  id: string;
  name: string;
  score: number;
  regionalScore: number;
  discipline: string;
  quartile?: Quartile;
  disciplineRank?: number;
  totalInDiscipline?: number;
}

/**
 * Determine primary and secondary disciplines from journal metadata
 */
export function getDisciplines(name: string = "", description: string = ""): string[] {
  const text = (name + " " + description).toLowerCase();
  const disciplines: string[] = [];

  if (text.includes("medic") || text.includes("health") || text.includes("pharm") || text.includes("nursing") || text.includes("clinic") || text.includes("disease") || text.includes("food") || text.includes("nutrition")) {
    disciplines.push("Health Sciences");
  }
  if (text.includes("educat") || text.includes("pedagog") || text.includes("curriculum") || text.includes("didactic") || text.includes("teach") || text.includes("school")) {
    disciplines.push("Education");
  }
  if (text.includes("social") || text.includes("humanit") || text.includes("histor") || text.includes("cultur") || text.includes("linguist") || text.includes("law") || text.includes("droit") || text.includes("philosoph") || text.includes("literat")) {
    disciplines.push("Social Sciences & Humanities");
  }
  if (text.includes("econom") || text.includes("financ") || text.includes("manag") || text.includes("business") || text.includes("account") || text.includes("entrepreneur") || text.includes("commerc")) {
    disciplines.push("Business & Economics");
  }
  if (text.includes("agri") || text.includes("environ") || text.includes("forest") || text.includes("botan") || text.includes("zoolog") || text.includes("ecolog") || text.includes("geograph") || text.includes("veterin") || text.includes("animal")) {
    disciplines.push("Agricultural & Environmental Sciences");
  }
  if (text.includes("engin") || text.includes("technol") || text.includes("comput") || text.includes("physic") || text.includes("chem") || text.includes("math") || text.includes("mater") || text.includes("structur") || text.includes("geolog")) {
    disciplines.push("Engineering & Physical Sciences");
  }

  if (disciplines.length === 0) {
    disciplines.push("Multidisciplinary");
  }

  return disciplines;
}

/**
 * Assign Q1, Q2, Q3, Q4, or Unrated status to journals within a discipline group.
 * - Journals with score 0.000 or uncalculated are marked "Unrated" (Baseline).
 * - Q1: Score >= 0.500 (Elite regional citation velocity).
 * - Q2: Score >= 0.250 (Strong regional citation velocity).
 * - Q3: Score >= 0.080 (Moderate active citation velocity).
 * - Q4: Score > 0.000 (Emerging citations).
 */
export function assignQuartiles<T extends { score: number; articleCount?: number }>(items: T[]): (T & { quartile: Quartile; rank: number; totalInGroup: number })[] {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const n = sorted.length;

  return sorted.map((item, idx) => {
    let quartile: Quartile = "Unrated";

    if (item.score <= 0) {
      quartile = "Unrated";
    } else if (item.score >= 0.500) {
      quartile = "Q1";
    } else if (item.score >= 0.250) {
      quartile = "Q2";
    } else if (item.score >= 0.080) {
      quartile = "Q3";
    } else {
      quartile = "Q4";
    }

    return {
      ...item,
      quartile,
      rank: idx + 1,
      totalInGroup: n
    };
  });
}
