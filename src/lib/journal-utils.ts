/**
 * Journal URL standardization utility.
 * Generates clean, canonical, professional academic URLs across the AfriJournal system.
 * Priority: Print ISSN -> Online eISSN -> Clean Name Slug -> UUID fallback
 */

export function getJournalUrl(journal?: {
  id?: string;
  issn?: string | null;
  eissn?: string | null;
  name?: string | null;
} | null): string {
  if (!journal) return "/rankings";

  if (journal.issn && journal.issn.trim()) {
    return `/journal/${encodeURIComponent(journal.issn.trim())}`;
  }

  if (journal.eissn && journal.eissn.trim()) {
    return `/journal/${encodeURIComponent(journal.eissn.trim())}`;
  }

  if (journal.name && journal.name.trim()) {
    const slug = journal.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (slug.length >= 3) {
      return `/journal/${slug}`;
    }
  }

  return journal.id ? `/journal/${journal.id}` : "/rankings";
}
