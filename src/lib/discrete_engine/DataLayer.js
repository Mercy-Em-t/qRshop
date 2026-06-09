/**
 * SYSTEM ANALYST BLUEPRINT: SET INGESTION & TEMPORAL MATRIX (Tasks 1-10)
 * Target: Reduce product catalog to atomic behavioral sets and compute coefficients.
 */

export class DataAnalyticsSetEngine {
  /**
   * @param {Object} db - Supabase client instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Helper to perform Set operations on JavaScript Sets
   */
  static intersection(setA, setB) {
    return new Set([...setA].filter((x) => setB.has(x)));
  }

  static difference(setA, setB) {
    return new Set([...setA].filter((x) => !setB.has(x)));
  }

  static union(setA, setB) {
    return new Set([...setA, ...setB]);
  }

  static symmetricDifference(setA, setB) {
    return this.union(this.difference(setA, setB), this.difference(setB, setA));
  }

  /**
   * Task 1 & 2: Pipeline to break sets down to primitive forms
   * @param {String} shopId 
   * @param {String} startDate 
   * @param {String} endDate 
   * @returns {Promise<Object>} Decomposed catalog states
   */
  async decomposeCatalog(shopId, startDate, endDate) {
    // 1. Fetch Universal Set (All active items for shop)
    const { data: products } = await this.db
      .from('menu_items')
      .select('id')
      .eq('shop_id', shopId);
    
    const universe = new Set(products?.map(p => p.id) || []);

    // 2. Fetch transactional data for the time window
    const { data: rawOrders } = await this.db
      .from('order_items')
      .select('menu_item_id, quantity, orders!inner(created_at, shop_id, total_price)')
      .eq('orders.shop_id', shopId)
      .gte('orders.created_at', startDate)
      .lte('orders.created_at', endDate);

    // Aggregate frequencies manually if RPC isn't available
    const frequencies = {};
    const highValueItemsSet = new Set(); // Items ordered in high-value VIP orders
    const VIP_ORDER_THRESHOLD = 500; // Define what constitutes a "VIP" order

    (rawOrders || []).forEach(row => {
      frequencies[row.menu_item_id] = (frequencies[row.menu_item_id] || 0) + row.quantity;
      
      if (row.orders.total_price >= VIP_ORDER_THRESHOLD) {
        highValueItemsSet.add(row.menu_item_id);
      }
    });

    // Build Stage 1 Sets (The Initial Binary Split)
    const orderedSet = new Set(Object.keys(frequencies));
    const singleOrderSet = new Set();
    const repeatOrderSet = new Set();
    
    // Stage 2: Frequency Split
    for (const [itemId, count] of Object.entries(frequencies)) {
      if (count === 1) singleOrderSet.add(itemId);
      else if (count > 1) repeatOrderSet.add(itemId);
    }

    // Stage 3: VIP Binding based on high-value orders (Option A)
    // The items in highValueItemsSet act as our VIP anchors
    const primitiveVipCore = DataAnalyticsSetEngine.intersection(repeatOrderSet, highValueItemsSet);
    const primitiveFragileSingletons = DataAnalyticsSetEngine.difference(singleOrderSet, highValueItemsSet);

    // Apply Relative Complement to find Dead Stock
    const unorderedDeadStock = DataAnalyticsSetEngine.difference(universe, orderedSet);

    return {
      universe,
      ordered: orderedSet,
      unorderedDeadStock,
      singletons: singleOrderSet,
      repeats: repeatOrderSet,
      primitiveVipCore,
      primitiveFragileSingletons
    };
  }

  /**
   * Task 6: Mathematical Similarity & Volatility Matrix
   * Formula: |A ∩ B| / |A ∪ B|
   */
  static computeJaccardSimilarity(setA, setB) {
    const intersectionSize = this.intersection(setA, setB).size;
    const unionSize = this.union(setA, setB).size;
    if (unionSize === 0) return 0.0;
    return intersectionSize / unionSize;
  }

  /**
   * Formula: |A ∩ B| / min(|A|, |B|)
   */
  static computeOverlapCoefficient(setA, setB) {
    const intersectionSize = this.intersection(setA, setB).size;
    const minSize = Math.min(setA.size, setB.size);
    if (minSize === 0) return 0.0;
    return intersectionSize / minSize;
  }

  /**
   * Task 3 & 4: Temporal Comparison Matrix
   */
  async analyzeTemporalShift(shopId, t1Start, t1End, t2Start, t2End) {
    const T1_Data = await this.decomposeCatalog(shopId, t1Start, t1End);
    const T2_Data = await this.decomposeCatalog(shopId, t2Start, t2End);

    const A_t1 = T1_Data.ordered;
    const A_t2 = T2_Data.ordered;

    // Identities
    const stableDemand = DataAnalyticsSetEngine.intersection(A_t1, A_t2);
    const fadedTrends = DataAnalyticsSetEngine.difference(A_t1, A_t2);
    const newMovers = DataAnalyticsSetEngine.difference(A_t2, A_t1);
    const volatility = DataAnalyticsSetEngine.symmetricDifference(A_t1, A_t2);

    // Inferences
    const directives = [];
    if (stableDemand.size < (A_t1.size * 0.20)) {
      directives.push("CRITICAL: Low Product Retention. Core inventory is shifting drastically. High volatility.");
    } else {
      directives.push("STABLE: Strong catalog core baseline established period-over-period.");
    }

    const persistentDeadStock = DataAnalyticsSetEngine.intersection(T1_Data.unorderedDeadStock, T2_Data.unorderedDeadStock);
    if (persistentDeadStock.size > 0) {
      directives.push(`LIQUIDATION WARNING: ${persistentDeadStock.size} items are persistently dead in both cycles. Purge shelf space immediately.`);
    }

    const lostVipStaples = DataAnalyticsSetEngine.intersection(T1_Data.primitiveVipCore, fadedTrends);
    if (lostVipStaples.size > 0) {
      directives.push(`REVENUE ALERT: ${lostVipStaples.size} high-value VIP favorite items have completely dropped out of current sales cycles.`);
    }

    return {
      metrics: {
        stableCount: stableDemand.size,
        fadedCount: fadedTrends.size,
        newMoversCount: newMovers.size,
        volatilityCount: volatility.size
      },
      sets: {
        stableDemand,
        fadedTrends,
        newMovers,
        volatility
      },
      coefficients: {
        jaccard: DataAnalyticsSetEngine.computeJaccardSimilarity(A_t1, A_t2),
        overlap: DataAnalyticsSetEngine.computeOverlapCoefficient(A_t1, A_t2)
      },
      directives,
      raw_states: {
        t1: T1_Data,
        t2: T2_Data
      }
    };
  }
}
