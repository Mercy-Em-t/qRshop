/**
 * sales-content-generator.js
 * Core engine for auto-generating headline, sales scripts, and recipes from product data.
 */

const CATEGORY_TEMPLATES = {
  "Tea": {
    headline: "{name}: Your Daily Wellness Ritual",
    problem: "Many people struggle with low energy, stress, or poor digestion.",
    solution: "{name} offers a natural way to support your body's wellness.",
    script: "Our {name} is designed to support {benefits}. It is easy to prepare and ideal for daily wellness routines.",
    benefit_highlight: "Natural focus and energy without the crash."
  },
  "Grains & Cereals": {
    headline: "{name}: Nutritious Everyday Fuel",
    problem: "Finding wholesome staples for the family can be difficult.",
    solution: "{name} is a wholesome pantry staple that provides essential nutrients.",
    script: "{name} provides lasting energy for the whole family. It stands out due to its {processing} quality.",
    benefit_highlight: "Wholesome, fiber-rich, and locally sourced."
  },
  "Nuts & Nut Products": {
    headline: "{name}: Smart Nutrition in Every Bite",
    problem: "Cravings often lead to unhealthy snacking habits.",
    solution: "{name} offers healthy fats and protein for satisfying nutrition.",
    script: "{name} is the perfect snack for your busy day. Our customers love its {processing} taste.",
    benefit_highlight: "Rich in protein and healthy fats."
  },
  "Seeds": {
    headline: "{name}: Nature's Pocket Powerhouse",
    problem: "It's hard to get enough micronutrients in a modern diet.",
    solution: "{name} is a nutrient-dense addition to any meal.",
    script: "Add {name} to your meals for an instant boost of {nutrition}. Truly a wellness essential.",
    benefit_highlight: "Omega-3s and essential minerals in every scoop."
  },
  "Spices & Seasonings": {
    headline: "{name}: Elevate Every Meal",
    problem: "Dull meals make healthy eating feel like a chore.",
    solution: "{name} adds vibrant flavor and medicinal benefits to your kitchen.",
    script: "Our {name} is {processing} and sourced from {origin}. It transforms any dish into a gourmet experience.",
    benefit_highlight: "Aromatic, pure, and high-potency spices."
  },
  "Default": {
    headline: "{name}: Premium Quality for Your Lifestyle",
    problem: "Quality and authenticity are hard to find in today's market.",
    solution: "{name} provides the perfect balance of quality and value.",
    script: "Discover the benefits of {name}. Designed for those who value {processing} standards.",
    benefit_highlight: "Versatile, high-quality, and sustainably sourced."
  }
};

/**
 * Generates a full sales page content object for a product.
 * @param {object} product - The raw product object from the database
 * @returns {object} - The generated sales content
 */
export function generateSalesContent(product) {
  const category = Object.keys(CATEGORY_TEMPLATES).find(cat => 
    product.category?.includes(cat)
  ) || "Default";
  
  const template = CATEGORY_TEMPLATES[category];
  
  const replacePlaceholders = (text) => {
    if (!text) return "";
    return text
      .replace(/{name}/g, product.name || "This product")
      .replace(/{benefits}/g, product.benefits || "natural wellness")
      .replace(/{processing}/g, product.processing || "organic")
      .replace(/{origin}/g, product.origin || "Kenya")
      .replace(/{nutrition}/g, product.nutrition_info || "essential nutrients");
  };

  return {
    headline: replacePlaceholders(template.headline),
    problem: replacePlaceholders(template.problem),
    solution: replacePlaceholders(template.solution),
    sales_script: replacePlaceholders(template.script),
    benefits_summary: product.benefits || replacePlaceholders(template.benefit_highlight),
    recipe_suggestions: product.recipe || "Perfect when paired with our other organic essentials.",
    diet_tags: product.diet_tags || [],
    brand: product.brand || "Modern Savannah"
  };
}
