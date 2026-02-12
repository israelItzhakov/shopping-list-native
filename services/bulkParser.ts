import { BulkParsedItem, ParsedLineItem, Product, SplitResult } from '../types/models';
import { findBestMatch, normalizeProductName } from './productMatcher';

export function parseLineItem(line: string): ParsedLineItem | null {
  // Remove bullets, numbers, emojis
  let cleaned = line
    .replace(/^[\s]*[-•*·–—]\s*/, '')
    .replace(/^[\s]*\d+[.)]\s*/, '')
    .replace(/^[\s]*[✅✓☑️⬜️🔲]\s*/, '')
    .trim();

  if (!cleaned) return null;

  let quantity = '';
  let name = cleaned;

  // Pattern 1: "product - 2" or "product - 2 ליטר"
  const dashQty = name.match(/^(.+?)\s*[-–—]\s*(\d+\.?\d*)\s*(.*)$/);
  if (dashQty) {
    name = dashQty[1].trim();
    quantity = (dashQty[2] + ' ' + dashQty[3]).trim();
  }

  // Pattern 2: "product x2" or "product X3"
  if (!quantity) {
    const xQty = name.match(/^(.+?)\s*[xX×]\s*(\d+\.?\d*)\s*(.*)$/);
    if (xQty) {
      name = xQty[1].trim();
      quantity = (xQty[2] + ' ' + xQty[3]).trim();
    }
  }

  // Pattern 3: "2 product" or "3 חבילות product"
  if (!quantity) {
    const leadQty = name.match(
      /^(\d+\.?\d*)\s+(חבילות|חבילה|יח'?|יחידות?|ק"ג|קילו|גרם|ליטר|מ"ל|בקבוקים?|שקיות?|קופסאות?|קרטון)?\s*(.+)$/
    );
    if (leadQty) {
      quantity = (leadQty[1] + ' ' + (leadQty[2] || '')).trim();
      name = leadQty[3].trim();
    }
  }

  // Pattern 4: "product 2 ק"ג" (trailing with unit)
  if (!quantity) {
    const trailQty = name.match(
      /^(.+?)\s+(\d+\.?\d*)\s*(חבילות|חבילה|יח'?|יחידות?|ק"ג|קילו|גרם|ליטר|מ"ל|בקבוקים?|שקיות?|קופסאות?|קרטון)$/
    );
    if (trailQty) {
      name = trailQty[1].trim();
      quantity = (trailQty[2] + ' ' + trailQty[3]).trim();
    }
  }

  // Pattern 5: "product 5" (trailing bare number)
  if (!quantity) {
    const bareTrailQty = name.match(/^(.+?)\s+(\d+\.?\d*)$/);
    if (bareTrailQty && bareTrailQty[1].trim().length > 1) {
      name = bareTrailQty[1].trim();
      quantity = bareTrailQty[2];
    }
  }

  return { name, quantity };
}

export function trySplitLine(
  text: string,
  productDatabase: Record<string, Product>
): SplitResult[] {
  // Try delimiters: comma, slash, "ו" (and)
  const delimiters = [/\s*,\s*/, /\s*\/\s*/, /\s+ו/];
  for (const delim of delimiters) {
    const parts = text
      .split(delim)
      .map((p) => p.trim())
      .filter((p) => p);
    if (parts.length > 1) {
      const results: SplitResult[] = parts.map((p) => ({
        text: p,
        match: findBestMatch(p, productDatabase),
      }));
      if (results.some((r) => r.match)) return results;
    }
  }

  // Try space-based splitting
  const words = text.split(/\s+/);
  if (words.length < 2) return [{ text, match: null }];

  const meaningfulWords = words.filter((w) => !/^\d+\.?\d*$/.test(w));
  if (meaningfulWords.length < 2) return [{ text, match: null }];

  // Strategy 1: Greedy (longest phrase first)
  const greedyResults: SplitResult[] = [];
  let i = 0;
  while (i < words.length) {
    if (/^\d+\.?\d*$/.test(words[i])) {
      i++;
      continue;
    }

    let bestLen = 0;
    let bestMatch: Product | null = null;
    for (let len = Math.min(3, words.length - i); len >= 1; len--) {
      const phrase = words.slice(i, i + len).join(' ');
      const match = findBestMatch(phrase, productDatabase);
      if (match && match.name) {
        bestLen = len;
        bestMatch = match;
        break;
      }
    }

    if (bestMatch) {
      greedyResults.push({
        text: words.slice(i, i + bestLen).join(' '),
        match: bestMatch,
      });
      i += bestLen;
    } else {
      greedyResults.push({ text: words[i], match: null });
      i++;
    }
  }

  // Strategy 2: Single words only
  const singleResults: SplitResult[] = meaningfulWords.map((w) => ({
    text: w,
    match: findBestMatch(w, productDatabase),
  }));

  // Pick strategy with more matches
  const greedyMatches = greedyResults.filter((r) => r.match).length;
  const singleMatches = singleResults.filter((r) => r.match).length;

  const best = singleMatches > greedyMatches ? singleResults : greedyResults;
  const bestMatchCount = Math.max(greedyMatches, singleMatches);

  if (best.length > 1 && bestMatchCount >= 2) {
    return best;
  }

  return [{ text, match: null }];
}

export function parseBulkText(
  text: string,
  productDatabase: Record<string, Product>
): BulkParsedItem[] {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const bulkParsedItems: BulkParsedItem[] = [];

  lines.forEach((line) => {
    const parsed = parseLineItem(line);
    if (!parsed) return;

    const match = findBestMatch(parsed.name, productDatabase);
    const isExactMatch =
      match &&
      normalizeProductName(match.name) === normalizeProductName(parsed.name);

    const subItems = trySplitLine(parsed.name, productDatabase);
    const splitMatched = subItems.filter((s) => s.match);
    const uniqueProducts = new Set(splitMatched.map((s) => s.match!.name));

    // Prefer split only if: fuzzy match + 2+ unique products found
    if (subItems.length > 1 && uniqueProducts.size >= 2 && !isExactMatch) {
      subItems.forEach((sub) => {
        bulkParsedItems.push({
          originalText: line,
          name: sub.match ? sub.match.name : sub.text,
          category: sub.match ? sub.match.category : 'other',
          quantity: '',
          matched: !!sub.match,
          selected: true,
        });
      });
    } else if (match) {
      bulkParsedItems.push({
        originalText: line,
        name: match.name,
        category: match.category,
        quantity: parsed.quantity,
        matched: true,
        selected: true,
      });
    } else {
      bulkParsedItems.push({
        originalText: line,
        name: parsed.name,
        category: 'other',
        quantity: parsed.quantity,
        matched: false,
        selected: true,
      });
    }
  });

  return bulkParsedItems;
}
