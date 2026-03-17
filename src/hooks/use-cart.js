import { useState, useCallback, useEffect } from "react";
import { logEvent } from "../services/telemetry-service";
import { getQrSession } from "../utils/qr-session";

const CART_STORAGE_KEY = "qr_cart";
const COUPON_STORAGE_KEY = "qr_active_coupon";
const PARENT_ORDER_KEY = "qr_parent_order";

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore corrupt data
  }
  return [];
}

function loadCouponFromStorage() {
  try {
    const raw = localStorage.getItem(COUPON_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveCartToStorage(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

export function useCart() {
  const [items, setItems] = useState(() => loadCartFromStorage());
  const [activeCoupon, setActiveCoupon] = useState(() => loadCouponFromStorage());
  const [parentOrderId, setParentOrderId] = useState(() => localStorage.getItem(PARENT_ORDER_KEY) || null);

  // Persist parent order id
  useEffect(() => {
    if (parentOrderId) {
      localStorage.setItem(PARENT_ORDER_KEY, parentOrderId);
    } else {
      localStorage.removeItem(PARENT_ORDER_KEY);
    }
  }, [parentOrderId]);

  // Persist cart to localStorage on change
  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  // Persist active coupon
  useEffect(() => {
    try {
      if (activeCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(activeCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch {}
  }, [activeCoupon]);

  const applyCoupon = useCallback((coupon) => {
    setActiveCoupon(coupon);
  }, []);

  const removeCoupon = useCallback(() => {
    setActiveCoupon(null);
  }, []);

  const addItem = useCallback((menuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...menuItem, quantity: 1 }];
    });

    const session = getQrSession();
    if (session) {
      logEvent("item_added_to_cart", "N/A", session.shop_id, navigator.userAgent, {
        item_id: menuItem.id,
        item_name: menuItem.name,
        price: menuItem.price
      });
    }
  }, []);

  const removeItem = useCallback((itemId) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== itemId);
    });
    
    const session = getQrSession();
    if (session) {
      logEvent("item_removed_from_cart", "N/A", session.shop_id, navigator.userAgent, {
        item_id: itemId
      });
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setActiveCoupon(null);
    setParentOrderId(null);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(PARENT_ORDER_KEY);
  }, []);

  const loadRevision = useCallback((orderToRevise, itemsToLoad) => {
    setItems(itemsToLoad);
    setParentOrderId(orderToRevise.parent_order_id || orderToRevise.id);
  }, []);

  // Calculate Base Cost
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate Discount
  const discountAmount = activeCoupon 
    ? (subtotal * activeCoupon.discountPercentage) / 100 
    : 0;

  // Final Cost
  const total = Math.max(0, subtotal - discountAmount);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { 
    items, 
    addItem, 
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
