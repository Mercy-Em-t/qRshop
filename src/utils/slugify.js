/**
 * Converts a text string into a URL-friendly, SEO-optimized slug.
 * e.g., "Delicious Cheeseburger 🍔!" -> "delicious-cheeseburger"
 */
export function slugify(text) {
  if (!text) return "product";
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")           // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word characters (except -)
    .replace(/\-\-+/g, "-")         // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start
    .replace(/-+$/, "");            // Trim - from end
}
