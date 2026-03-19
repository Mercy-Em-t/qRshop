import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/auth-service";

const CHAPTERS = [
  {
    id: "what-is",
    icon: "🌍",
    title: "What is ShopQR?",
    tagline: "The Smart Ordering Platform for Modern Kenyan Businesses",
    content: `ShopQR is a digital business tool that lets any shop, restaurant, café, or market stall accept orders from customers using just a QR code.

Think of it this way: instead of shouting across a busy restaurant floor or keeping a handwritten order pad, a customer simply points their phone camera at a small printed square on the table. In seconds, they are browsing the shop's menu, adding items to their cart, and placing an order — all from their own phone.

The shop owner, from their phone or laptop, sees the order arrive live, confirms it, and processes it. No app downloads needed. No special equipment. Just a printout and an internet connection.

ShopQR is designed specifically for the Kenyan business environment. It works on any phone browser, supports M-Pesa payments, and even operates when the internet is slow or spotty.`
  },
  {
    id: "customer-journey",
    icon: "🛒",
    title: "The Customer Experience",
    tagline: "From QR scan to order confirmation in under 2 minutes",
    content: `Here is what a customer goes through, step by step:

1. SCAN — The customer points their phone camera at the QR code sticker placed on their table, the counter, or even a physical poster. No app download needed.

2. BROWSE — They see the shop's digital menu instantly. Items can have photos, prices, and descriptions. The menu is grouped into categories (e.g., "Food", "Drinks", "Desserts").

3. ADD TO CART — They tap items to add them. They can change quantities or remove items just like shopping online.

4. CHOOSE HOW TO RECEIVE — The customer picks one of:
   • Dine In — order is brought to their table
   • Pickup — they'll collect it from the counter
   • Delivery — they type their delivery address and the delivery fee is shown

5. ENTER DETAILS — They type their name and phone number.

6. PAY — Depending on the shop's plan:
   • Free Shops: Customer is sent to WhatsApp to confirm the order manually.
   • Basic/Pro Shops: The system sends the order details to the shop and the customer can pay via M-Pesa directly.

7. TRACK — The customer sees a live tracking page showing the order's status: Received → Accepted → Preparing → Ready!`
  },
  {
    id: "shop-owner",
    icon: "🏪",
    title: "The Shop Owner Experience",
    tagline: "Your business in your pocket",
    content: `A shop owner registers on ShopQR once, sets up their menu, and gets a unique QR code they can print any time.

THE DASHBOARD
The owner logs in to a management dashboard where they can:
  • See all their orders arriving live (refreshes automatically every 5 seconds)
  • Click on any order to see every item, the customer name, and total amount due
  • Mark orders as Paid, Preparing, Ready, or Completed
  • View their entire sales history

THE MENU MANAGER
The owner can add, edit, or remove items from their menu at any time. Each item can have:
  • A name and description
  • A price
  • A product photo
  • A category
Changes are live instantly — no waiting, no developer needed.

DISCOUNT COUPONS
The owner can create smart discount codes. For example: "SAVE10" gives 10% off. They share this code by word of mouth, on social media, or on their printed materials.

CAMPAIGNS
The owner can run digital ad campaigns that display a full-screen banner to customers the moment they scan the QR code, before they even see the menu. This is perfect for promoting a special offer or a new product.

QR CODE BRANDING
The owner can generate branded QR codes — with the shop's name printed below the code — ready to download and print for tables, walls, or packaging.`
  },
  {
    id: "fulfillment",
    icon: "🚗",
    title: "Pickup, Delivery & Dine-In",
    tagline: "Flexible fulfillment for any business model",
    content: `ShopQR supports three different ways a customer can receive their order:

DINE IN
The customer scans the QR code right at their table. The order is linked to that specific table number. The staff know exactly where to bring the food or items without needing to ask.

PICKUP
The customer orders in advance or from a distance and comes to collect their order from the counter. No table needed. Great for takeaway shops, pharmacies, or hardware stores.

DELIVERY
The customer types in their delivery address and the shop charges a flat delivery fee that is automatically added to their total before they pay. This fee is set by the shop owner in their settings and can be changed any time.

The shop owner controls which options their shop offers. If a shop only does dine-in, they can turn off delivery completely.`
  },
  {
    id: "payments",
    icon: "💳",
    title: "Payments (M-Pesa & WhatsApp)",
    tagline: "Get paid the Kenyan way — fast, familiar, and reliable",
    content: `ShopQR is built around the two most dominant payment and communication tools in Kenya: M-Pesa and WhatsApp.

FREE PLAN — WHATSAPP ORDERING
When a customer places an order, the system automatically composes a beautifully formatted order message and opens WhatsApp, pre-filled with all the order details. The customer sends it to the shop. The shop owner replies to confirm and arranges payment at the counter or via MPESA send money.

BASIC / PRO / BUSINESS PLANS — AUTOMATED MPESA (STK PUSH)
For shops on a paid plan who have connected their M-Pesa credentials:
  • When a customer checks out, they enter their phone number
  • The system sends a payment prompt (pop-up) directly to their phone
  • The customer enters their M-Pesa PIN
  • The money moves instantly, and the order is automatically marked as Paid

HOW MPESA WORKS FOR SHOPQR
ShopQR operates as the single platform with ONE official Paybill/Till number. Individual shop owners do NOT need their own Daraja developer accounts. Instead:
  • All payments go through the ShopQR Paybill
  • The system records which shop the payment belongs to
  • The platform owner (you) can then transfer the shop's share of the money to them via M-Pesa B2C transfers or at the end of each month

This keeps things simple for shop owners and gives the platform control over transaction records.`
  },
  {
    id: "whatsapp-dashboard",
    icon: "💬",
    title: "WhatsApp as a Mini Order Dashboard (Pro & Business)",
    tagline: "Manage orders without opening a laptop",
    content: `This is one of the most powerful features on the Pro and Business plans.

THE PROBLEM IT SOLVES
Most small business owners do not sit at a computer all day. They are on the floor, at the counter, on a delivery run. They need to receive and manage orders from their phone.

HOW IT WORKS
When a customer places an order at a Pro/Business shop:
1. The customer's browser stays on the confirmation/tracking page — they do NOT need to send anything on WhatsApp.
2. Instead, the ShopQR platform AUTOMATICALLY sends a WhatsApp message to the shop owner's phone.
3. This message contains the full order receipt: customer name, items, total, and delivery details.
4. Below the receipt are two buttons:
   ✅ "Accept & Bill" — Clicking this confirms the order and can trigger the M-Pesa payment prompt to the customer.
   ❌ "Reject (Sold Out)" — Clicking this notifies the customer that some items aren't available.
5. The customer's tracking page updates in real time!

WHEN AN ORDER IS REJECTED
The customer sees a fresh "Review & Edit Cart" button on their tracking page. They can reopen their cart, remove unavailable items, and place a revised order. This creates a "child order" linked to the original — so the full order history is always preserved.`
  },
  {
    id: "tiers",
    icon: "📊",
    title: "Subscription Tiers — What Each Plan Includes",
    tagline: "Grow your features as your business grows",
    content: `ShopQR offers 4 subscription tiers:

──────────────────────
🆓 FREE TIER
──────────────────────
Perfect for first-time digital adopters.
  • Up to 20 products in the menu
  • QR code for 1 location/table
  • Basic WhatsApp ordering (customer sends order manually)
  • Order tracking page
  • No payment collection

──────────────────────
⭐ BASIC PLAN (Paid)
──────────────────────
For shops ready to grow.
  Everything in Free, plus:
  • Unlimited products
  • Multiple QR codes for different tables or locations
  • Structured WhatsApp order messages (fully formatted receipts)
  • Discount coupon codes
  • M-Pesa payment capability (if Daraja configured)

──────────────────────
🚀 PRO PLAN (Paid)
──────────────────────
For high-volume shops and restaurants.
  Everything in Basic, plus:
  • WhatsApp Auto-Dashboard (Automated order messages to the shop owner with Accept/Reject buttons)
  • Smart Order Revisions (shop owner can edit an order and request corrected payment)
  • Campaign Ad Banners (full-screen promotions shown when customers scan)
  • Advanced analytics

──────────────────────
💎 BUSINESS PLAN (Paid)
──────────────────────
For multi-location businesses, chains, and premium operators.
  Everything in Pro, plus:
  • Custom domain / branded shop profile page
  • Priority support
  • White-label options
  • Detailed cohort analytics`
  },
  {
    id: "qr-codes",
    icon: "📱",
    title: "QR Codes — The Heartbeat of the System",
    tagline: "One scan, infinite possibilities",
    content: `Every shop gets unique QR codes that act as the entry point for customers.

WHAT IS A QR CODE?
A QR code is a printed square pattern that a phone camera can read. It is like a shortcut link — scanning it instantly opens a specific webpage without typing any URL.

HOW SHOPQR USES THEM
Each QR code is linked to a specific shop AND a specific table or location. When a customer scans it:
  • The system knows which shop they are in
  • The system knows which table they are sitting at
  • The menu loads automatically — no sign-ins, no passwords

PHYSICAL PLACEMENT IDEAS
  • Laminated cards on restaurant tables
  • Stickers on shop counters or windows
  • Printed on product packaging
  • Shared as an image on social media (for online delivery requests)
  • Shown on a TV/monitor screen at the entrance

BRANDED QR CODES
Shop owners can download branded QR codes with their shop's name and domain printed below the code. This makes the code look professional and trustworthy.

ANALYTICS
The system tracks every QR scan — how many times, from which device, at what time. This tells the shop owner which tables get the most traffic or which campaigns drive the most scans.`
  },
  {
    id: "admin",
    icon: "⚙️",
    title: "Platform Administration (Your Role)",
    tagline: "You are the operator of the whole ecosystem",
    content: `As the ShopQR System Administrator, you have access to tools no shop owner can see:

SHOP MANAGEMENT
  • See all registered shops
  • Manually override any shop's subscription plan (upgrade or downgrade)
  • Enable or suspend shops
  • View each shop's onboarding/KYC status

PLAN MANAGEMENT
  • View and configure the tier structures

GLOBAL ORDER STREAM
  • Monitor all orders across ALL shops in real time
  • Useful for spotting unusual activity or system-wide issues

GLOBAL CATALOG
  • See all products listed by any shop
  • Check for policy violations or inappropriate content

LIVE OPERATIONS CONSOLE
  • View raw system event logs
  • Monitor data traffic and security alerts
  • Contains integration reminders (like the M-Pesa and WhatsApp setup guides)

PLATFORM ANALYTICS
  • Total platform revenue (GMV — Gross Merchandise Value)
  • Number of active shops
  • Order volume trends

SYSTEM REPORT
  • A comprehensive audit of the entire platform's technical architecture

YOUR TODO LIST
  • A step-by-step guide for every integration that still needs to be activated (M-Pesa, WhatsApp API, Subscription Cron)`
  }
];

export default function AdminBooklet() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [activeChapter, setActiveChapter] = useState("what-is");

  useEffect(() => {
    if (!user || user.role !== "system_admin") navigate("/login");
  }, [navigate]);

  const chapter = CHAPTERS.find(c => c.id === activeChapter);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/admin" className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">📖 ShopQR Features Booklet</h1>
            <p className="text-xs text-gray-400 mt-0.5">A complete guide to the platform — explained in plain language</p>
          </div>
          <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
            {CHAPTERS.length} Chapters
          </span>
        </div>
      </header>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-white border-r border-gray-100 hidden md:block sticky top-[65px] self-start h-[calc(100vh-65px)] overflow-y-auto">
          <nav className="p-4 space-y-1">
            {CHAPTERS.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChapter(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition flex items-center gap-2 ${
                  activeChapter === c.id
                    ? "bg-indigo-50 text-indigo-800 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 font-medium"
                }`}
              >
                <span className="text-base">{c.icon}</span>
                <span className="leading-snug">{c.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile chapter selector */}
        <div className="md:hidden w-full px-4 pt-4">
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white mb-4"
            value={activeChapter}
            onChange={e => setActiveChapter(e.target.value)}
          >
            {CHAPTERS.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.title}</option>
            ))}
          </select>
        </div>

        {/* Chapter Content */}
        <main className="flex-1 p-6 md:p-10 max-w-3xl">
          {chapter && (
            <div>
              <div className="mb-8">
                <div className="text-5xl mb-4">{chapter.icon}</div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">{chapter.title}</h2>
                <p className="text-indigo-600 font-semibold text-base italic">{chapter.tagline}</p>
              </div>
              <div className="prose prose-sm max-w-none">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
                    {chapter.content}
                  </pre>
                </div>
              </div>
              
              {/* Chapter navigation */}
              <div className="flex justify-between mt-8 gap-4">
                {CHAPTERS.findIndex(c => c.id === activeChapter) > 0 && (
                  <button
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition"
                    onClick={() => {
                      const idx = CHAPTERS.findIndex(c => c.id === activeChapter);
                      setActiveChapter(CHAPTERS[idx - 1].id);
                    }}
                  >
                    ← {CHAPTERS[CHAPTERS.findIndex(c => c.id === activeChapter) - 1].title}
                  </button>
                )}
                {CHAPTERS.findIndex(c => c.id === activeChapter) < CHAPTERS.length - 1 && (
                  <button
                    className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition ml-auto"
                    onClick={() => {
                      const idx = CHAPTERS.findIndex(c => c.id === activeChapter);
                      setActiveChapter(CHAPTERS[idx + 1].id);
                    }}
                  >
                    {CHAPTERS[CHAPTERS.findIndex(c => c.id === activeChapter) + 1].title} →
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
