import { useState, useCallback, useEffect } from "react";
import { logEvent } from "../services/telemetry-service.js";
import { getQrSession } from "../utils/qr-session.js";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  is_bundled?: boolean;
  selected_options?: Record<string, string>;
  instance_id?: string; // Unique ID for this specific variant combo
}

export interface Coupon {
  id: string;
  name: string;
  discount_type: 'percent' | 'flat' | 'bundle_price';
  discount_value?: number;
  bundle_price?: number;
  min_items?: number;
  promotion_items?: Array<{ menu_item_id: string }>;
}

export function useCart() {
  const session = getQrSession();
  const shopId = session?.shop_id || "global";

  const CART_STORAGE_KEY = `qr_cart_${shopId}`;
  const COUPON_STORAGE_KEY = `qr_active_coupon_${shopId}`;
  const PARENT_ORDER_KEY = `qr_parent_order_${shopId}`;

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(() => {
    try {
      const raw = localStorage.getItem(COUPON_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  });

  const [parentOrderId, setParentOrderId] = useState<string | null>(() => {
    return localStorage.getItem(PARENT_ORDER_KEY) || null;
  });

  // Persist parent order id
  useEffect(() => {
    if (parentOrderId) {
      localStorage.setItem(PARENT_ORDER_KEY, parentOrderId);
    } else {
      localStorage.removeItem(PARENT_ORDER_KEY);
    }
  }, [parentOrderId, PARENT_ORDER_KEY]);

  // Persist cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, CART_STORAGE_KEY]);

  // Persist active coupon
  useEffect(() => {
    try {
      if (activeCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(activeCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch {}
  }, [activeCoupon, COUPON_STORAGE_KEY]);

  const applyCoupon = useCallback((coupon: Coupon) => {
    setActiveCoupon(coupon);
  }, []);

  const removeCoupon = useCallback(() => {
    setActiveCoupon(null);
  }, []);

  const generateInstanceId = (id: string, options?: Record<string, string>) => {
    if (!options || Object.keys(options).length === 0) return id;
    const optionsHash = Object.entries(options)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    return `${id}-${optionsHash}`;
  };

  const addItem = useCallback((menuItem: Omit<CartItem, 'quantity' | 'instance_id'>) => {
    const instanceId = generateInstanceId(menuItem.id, menuItem.selected_options);
    
    setItems((prev) => {
      const existing = prev.find((i) => i.instance_id === instanceId);
      if (existing) {
        return prev.map((i) =>
          i.instance_id === instanceId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...menuItem, quantity: 1, instance_id: instanceId } as CartItem];
    });

    const currentSession = getQrSession();
    if (currentSession) {
      logEvent("item_added_to_cart", "N/A", currentSession.shop_id, navigator.userAgent, {
        item_id: menuItem.id,
        instance_id: instanceId,
        item_name: menuItem.name,
        price: menuItem.price,
        options: menuItem.selected_options
      });
    }
  }, []);

  const addBundle = useCallback((promo: Coupon, bundleItems: Omit<CartItem, 'quantity' | 'instance_id'>[]) => {
    // 1. Clear cart to avoid mixing bundle pricing with individual items
    setItems(bundleItems.map(item => ({ 
      ...item, 
      quantity: 1, 
      is_bundled: true, 
      instance_id: generateInstanceId(item.id, item.selected_options) 
    } as CartItem)));
    
    // 2. Apply the promotion automatically
    setActiveCoupon(promo);

    const currentSession = getQrSession();
    if (currentSession) {
      logEvent("bundle_claimed", "N/A", currentSession.shop_id, navigator.userAgent, {
        bundle_id: promo.id,
        bundle_name: promo.name
      });
    }
  }, []);

  const removeItem = useCallback((instanceId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.instance_id === instanceId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.instance_id === instanceId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.instance_id !== instanceId);
    });
    
    const currentSession = getQrSession();
    if (currentSession) {
      logEvent("item_removed_from_cart", "N/A", currentSession.shop_id, navigator.userAgent, {
        instance_id: instanceId
      });
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setActiveCoupon(null);
    setParentOrderId(null);
    
    const currentSession = getQrSession();
    const sid = currentSession?.shop_id || "global";
    localStorage.removeItem(`qr_cart_${sid}`);
    localStorage.removeItem(`qr_parent_order_${sid}`);
    localStorage.removeItem(`qr_active_coupon_${sid}`);
  }, []);

  const loadRevision = useCallback((orderToRevise: any, itemsToLoad: CartItem[]) => {
    setItems(itemsToLoad);
    const pId = orderToRevise.parent_order_id || orderToRevise.id;
    setParentOrderId(pId);
    
    const currentSession = getQrSession();
    const sid = currentSession?.shop_id || "global";
    localStorage.setItem(`qr_cart_${sid}`, JSON.stringify(itemsToLoad));
    localStorage.setItem(`qr_parent_order_${sid}`, pId);
  }, []);

  // Calculate Base Cost
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate Discount
  let discountAmount = 0;
  if (activeCoupon) {
    const { discount_type, discount_value, bundle_price, min_items, promotion_items } = activeCoupon;
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    
    // Check if minimum items condition is met
    const meetsMinItems = totalItems >= (min_items || 1);
    
    // Check if specific products are required
    const requiredProductIds = new Set(promotion_items?.map(pi => pi.menu_item_id) || []);
    const hasRequiredProducts = requiredProductIds.size === 0 || 
      requiredProductIds.has('ALL') || // Wildcard for all items
      items.some(item => requiredProductIds.has(item.id));

    if (meetsMinItems && hasRequiredProducts) {
      if (discount_type === 'percent') {
        discountAmount = (subtotal * (discount_value || 0)) / 100;
      } else if (discount_type === 'flat') {
        discountAmount = Math.min(subtotal, discount_value || 0);
      } else if (discount_type === 'bundle_price') {
        discountAmount = Math.max(0, subtotal - (bundle_price || subtotal));
      }
    }
  }

  // Final Cost
  const total = Math.max(0, subtotal - discountAmount);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { 
    items, 
    addItem, 
    addBundle,
    removeItem, 
    clearCart, 
    subtotal,
    discountAmount,
    total, 
    itemCount,
    activeCoupon,
    applyCoupon,
    removeCoupon,
    parentOrderId,
    loadRevision
  };
}
