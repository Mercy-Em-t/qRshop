import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { resolveShopIdentifier } from "../services/shop-service";
import Footer from "../components/Footer";

export default function Returns() {
  const { shopId } = useParams();
  const [shopName, setShopName] = useState("The Modern Savannah");
  const [loading, setLoading] = useState(!!shopId);

  useEffect(() => {
    if (!shopId) return;

    async function loadShop() {
      try {
        const shop = await resolveShopIdentifier(shopId);
        if (shop) {
          setShopName(shop.name);
        }
      } catch (e) {
        console.error("Failed to load shop details for returns policy:", e);
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, [shopId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <nav className="border-b border-gray-100 bg-white px-4 h-16 flex items-center shadow-sm">
          <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
            <Link to={shopId ? `/s/${shopId}` : "/"} className="font-black text-xl text-green-700 italic">
              {shopName}
            </Link>
            <Link to={shopId ? `/s/${shopId}` : "/"} className="text-sm font-semibold text-gray-600 hover:text-green-700 transition">
              Back to Store
            </Link>
          </div>
        </nav>

        {/* Content Area */}
        <main className="max-w-3xl mx-auto px-6 py-16 my-8 bg-white border border-gray-100 rounded-2xl shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Retrieving policy details...</p>
            </div>
          ) : (
            <article className="prose prose-slate max-w-none">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                Returns & Refund Policy
              </h1>
              <p className="text-sm text-gray-400 mb-8">Last Updated: June 3, 2026</p>

              <div className="space-y-8 text-gray-600">
                <section>
                  <p className="text-lg leading-relaxed text-gray-700">
                    At <strong>{shopName}</strong>, customer satisfaction is our top priority. Please read our Return and Refund policy below to understand your rights and options regarding your purchases.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">1. Return Window</h3>
                  <p>
                    You have <strong>7 calendar days</strong> from the date of delivery to request a return or refund for eligible items. Items requested for return after this 7-day period are unfortunately not eligible.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">2. Return Conditions</h3>
                  <p className="mb-3">To be eligible for a return, your item must meet the following criteria:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>The item must be unused, unwashed, and in the same condition that you received it.</li>
                    <li>The item must be in its original, undamaged packaging.</li>
                    <li>Receipt or proof of purchase must be presented.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">3. Non-Returnable & Exempt Items</h3>
                  <p className="mb-3">Several types of goods are exempt from being returned due to safety, hygiene, or perishability:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Perishable goods (e.g., fresh groceries, organic produce, dairy, bakery items) unless damaged or spoiled upon arrival.</li>
                    <li>Opened seeds, organic inputs, or agricultural products.</li>
                    <li>Personal care items, health items, or hygiene-sensitive items.</li>
                    <li>Sale, clearance, or promotional items.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">4. Return Shipping & Fees</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Customer-initiated returns:</strong> If you are returning an item due to a change of mind, you will be responsible for paying your own shipping/courier costs for returning the item.
                    </li>
                    <li>
                      <strong>Defective or incorrect items:</strong> If you received a damaged, defective, or incorrect product, we will cover the return delivery costs or dispatch a replacement free of charge.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">5. Refund Processing</h3>
                  <p className="mb-3">
                    Once your return is received and inspected, we will contact you to notify you that we have received your returned item and whether the refund has been approved or rejected.
                  </p>
                  <p>
                    If approved, your refund will be processed immediately. Refund payments will be sent directly to your original payment method or via <strong>Mobile Money (M-Pesa)</strong> within 2–5 business days.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">6. How to Initiate a Return</h3>
                  <p>
                    To start a return or request a refund, please contact us directly on our WhatsApp business line listed on our shop profile, or reach out to platform support. Please include your Order ID, product details, and a photo of the item if it was received damaged.
                  </p>
                </section>
              </div>
            </article>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
