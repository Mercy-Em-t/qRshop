import { describe, it, expect } from 'vitest';
import { DataAnalyticsSetEngine } from './DataLayer.js';
import { BooleanQueryOptimizer, PredicateQuantificationEngine } from './LogicLayer.js';

/**
 * SYSTEM ANALYST BLUEPRINT: RIGID REPOSITORY UNIT TESTS (Task 20)
 * Target: Assert mathematical accuracy across all logic and set sub-modules
 */
describe('DiscreteEngine: Mathematical & Logical Integrity Tests', () => {
  
  const setupMockWorkspaceData = () => {
    // Hardcode a deterministic test universe of 4 items
    return {
      universe: new Set(["SKU-01", "SKU-02", "SKU-03", "SKU-04"]),
      repeats: new Set(["SKU-01", "SKU-02"]),
      primitiveVipCore: new Set(["SKU-01"]),
      unorderedDeadStock: new Set(["SKU-03", "SKU-04"])
    };
  };

  const setupMockInventoryData = () => {
    return {
      inventoryCounts: { "SKU-01": 15, "SKU-02": 3, "SKU-03": 0, "SKU-04": 20 },
      shelfLocations: { "SKU-03": "Aisle_1_Front", "SKU-04": "Back_Warehouse" }
    };
  };

  // Test 1: Validate Set Cardinality Identities (Tasks 1 & 2)
  it('test_set_cardinality_identity: Verify disjoint sets sum up to universe size', () => {
    const mockData = setupMockWorkspaceData();
    
    // ordered items + unordered items must equal the whole catalog
    const orderedItems = DataAnalyticsSetEngine.union(mockData.repeats, mockData.primitiveVipCore);
    const orderedCount = orderedItems.size; // Should be 2 ("SKU-01", "SKU-02")
    const deadCount = mockData.unorderedDeadStock.size; // Should be 2 ("SKU-03", "SKU-04")
    
    const totalCalculated = orderedCount + deadCount;
    
    expect(totalCalculated).toBe(mockData.universe.size);
  });

  // Test 2: Validate De Morgan's Law Query Transformation Optimization (Task 17)
  it('test_de_morgan_optimization_parser: Verify boolean query flattening', () => {
    // Define mock configuration representing: NOT (p OR q)
    const unoptimizedInput = {
      operator: "NOT",
      operand: { operator: "OR", left: "p", right: "q" }
    };
    
    const optimizedOutput = BooleanQueryOptimizer.optimizeQueryObject(unoptimizedInput);
    
    // The parser must rewrite this to (NOT p) AND (NOT q)
    expect(optimizedOutput.operator).toBe("AND");
    expect(optimizedOutput.leftClause.operator).toBe("NOT");
    expect(optimizedOutput.rightClause.operator).toBe("NOT");
    expect(optimizedOutput.leftClause.target).toBe("p");
    expect(optimizedOutput.rightClause.target).toBe("q");
  });

  // Test 3: Validate Universal Predicate Quantifications (Task 18)
  it('test_universal_quantifier_safety: Proves if ALL VIP items satisfy the adequate stock rule', () => {
    const mockData = setupMockWorkspaceData();
    const inventory = setupMockInventoryData();
    const engine = new PredicateQuantificationEngine(mockData, inventory.inventoryCounts, inventory.shelfLocations);
    
    const result = engine.verifyUniversalVipSafety();
    
    // In our mock data, SKU-01 is VIP and its inventory count is 15 (> 10). So it should pass.
    expect(result.assertionPassed).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  // Test 4: Validate Existential Fault Catching (Task 19)
  it('test_existential_anomaly_detection: Find out if there EXISTS at least one item meeting an anomaly rule', () => {
    const mockData = setupMockWorkspaceData();
    const inventory = setupMockInventoryData();
    const engine = new PredicateQuantificationEngine(mockData, inventory.inventoryCounts, inventory.shelfLocations);
    
    const result = engine.verifyExistentialDeadSpaceAnomaly();
    
    // SKU-03 is dead stock AND on the premium front aisle. It must trigger the anomaly.
    expect(result.assertionSatisfied).toBe(true);
    expect(result.witnessSku).toBe("SKU-03");
  });
});
