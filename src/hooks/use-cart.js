import { useState, useCallback } from 'react'

export function useCart() {
  const [items, setItems] = useState([])

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((itemId) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
  }, [])

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return { items, addItem, removeItem, updateQuantity, clearCart, total }
}
