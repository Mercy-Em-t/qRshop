import { useState, useEffect } from 'react'
import { getQrSession } from '../utils/qr-session'
import { fetchMenuItems } from '../services/menu-service'
import { useCart } from '../hooks/use-cart'
import MenuItem from '../components/menu-item'
import Cart from '../components/cart'
import { useNavigate } from 'react-router-dom'

export default function Menu() {
  const session = getQrSession()
  const navigate = useNavigate()
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { items, addItem, removeItem, updateQuantity, total } = useCart()

  useEffect(() => {
    if (!session) return

    fetchMenuItems(session.shop_id)
      .then(setMenuItems)
      .catch(() => setMenuItems([]))
      .finally(() => setLoading(false))
  }, [session])

  if (!session) return null

  const categories = [...new Set(menuItems.map((item) => item.category))]

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold">Menu</h1>

      {loading ? (
        <p className="text-gray-500">Loading menu...</p>
      ) : (
        categories.map((category) => (
          <section key={category} className="mb-8">
            <h2 className="mb-3 text-xl font-semibold">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {menuItems
                .filter((item) => item.category === category)
                .map((item) => (
                  <MenuItem key={item.id} item={item} onAddToCart={addItem} />
                ))}
            </div>
          </section>
        ))
      )}

      {items.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">Your Cart</h2>
          <Cart
            items={items}
            total={total}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
          />
          <button
            onClick={() => navigate('/cart')}
            className="mt-4 w-full rounded-md bg-green-600 py-3 text-white font-medium hover:bg-green-700"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  )
}
