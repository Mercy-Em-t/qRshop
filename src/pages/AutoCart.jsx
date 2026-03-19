import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { useCart } from "../hooks/use-cart";

// AutoCart — Pre-populate cart from a share link and redirect to cart
// URL format: /auto-cart?shop=SHOP_ID&items=ITEM_ID:QTY,ITEM_ID2:QTY&promo=CODE&name=Bundle+Name

export default function AutoCart() {
  const [searchParams] = useSearchParams();
  const { addItem, clearCart } = useCart();
  const [status, setStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
  const [shopName, setShopName] = useState("");
  const [bundleName, setBundleName] = useState("");
  const [loadedItems, setLoadedItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function seedCart() {
      try {
        let shopId = searchParams.get("shop");
        let itemsParam = searchParams.get("items");
        const promoCode = searchParams.get("promo");
        const name = searchParams.get("name");
        const singleItemId = searchParams.get("i");

        // Handle ultra-short link format: ?i=ITEM_ID
        if (singleItemId) {
           const { data: itemData, error: itemErr } = await supabase
              .from("menu_items")
              .select("shop_id, name")
              .eq("id", singleItemId)
              .single();
           if (!itemErr && itemData) {
              shopId = itemData.shop_id;
              itemsParam = `${singleItemId}:1`;
              if (!name) setBundleName(itemData.name);
           }
        }

        if (!shopId || !itemsParam) throw new Error("Invalid link — missing shop or items.");

        if (!singleItemId) setBundleName(name ? decodeURIComponent(name) : "Special Offer");

        // 1. Validate the shop exists and is online
        const { data: shop, error: shopErr } = await supabase
          .from("shops")
          .select("id, name, is_online")
          .eq("id", shopId)
          .single();

        if (shopErr || !shop) throw new Error("This shop could not be found.");
        if (!shop.is_online) throw new Error(`${shop.name} is currently offline.`);

        setShopName(shop.name);

        // 2. Parse items: "id1:2,id2:1"
        const parsedItems = itemsParam.split(",").map(chunk => {
          const [id, qty] = chunk.split(":");
          return { id: id.trim(), qty: parseInt(qty) || 1 };
        });

        const itemIds = parsedItems.map(i => i.id);

        // 3. Fetch product details
        const { data: products, error: prodErr } = await supabase
          .from("menu_items")
          .select("id, name, price, image_url, category")
          .in("id", itemIds)
          .eq("shop_id", shopId);

        if (prodErr) throw new Error("Could not load products.");

        // 4. Set QR session for this shop
        const sessionKey = "qrshop_session";
        const existingSession = JSON.parse(localStorage.getItem(sessionKey) || "{}");
        localStorage.setItem(sessionKey, JSON.stringify({
          ...existingSession,
          shopId,
          table: "Direct Link",
          expiresAt: Date.now() + 4 * 60 * 60 * 1000
        }));

        // 5. Seed the cart
        clearCart();
        const seeded = [];
        for (const parsed of parsedItems) {
          const product = products?.find(p => p.id === parsed.id);
          if (product) {
            for (let i = 0; i < parsed.qty; i++) addItem(product);
            seeded.push({ ...product, quantity: parsed.qty });
          }
        }

        // 6. Store promo code if provided
        if (promoCode) {
          localStorage.setItem("qr_promo_code", promoCode);
        }

        setLoadedItems(seeded);
        setStatus("ready");

      } catch (err) {
        console.error("AutoCart error:", err);
        setError(err.message || "Something went wrong loading this link.");
        setStatus("error");
      }
    }
    seedCart();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your offer...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Link Invalid</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link to="/" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-center text-white">
          <div className="text-4xl mb-2">🎁</div>
          <h1 className="text-xl font-black">{bundleName}</h1>
          <p className="text-indigo-200 text-sm mt-1">from {shopName}</p>
        </div>

        <div className="p-6">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Your cart has been loaded with:</p>
          <div className="space-y-2 mb-6">
            {loadedItems.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-gray-700">{item.quantity}× {item.name}</span>
                <span className="text-sm font-bold text-indigo-700">KSh {item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <Link
            to="/cart"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition text-center block text-base shadow-md shadow-indigo-200"
          >
            View Cart & Checkout →
          </Link>
          <Link to="/menu" className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3 block">
            Browse full menu instead
          </Link>
        </div>
      </div>
    </div>
  );
}
