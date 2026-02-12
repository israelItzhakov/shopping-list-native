import { Product } from '../types/models';
import { levenshteinSimilarity } from '../utils/levenshtein';

export function normalizeProductName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function bestMatchThreshold(a: string, b: string): number {
  const minLen = Math.min(a.length, b.length);
  if (minLen <= 3) return 0.75;
  if (minLen <= 5) return 0.6;
  return 0.5;
}

export function findBestMatch(
  inputName: string,
  productDatabase: Record<string, Product>
): Product | null {
  const normalized = normalizeProductName(inputName);
  if (!normalized) return null;

  // 1. Exact normalized match
  if (productDatabase[normalized]) {
    return productDatabase[normalized];
  }

  const allProducts = Object.values(productDatabase);

  // 2. Exact name match (case insensitive)
  const exact = allProducts.find(
    (p) => normalizeProductName(p.name) === normalized
  );
  if (exact) return exact;

  // 3. Fuzzy matching with scoring
  let bestMatch: Product | null = null;
  let bestScore = 0;

  allProducts.forEach((p) => {
    const pName = normalizeProductName(p.name);
    let score = 0;

    if (pName.includes(normalized)) {
      score = Math.min(normalized.length / pName.length + 0.15, 1);
    } else if (normalized.includes(pName)) {
      const coverage = pName.length / normalized.length;
      score = coverage >= 0.8 ? coverage : 0;
    } else {
      score = levenshteinSimilarity(normalized, pName);
    }

    const threshold = bestMatchThreshold(normalized, pName);
    if (score > bestScore && score > threshold) {
      bestScore = score;
      bestMatch = p;
    }
  });

  return bestMatch;
}
