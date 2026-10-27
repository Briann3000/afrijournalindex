// src/lib/fuzzy-search.ts - Universal Tokenization & Fuzzy Search Utility

const STOP_WORDS = new Set([
  "prof", "professor", "dr", "doctor", "mr", "mrs", "ms", "rev", "reverend",
  "and", "the", "of", "in", "for", "on", "with", "at", "by", "from", "an", "a"
]);

/**
 * Normalizes text: trims, lowercases, removes diacritics, and strips extraneous punctuation.
 */
export function normalizeSearchText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents/diacritics
    .replace(/[^\w\s.-]/g, " ")     // replace special symbols with spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits query string into meaningful search tokens, filtering out trivial noise words.
 */
export function tokenizeQuery(query: string): string[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  const rawTokens = normalized.split(/[\s,._-]+/).filter(Boolean);
  const meaningfulTokens: string[] = [];

  for (const token of rawTokens) {
    // If it's a 1-character token like a middle initial "m", keep it as an initial token
    if (token.length === 1 && /[a-z]/i.test(token)) {
      meaningfulTokens.push(token);
    } else if (token.length > 1 && !STOP_WORDS.has(token)) {
      meaningfulTokens.push(token);
    }
  }

  // If all tokens were filtered out (e.g. user just typed "Prof Dr"), fallback to raw tokens
  return meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;
}

/**
 * Fast Levenshtein distance calculation with bounded matrix optimization.
 */
export function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const len1 = s1.length;
  const len2 = s2.length;

  let prevRow = new Array(len2 + 1);
  let currRow = new Array(len2 + 1);

  for (let j = 0; j <= len2; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    currRow[0] = i;
    const char1 = s1.charCodeAt(i - 1);

    for (let j = 1; j <= len2; j++) {
      const char2 = s2.charCodeAt(j - 1);
      const cost = char1 === char2 ? 0 : 1;

      currRow[j] = Math.min(
        prevRow[j] + 1,       // deletion
        currRow[j - 1] + 1,   // insertion
        prevRow[j - 1] + cost // substitution
      );
    }

    // Swap row buffers
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[len2];
}

/**
 * Determines whether a search token fuzzy-matches any word in a candidate target string.
 * Allows 1 edit for 4-6 letter words, 2 edits for words longer than 6 letters.
 */
export function tokenMatchesWordFuzzy(token: string, targetWords: string[]): boolean {
  if (!token || targetWords.length === 0) return false;

  // Single letter initial (e.g. "m" for "m.")
  if (token.length === 1) {
    return targetWords.some(w => w.startsWith(token));
  }

  const maxAllowedDist = token.length <= 4 ? 0 : (token.length <= 6 ? 1 : 2);

  for (const word of targetWords) {
    // Exact or direct prefix match
    if (word === token || word.startsWith(token) || token.startsWith(word)) {
      return true;
    }

    // Substring containment (e.g. "wanjohi" inside "wanjohikenpro")
    if (word.includes(token) || token.includes(word)) {
      return true;
    }

    // Levenshtein fuzzy distance for typo tolerance
    if (Math.abs(word.length - token.length) <= maxAllowedDist) {
      if (levenshteinDistance(token, word) <= maxAllowedDist) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Core matching engine: returns true if candidate text matches the search query.
 * Multi-token query matches if EVERY meaningful search token matches at least one target field.
 */
export function matchesQueryFuzzy(query: string, candidateFields: (string | null | undefined)[]): boolean {
  if (!query || !query.trim()) return true;

  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return true;

  // Aggregate all candidate text into words
  const combinedText = candidateFields.filter(Boolean).map(f => normalizeSearchText(f!)).join(" ");
  if (!combinedText) return false;

  const targetWords = combinedText.split(/[\s,._-]+/).filter(Boolean);

  // Every token in the query must match at least one word in target fields
  for (const token of tokens) {
    if (!tokenMatchesWordFuzzy(token, targetWords)) {
      return false;
    }
  }

  return true;
}

/**
 * Computes a numeric relevance score (higher = better match) for sorting.
 */
export function calculateFuzzyScore(query: string, primaryText: string, secondaryText: string = ""): number {
  const normQuery = normalizeSearchText(query);
  const normPrimary = normalizeSearchText(primaryText);
  const normSecondary = normalizeSearchText(secondaryText);

  if (!normQuery) return 0;

  // 1. Exact phrase match on primary text
  if (normPrimary === normQuery) return 1000;
  if (normPrimary.startsWith(normQuery)) return 800;
  if (normPrimary.includes(normQuery)) return 600;

  // 2. Token overlap score
  const tokens = tokenizeQuery(query);
  const primaryWords = normPrimary.split(/[\s,._-]+/).filter(Boolean);
  const secondaryWords = normSecondary.split(/[\s,._-]+/).filter(Boolean);

  let score = 0;
  let matchedTokens = 0;

  for (const token of tokens) {
    if (primaryWords.includes(token)) {
      score += 150;
      matchedTokens++;
    } else if (tokenMatchesWordFuzzy(token, primaryWords)) {
      score += 90;
      matchedTokens++;
    } else if (secondaryWords.includes(token)) {
      score += 50;
      matchedTokens++;
    } else if (tokenMatchesWordFuzzy(token, secondaryWords)) {
      score += 30;
      matchedTokens++;
    }
  }

  if (matchedTokens === tokens.length) {
    score += 200; // Bonus for full token coverage
  }

  return score;
}
