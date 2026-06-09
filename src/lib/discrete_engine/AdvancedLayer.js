/**
 * SYSTEM ANALYST BLUEPRINT: ADVANCED RELATIONS, TOPOLOGY & AUTOMATION LAYER (Tasks 21-25)
 * Target: Implement structural graphs, combinatorial permutations, Markov Chains, and Fuzzy Logic.
 */

/**
 * Task 21: Directed Graph Relations (Product Dependencies)
 */
export class InventoryRelationGraph {
  constructor() {
    // Maps SKU_A -> Set of SKUs bought immediately after/alongside
    this.adjacencyMatrix = new Map();
  }

  addPurchaseRelation(skuOrigin, skuDestination) {
    if (!this.adjacencyMatrix.has(skuOrigin)) {
      this.adjacencyMatrix.set(skuOrigin, new Set());
    }
    this.adjacencyMatrix.get(skuOrigin).add(skuDestination);
  }

  /**
   * Identify absolute bottleneck items (Items that trigger massive downstream demand)
   */
  computeOutDegreeCentrality() {
    const centralityScores = {};
    for (const [skuOrigin, destinations] of this.adjacencyMatrix.entries()) {
      // Out-degree cardinality: How many unique items depend on this single item
      centralityScores[skuOrigin] = destinations.size;
    }
    return centralityScores;
  }
}

/**
 * Task 22: Combinatorial Bundle Maximizer (nCr)
 */
export class CombinatorialBundleEngine {
  static factorial(num) {
    if (num <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= num; i++) {
      result *= i;
    }
    return result;
  }

  static calculateTotalPossibleBundles(nPoolSize, rBundleSize) {
    if (rBundleSize > nPoolSize) return 0;
    return this.factorial(nPoolSize) / (this.factorial(rBundleSize) * this.factorial(nPoolSize - rBundleSize));
  }

  /**
   * Generate clean, non-overlapping product sets via recursive backtracking
   */
  static generateExactCombinations(inputSet, subsetSize) {
    const elements = Array.from(inputSet);
    const results = [];

    const backtrack = (startIndex, currentCombination) => {
      if (currentCombination.length === subsetSize) {
        results.push(new Set(currentCombination));
        return;
      }

      for (let i = startIndex; i < elements.length; i++) {
        currentCombination.push(elements[i]);
        backtrack(i + 1, currentCombination);
        currentCombination.pop(); // Un-choose element
      }
    };

    backtrack(0, []);
    return results;
  }
}

/**
 * Task 23: Markov Chain State Transition Matrix
 * Predict future stock status categories based on probability vectors
 */
export class StochasticInventoryEngine {
  constructor() {
    // Rows: Current State [VIP, SINGLETON, DEAD]
    // Columns: Next Month State [VIP, SINGLETON, DEAD]
    this.transitionMatrix = {
      VIP:       { VIP: 0.80, SINGLETON: 0.15, DEAD: 0.05 },
      SINGLETON: { VIP: 0.10, SINGLETON: 0.60, DEAD: 0.30 },
      DEAD:      { VIP: 0.01, SINGLETON: 0.09, DEAD: 0.90 }
    };
  }

  /**
   * Project where an item will live exactly X months from now
   */
  predictFutureState(currentState, monthsToProject) {
    let stateDistribution = { VIP: 0.0, SINGLETON: 0.0, DEAD: 0.0 };
    if (stateDistribution[currentState] !== undefined) {
      stateDistribution[currentState] = 1.0;
    } else {
      throw new Error(`Invalid state: ${currentState}`);
    }

    for (let step = 1; step <= monthsToProject; step++) {
      let nextDistribution = { VIP: 0.0, SINGLETON: 0.0, DEAD: 0.0 };

      // Vector-Matrix multiplication cross-product loop
      for (const [currentKey, currentProb] of Object.entries(stateDistribution)) {
        for (const [nextKey, transitionProb] of Object.entries(this.transitionMatrix[currentKey])) {
          nextDistribution[nextKey] += currentProb * transitionProb;
        }
      }

      stateDistribution = nextDistribution;
    }

    // Return the state with the absolute highest mathematical likelihood
    return Object.keys(stateDistribution).reduce((a, b) => 
      stateDistribution[a] > stateDistribution[b] ? a : b
    );
  }
}

/**
 * Task 24: Fuzzy Logic Confidence Router
 * Handle real-world ambiguity with Membership Functions (μ(x))
 */
export class FuzzyInventoryLogic {
  /**
   * Membership Function for "Frequence"
   * @returns {number} Value between 0.0 and 1.0
   */
  static evaluateMovementFrequencyMembership(orderCount) {
    if (orderCount <= 1) return 0.0;  // Absolutely False
    if (orderCount >= 10) return 1.0; // Absolutely True

    // Linear interpolation for the blurry gray area between 2 and 9 orders
    return (orderCount - 1) / (10 - 1);
  }

  /**
   * Route procurement risk based on fuzzy intersection (MIN operator)
   * Fuzzy Conjunction (AND) utilizes the Minimum operator
   */
  static computeRestockUrgencyScore(orderCount, itemMarginPercentage) {
    const freqTruth = this.evaluateMovementFrequencyMembership(orderCount);
    const marginTruth = itemMarginPercentage / 100.0;

    // Target assertion: Item has high frequency AND high profitability
    return Math.min(freqTruth, marginTruth);
  }
}
