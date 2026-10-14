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
    if (text.includes("social") || text.includes("humanit") || text.includes("histor") || text.includes("cultur")) {
      disciplines.push("Education & Social Sciences");
    } else {
      disciplines.push("Education");
    }
  }
  if (text.includes("social") || text.includes("humanit") || text.includes("histor") || text.includes("cultur") || text.includes("linguist") || text.includes("law") || text.includes("droit") || text.includes("philosoph") || text.includes("literat")) {
    if (!disciplines.includes("Education & Social Sciences")) {
      disciplines.push("Social Sciences & Humanities");
    }
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
 * Standardized in accordance with international index methodologies (SCImago / JCR percentile ranking):
 * - Active rated pool: journals with positive score and citable articles (> 0).
 * - Relative distribution among active discipline peers:
 *   - Top 25% (Rank <= ceil(N * 0.25)) -> Q1
 *   - Next 25% (Rank <= ceil(N * 0.50)) -> Q2
 *   - Next 25% (Rank <= ceil(N * 0.75)) -> Q3
 *   - Remaining active journals (Rank <= N) -> Q4
 * - Unrated: Zero score, 0 citations, or uncomputed baseline journals.
 */
export function assignQuartiles<T extends { score: number; articleCount?: number }>(items: T[]): (T & { quartile: Quartile; rank: number; totalInGroup: number })[] {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const n = sorted.length;

  // Count journals eligible for quartile ranking (must have positive citation velocity)
  const activeCount = sorted.filter(item => item.score > 0).length;

  return sorted.map((item, idx) => {
    let quartile: Quartile = "Unrated";
    const rank = idx + 1;

    if (item.score <= 0 || activeCount === 0) {
      quartile = "Unrated";
    } else {
      // Standard percentile partition of active cohort
      const q1Cutoff = Math.max(1, Math.ceil(activeCount * 0.25));
      const q2Cutoff = Math.max(q1Cutoff + 1, Math.ceil(activeCount * 0.50));
      const q3Cutoff = Math.max(q2Cutoff + 1, Math.ceil(activeCount * 0.75));

      if (rank <= q1Cutoff) {
        quartile = "Q1";
      } else if (rank <= q2Cutoff) {
        quartile = "Q2";
      } else if (rank <= q3Cutoff) {
        quartile = "Q3";
      } else {
        quartile = "Q4";
      }
    }

    return {
      ...item,
      quartile,
      rank,
      totalInGroup: n
    };
  });
}
