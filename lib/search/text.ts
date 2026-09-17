/** Lowercase, strip accents and punctuation, collapse whitespace. */
export function normalize(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  const n = normalize(input);
  return n ? n.split(" ") : [];
}

export type WeightedField = { text: string; weight: number };

/**
 * Score a document against query tokens.
 *
 * Every token must match at least one field (prefix match on a word), so
 * "henry dan" matches "Henry Danger" but "henry thunder" doesn't match it.
 * Exact word matches and full-phrase matches score higher than prefixes.
 * Returns 0 when the document doesn't match.
 */
export function scoreDocument(queryTokens: string[], fields: WeightedField[]): number {
  if (queryTokens.length === 0) return 0;

  const prepared = fields.map((f) => ({ words: tokenize(f.text), phrase: normalize(f.text), weight: f.weight }));
  const phrase = queryTokens.join(" ");
  let total = 0;

  for (const token of queryTokens) {
    let best = 0;
    for (const field of prepared) {
      for (const word of field.words) {
        if (word === token) best = Math.max(best, field.weight * 2);
        else if (word.startsWith(token)) best = Math.max(best, field.weight * (token.length >= 3 ? 1.2 : 0.6));
      }
    }
    if (best === 0) return 0;
    total += best;
  }

  for (const field of prepared) {
    if (field.phrase === phrase) total += field.weight * 4;
    else if (queryTokens.length > 1 && field.phrase.includes(phrase)) total += field.weight * 2;
  }

  return total;
}
