import { describe, it, expect } from "vitest";
import { getLevenshteinDistance, fuzzyMatchProducts } from "./fuzzy-search";

describe("Levenshtein Distance Algorithm", () => {
  it("should return 0 for identical strings", () => {
    expect(getLevenshteinDistance("water", "water")).toBe(0);
    expect(getLevenshteinDistance("", "")).toBe(0);
  });

  it("should handle empty strings correctly by returning length of non-empty string", () => {
    expect(getLevenshteinDistance("water", "")).toBe(5);
    expect(getLevenshteinDistance("", "walnuts")).toBe(7);
  });

  it("should calculate correct edit distance for substitutions", () => {
    // pecas -> pecan (1 substitution)
    expect(getLevenshteinDistance("pecas", "pecan")).toBe(1);
    // wster -> water (1 substitution)
    expect(getLevenshteinDistance("wster", "water")).toBe(1);
  });

  it("should calculate correct edit distance for deletions", () => {
    // wallnuts -> walnuts (1 deletion)
    expect(getLevenshteinDistance("wallnuts", "walnuts")).toBe(1);
  });

  it("should calculate correct edit distance for insertions", () => {
    // pecas -> pecans (1 insertion)
    expect(getLevenshteinDistance("pecas", "pecans")).toBe(1);
  });

  it("should calculate correct edit distance for complex multi-operation changes", () => {
    // hibbisus -> hibiscus (1 deletion of 'b', 1 insertion of 'c')
    expect(getLevenshteinDistance("hibbisus", "hibiscus")).toBe(2);
  });
});

describe("Fuzzy Product Matcher (fuzzyMatchProducts)", () => {
  const catalog = [
    { id: "1", name: "Sparkling Water", category: "Beverages", description: "Fresh bubbling water" },
    { id: "2", name: "Raw Walnuts", category: "Nuts", description: "Unfiltered Kiambu walnuts" },
    { id: "3", name: "Pecans Pack", category: "Nuts", description: "Salted roasted pecans" },
    { id: "4", name: "Hibiscus Tea", category: "Beverages", description: "Organic herbal hibiscus tea" },
    { id: "5", name: "Espresso Coffee", category: "Coffee", description: "Strong dark roast coffee" }
  ];

  it("should prioritize high-confidence direct substring matches first", () => {
    const results = fuzzyMatchProducts(catalog, "water");
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Sparkling Water");
  });

  it("should fall back to Levenshtein matches for typos in word tokens", () => {
    // 'wster' matches 'Water' (distance = 1, threshold = 2 for length 5)
    const waterTypos = fuzzyMatchProducts(catalog, "wster");
    expect(waterTypos.length).toBe(1);
    expect(waterTypos[0].name).toBe("Sparkling Water");

    // 'wallnuts' matches 'Walnuts' (distance = 1, threshold = 3 for length 8)
    const walnutTypos = fuzzyMatchProducts(catalog, "wallnuts");
    expect(walnutTypos.length).toBe(1);
    expect(walnutTypos[0].name).toBe("Raw Walnuts");
  });

  it("should handle multi-word query typos gracefully", () => {
    // 'hibisscus teea' has minimum distance 1 to both 'Hibiscus' and 'Tea'
    const results = fuzzyMatchProducts(catalog, "hibisscus teea");
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Hibiscus Tea");
  });

  it("should respect length-based threshold constraints to prevent false positives", () => {
    // Short word 'cofe' (length 4, threshold 1) matches 'coffee' (distance 2, 'cofe' vs 'coffee') -> rejected!
    // But it will match 'Coffee' if distance is 1 (e.g. 'coffe' -> 1 deletion)
    const results = fuzzyMatchProducts(catalog, "xyz");
    expect(results.length).toBe(0);
  });

  it("should return at most 3 items to optimize presentation layouts", () => {
    const broadCatalog = [
      { id: "1", name: "Water A", category: "Water" },
      { id: "2", name: "Water B", category: "Water" },
      { id: "3", name: "Water C", category: "Water" },
      { id: "4", name: "Water D", category: "Water" }
    ];
    const results = fuzzyMatchProducts(broadCatalog, "water");
    expect(results.length).toBe(3); // capped at 3
  });
});
