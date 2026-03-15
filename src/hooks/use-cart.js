import { useState, useCallback, useEffect } from "react";
import { logEvent } from "../services/telemetry-service";
import { getQrSession } from "../utils/qr-session";

const CART_STORAGE_KEY = "qr_cart";

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

function saveCartToStorage(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

export function useCart() {
  const [items, setItems] = useState(() => loadCartFromStorage());

  // Persist cart to localStorage on change
  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

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
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, addItem, removeItem, clearCart, total, itemCount };
}
