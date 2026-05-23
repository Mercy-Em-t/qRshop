/**
 * Calculations of the Levenshtein Distance for typo-resilient catalog indexing.
 */
export function getLevenshteinDistance(a, b) {
  if (!a) return b ? b.length : 0;
  if (!b) return a ? a.length : 0;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Substitution
          Math.min(
            matrix[i][j - 1] + 1, // Insertion
            matrix[i - 1][j] + 1  // Deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Fuzzy search matches a customer query against catalog inventory.
 * Checks direct category/name intersections first, falling back to Levenshtein matches.
 */
export function fuzzyMatchProducts(menuItems, query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // 1. Direct substring matching (highest confidence)
  const directMatches = menuItems.filter(item => 
    item.name?.toLowerCase().includes(q) ||
    item.category?.toLowerCase().includes(q) ||
    item.description?.toLowerCase().includes(q)
  );

  if (directMatches.length > 0) {
    return directMatches.slice(0, 3);
  }

  // 2. Word-level Levenshtein edit distance matches (handles typos like 'wster' -> 'water')
  const scoredItems = menuItems.map(item => {
    const nameWords = item.name?.toLowerCase().split(/\s+/) || [];
    const categoryWords = item.category?.toLowerCase().split(/\s+/) || [];
    const queryWords = q.split(/\s+/);

    let minDistance = 999;

    for (const qw of queryWords) {
      if (qw.length < 2) continue;
      
      for (const nw of nameWords) {
        if (nw.length < 2) continue;
        const dist = getLevenshteinDistance(qw, nw);
        if (dist < minDistance) minDistance = dist;
      }
      
      for (const cw of categoryWords) {
        if (cw.length < 2) continue;
        const dist = getLevenshteinDistance(qw, cw);
        if (dist < minDistance) minDistance = dist;
      }
    }

    return { item, score: minDistance };
  });

  // Standard threshold logic based on word lengths to prevent false positives
  const threshold = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;

  return scoredItems
    .filter(s => s.score <= threshold)
    .sort((a, b) => a.score - b.score)
    .map(s => s.item)
    .slice(0, 3);
}
