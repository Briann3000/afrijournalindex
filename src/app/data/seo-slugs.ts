import { ALL_AFRICAN_COUNTRIES } from "./african-countries";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findCountryBySlug(slug: string) {
  const cleanSlug = slug.toLowerCase().trim();
  return ALL_AFRICAN_COUNTRIES.find(
    (c) => slugify(c.name) === cleanSlug || c.code.toLowerCase() === cleanSlug
  );
}

export const TOP_DISCIPLINE_SLUGS: Record<string, string> = {
  "health-sciences": "Health Sciences",
  "social-sciences": "Social Sciences & Humanities",
  "physical-sciences-engineering": "Physical Sciences & Engineering",
  "agriculture-environmental": "Agricultural & Environmental Sciences",
  "business-economics": "Business & Economics",
  "education": "Education & Pedagogy",
  "life-sciences-biotechnology": "Life Sciences & Biotechnology",
};
