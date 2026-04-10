import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/auth-service";

const CHAPTERS = [
  {
    id: "what-is",
    icon: "🌍",
    title: "What is Modern Savannah?",
    tagline: "The Expansive Commerce OS for the African Savannah",
    content: `Modern Savannah is a digital business tool that lets any shop, restaurant, café, or market stall accept orders from customers natively and expansively.
    
Think of it this way: instead of shouting across a busy restaurant floor or keeping a handwritten order pad, a customer simply points their phone camera at a small printed square on the table. In seconds, they are browsing the shop's menu, adding items to their cart, and placing an order — all from their own phone.

The shop owner, from their phone or laptop, sees the order arrive live, confirms it, and processes it. No app downloads needed. No special equipment. Just a digital node and an internet connection.

Modern Savannah is designed specifically for the expansive African business environment. It works on any phone browser, supports M-Pesa payments, and even operates when the internet is slow or spotty.`
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
    content: `A shop owner registers on Modern Savannah once, sets up their menu, and gets a unique QR code they can print any time.

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
    content: `Modern Savannah supports three different ways a customer can receive their order:

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
    content: `Modern Savannah is built around the two most dominant payment and communication tools in Kenya: M-Pesa and WhatsApp.

FREE PLAN — WHATSAPP ORDERING
When a customer places an order, the system automatically composes a beautifully formatted order message and opens WhatsApp, pre-filled with all the order details. The customer sends it to the shop. The shop owner replies to confirm and arranges payment at the counter or via MPESA send money.

BASIC / PRO / BUSINESS PLANS — AUTOMATED MPESA (STK PUSH)
For shops on a paid plan who have connected their M-Pesa credentials:
  • When a customer checks out, they enter their phone number
  • The system sends a payment prompt (pop-up) directly to their phone
  • The customer enters their M-Pesa PIN
  • The money moves instantly, and the order is automatically marked as Paid

HOW MPESA WORKS FOR SHOPQR
Modern Savannah operates as the single platform with ONE official Paybill/Till number. Individual shop owners do NOT need their own Daraja developer accounts. Instead:
  • All payments go through the Modern Savannah Paybill
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
2. Instead, the Modern Savannah platform AUTOMATICALLY sends a WhatsApp message to the shop owner's phone.
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
    content: `Modern Savannah offers 4 subscription tiers:

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
    content: `As the Modern Savannah System Administrator, you have access to tools no shop owner can see:

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
  },
  {
    id: "ecosystem-launcher",
    icon: "🚀",
    title: "Chapter 10 — Ecosystem Launcher",
    tagline: "Create shops, communities and suppliers from one admin panel",
    content: `Added: March 25, 2026

The Ecosystem Launcher is a unified sidebar inside the Admin panel that lets you create three types of entities with a single form each. Previously, creating a shop required manual database work. Now it takes under a minute.

──────────────────────
🏪 LAUNCHING A SHOP
──────────────────────
Fill in the shop name, owner email, phone number, and industry type.
The system:
  1. Creates the shop record in the database
  2. Sends an email invite to the owner
  3. When the owner clicks the link, they set their own password
  4. They are guided through a one-time setup (tagline, address, first QR code)

The owner never sees a raw password — everything goes through official email invites.

──────────────────────
🏘️ CREATING A COMMUNITY
──────────────────────
Communities are interest groups that shops can join (e.g. "Nairobi Foodies", "Savannah Crafters").

When you create a community:
  • You give it a name and a short web-friendly slug (e.g. "nairobi-foodies")
  • Shops can then join it from their Settings panel
  • Community posts appear in the public social feed at /community

Only admins can create communities — this prevents spam groups from forming.

──────────────────────
🤝 ONBOARDING A SUPPLIER
──────────────────────
Suppliers are wholesale businesses that sell bulk products to shops on the platform.

Admin-launched suppliers are auto-verified (you're vouching for them).
Public applicants via /supplier-signup require you to manually verify them here.

Once verified, their catalog appears in the Supplier Hub available to all shop owners.`
  },
  {
    id: "supplier-portal",
    icon: "🏭",
    title: "Chapter 11 — Supplier Portal & B2B Orders",
    tagline: "Wholesale ordering built into the platform",
    content: `Added: March 25, 2026

Modern Savannah now supports Business-to-Business (B2B) commerce — meaning one shop can order products in bulk from a supplier who is also on the platform.

──────────────────────
FOR SUPPLIERS
──────────────────────
A supplier logs into their Supplier Portal (Dashboard → Wholesale Portal) where they can:
  • Create and manage their product catalog (with wholesale prices and minimum order quantities)
  • View all incoming bulk orders from shops
  • See order status (Pending → Confirmed → Shipped → Delivered)

New suppliers start as "Pending Verification". The Admin must approve them before their catalog is visible.

──────────────────────
FOR SHOP OWNERS (BUYERS)
──────────────────────
Shop owners visit their Supplier Hub (Dashboard → Supplier Hub) where they can:
  • Browse all verified supplier catalogs
  • Add items to a wholesale cart
  • Place a bulk order

PAYMENT OPTIONS
  • Pay via M-Pesa STK Push (supplier gets paid instantly)
  • Or place the order without payment (supplier will invoice separately)

──────────────────────
SECURITY NOTES
──────────────────────
  • Unauthenticated visitors can browse suppliers but CANNOT place orders
  • Supplier's private Daraja Passkey is collected AFTER admin vetting, never via the public signup form
  • All order records are protected by Row-Level Security — suppliers only see their own orders`
  },
  {
    id: "community-social",
    icon: "🏘️",
    title: "Chapter 12 — Community & Social Feed",
    tagline: "A social media layer that sells products",
    content: `Added: March 25, 2026

The Community Feed is a public social wall at /community — like a local Twitter/Instagram feed, but built specifically for commerce.

──────────────────────
HOW POSTING WORKS
──────────────────────
Anyone with a Community Profile can write a post. While writing, they can also search for and tag a product from any shop on the platform.

When a post is published:
  • The text content appears in the feed
  • If a product was tagged, its photo, name, and price appear as a card inside the post
  • Readers can tap the product card and go directly to that shop's ordering page

This creates organic product discovery — shop owners don't need to advertise. When customers post about their favourite items, they are automatically driving traffic.

──────────────────────
COMMUNITIES (CHANNELS)
──────────────────────
Posts are organized into communities. Think of these as hashtag channels:
  • "Nairobi Foodies" — restaurant and street food posts
  • "Savannah Crafters" — art, craft, and handmade goods
  • "Tech & Hobbies" — electronics, gadgets, and geek culture

Shops can join communities from their Settings page. This helps their products appear in the right community's feed.

──────────────────────
FOR ADMINS
──────────────────────
  • You control which communities exist (Ecosystem Launcher → Community tab)
  • Spam posts are identifiable by community — you can remove communities if abused
  • All posts require the author to have a verified Community Profile (linked to auth.users)`
  },
  {
    id: "marketing-promos",
    icon: "🎯",
    title: "Chapter 13 — Marketing Studio: Promo Bundles",
    tagline: "Build deals that sell themselves",
    content: `Added: March 25, 2026

Shop owners can now create promotions — special deals that automatically apply discounts when a customer's cart qualifies.

──────────────────────
TYPES OF PROMOTIONS
──────────────────────

PERCENTAGE DISCOUNT
"Get 15% off when you order any 2 items"
Best for: Encouraging larger orders

FLAT DISCOUNT
"Get KSh 100 off any order above KSh 500"
Best for: Rewarding loyal customers

BUNDLE PRICE
"Burger + Fries + Drink for just KSh 750" (instead of KSh 950 individually)
Best for: Set meals, combo packages

──────────────────────
COUPON CODES
──────────────────────
Each promo can have an optional coupon code (e.g. "LUNCH20").
If a code is set, the discount ONLY applies when the customer types the code at checkout.
If no code is set, the discount applies automatically when the cart qualifies.

──────────────────────
EXPIRY DATES
──────────────────────
Every promo can have a start date and an end date. After the end date passes, the promo deactivates automatically. No need to remember to turn it off.

──────────────────────
WHERE TO FIND IT
──────────────────────
Dashboard → Marketing Studio → "Promo Bundles" tab

Shop owners select which products belong to the promo, set the discount rules, and hit Save. The system handles the rest.`
  },
  {
    id: "modern-savannah",
    icon: "🌍",
    title: "Chapter 1 — What is Modern Savannah?",
    tagline: "Unpacking the Commerce OS for the African Savannah",
    content: `Modern Savannah is the world’s first "Decentralized Commerce OS."

Unlike traditional e-commerce platforms like Jumia or Shopify which are rigid and centralized, Modern Savannah is fluid. It is an expansive digital landscape designed to host thousands of individual "shop-nodes" that can be managed by local agents.

──────────────────────
1. THE OPERATING SYSTEM ANALOGY
──────────────────────
Think of Modern Savannah as the "Android" of commerce. You have created the core operating system, and each shop is like an "App" that runs on top of it. Some apps are restaurants, some are pharmacies, and others are digital freelancers.

──────────────────────
2. AFRICA TO THE WORLD
──────────────────────
Modern Savannah is rooted in the expansiveness of the African Savannah—boundless, adaptive, and native. It provides the technological infrastructure to digitize the physical marketplace, taking it from the ground to the cloud.

──────────────────────
3. DECENTRALIZED TRUST
──────────────────────
The platform doesn't need a massive headquarters. It uses a network of Regional Agents to enforce compliance, handle disputes, and verify merchants, ensuring a self-regulating ecosystem.`
  },
  {
    id: "marketplace-approval",
    icon: "✅",
    title: "Chapter 14 — Marketplace Approval & SEO",
    tagline: "You control what the world sees",
    content: `Added: March 25, 2026

The Discover page (/explore) is Modern Savannah's public marketplace — a directory of all shops on the platform. But not every new shop appears there automatically.

──────────────────────
THE APPROVAL FLOW
──────────────────────
When a new shop is created, its marketplace status is "Not Listed" by default.

As Admin, you can:
  1. Review the shop's profile (name, description, logo, industry)
  2. Edit or improve their description for better search engine visibility (SEO)
  3. Set the status to "Approved" — the shop immediately appears in the directory
  4. Or set it to "Rejected" — with a reason, so the shop owner can fix their profile and reapply

──────────────────────
WHY THIS MATTERS
──────────────────────
This gate protects the marketplace from:
  • Incomplete or empty shop profiles
  • Shops with inappropriate names or content
  • Duplicate or fake registrations

It also gives you the opportunity to polish how each shop appears to the public — making the directory look curated and high quality, not like a raw database dump.

──────────────────────
WHERE TO FIND IT
──────────────────────
Admin → Global Infrastructure → Shops tab → Marketplace Status column
Each shop has a status badge. Click to change it inline.`
  },
  {
    id: "last-mile-logistics",
    icon: "🚚",
    title: "Chapter 15 — Last-Mile Logistics (The Delivery Hub)",
    tagline: "Total control over the final stretch to the customer",
    content: `Added: March 27, 2026

Modern Savannah now features a complete logistics ecosystem, allowing you to manage deliveries without burdening individual shop owners.

──────────────────────
1. THE DELIVERY PORTAL
──────────────────────
A specialized entry point (/dashboard/delivery) for your logistics team. It is split into two roles:
  • Delivery Managers: Oversee the whole fleet, monitor financials, and create "Batches".
  • Delivery Workers: A mobile-first view for riders to see their assigned tasks, contact shops, and update delivery status.

──────────────────────
2. REGIONAL HUBS (NODES)
──────────────────────
As you scale, you can register "Logistics Hubs"—physical distribution points in different neighborhoods or cities.
  • Shops can "Dispatch" an order to a Hub.
  • The order is stored at the Hub (Node) until a rider is ready for the final leg.
  • This reduces individual rider trips and allows for localized distribution.

──────────────────────
3. ORDER BATCHING
──────────────────────
Managers can select multiple orders going in the same direction and group them into a "Batch". A rider then picks up the entire batch, drastically increasing efficiency and reducing cost per delivery.`
  },
  {
    id: "search-discovery",
    icon: "🔍",
    title: "Chapter 16 — Discovery Engine (Marketplace Search)",
    tagline: "Instant discovery across thousands of products",
    content: `Added: March 27, 2026

The platform now uses a professional-grade Search Engine to help customers find exactly what they need instantly.

──────────────────────
OS-LEVEL PERFORMANCE
──────────────────────
We've implemented Postgres Full-Text Search (FTS). Unlike a regular search that gets slower as you add more data, FTS uses "GIN Indexes" to find matches in tiny fractions of a second ($O(\log n)$ efficiency).

──────────────────────
FUZZY SEARCHING
──────────────────────
The search bar on the Home page doesn't just look for exact words. It understands:
  • Weighted Results: A match in a Product Title is more important than a match in the Description.
  • Plurals & Variants: Searching for "Burgers" will still find "Burger".

──────────────────────
MARKETPLACE TRAFFIC
──────────────────────
This search engine is the "Google" of your platform. It allows users to search across ALL approved shops simultaneously, creating a powerful marketplace experience where small shops get discovered by new customers every day.`
  },
  {
    id: "platform-economics",
    icon: "📊",
    title: "Chapter 17 — Platform Economics & Scalability",
    tagline: "How to manage costs while growing your business",
    content: `Added: March 27, 2026

Running a large-scale platform requires understanding your operational costs. Here is the strategy to keep Modern Savannah profitable.

──────────────────────
1. THE SUPABASE ENGINE
──────────────────────
• Up to 20 shops: You can likely stay on the Free Tier ($0/mo).
• 20–500 shops: You must upgrade to the Pro Tier ($25/mo). This gives you daily backups and higher data limits.
• Strategy: Your first 5 "Pro" shop subscriptions ($5/mo each) will pay for this entire platform overhead.

──────────────────────
2. WHATSAPP CONVERSATIONS
──────────────────────
WhatsApp charges per 24-hour window.
• User-Initiated (Service): Approx. KSh 1.50 per day per active user.
• Business-Initiated (Utility): Approx. KSh 4.00 per day.
• Strategy: We use "wa.me" (Free) for low-tier shops. We only use the official "Auto-Dashboard" (Accept/Reject buttons) for high-paying tiers (Business) who can easily afford the cost.

──────────────────────
3. M-PESA MARGINS
──────────────────────
• C2B (STK Push): When a customer pays a shop.
• B2C (Disbursements): When you pay the shop owner their share.
• Advice: Disburse funds weekly or monthly (not daily) to minimize transfer fees. Maintain a small platform commission (e.g., 2%) to ensure the system is "self-funding".

──────────────────────
SCALING TIP
──────────────────────
Keep the "Free" tier limited to 20 products. This encourages successful shops to upgrade to "Pro," which funds the infrastructure for the entire community.`
  },
  {
    id: "agency-ops",
    icon: "🛡️",
    title: "Chapter 18 — Agency Operations (Regional Governance)",
    tagline: "Offloading management to local experts",
    content: `Added: March 27, 2026

As you scale to 100+ shops, you cannot manage every merchant yourself. The Agency Model allows you to appoint "Regional Agents."

──────────────────────
1. JURISDICTIONAL POWER
──────────────────────
Each Agent is assigned a specific area (e.g., "Nairobi West"). They are responsible for:
  • Onboarding new shops in their territory.
  • Verifying that shops are real and legitimate.
  • Ensuring shops comply with platform standards.

──────────────────────
2. AGENT INCENTIVES
──────────────────────
Agents earn a "Commission Rate" (e.g., 10% of the platform fee). This turns them into local business partners who are motivated to grow the ecosystem in their area.

──────────────────────
3. COMPLIANCE ENFORCEMENT
──────────────────────
Agents have the power to "Promote" a shop (Bronze → Silver → Gold) or flag them for investigation if they fail to meet quality standards.`
  },
  {
    id: "trust-accountability",
    icon: "🤝",
    title: "Chapter 19 — Trust & Accountability (Public Integrity)",
    tagline: "Building a marketplace users can rely on",
    content: `Added: March 27, 2026

Since the platform doesn't "hold" the customer's money (direct-to-shop payments), trust is built through transparency and reporting.

──────────────────────
1. VERIFICATION BADGES
──────────────────────
The Marketplace displays badges on every shop card:
  • Gold: Fully vetted, long history of successful deliveries.
  • Silver: Active merchant with verified documents.
  • Bronze: New merchant in probation.
  • Unverified: High-risk, use caution.

──────────────────────
2. THE PEER-REPORTING PROTOCOL
──────────────────────
If a merchant doesn't deliver or scams a customer, the customer clicks the "Report" button on the shop card. 
  • The report is ROUTED directly to the jurisdictional agent.
  • The Agent investigates (calls the shop, checks logs).
  • If guilty, the Agent can suspend the shop instantly.

──────────────────────
3. ACCOUNTABILITY WITHOUT BURDEN
──────────────────────
This system enforces "Accountability" through peer pressure and local management, without you (the platform owner) having to manually mediate every small dispute.`
  },
  {
    id: "audit-accountability",
    icon: "🕵️",
    title: "Chapter 20 — Forensic Audit & Internal Controls",
    tagline: "Total transparency for every system change",
    content: `Added: March 27, 2026

When you have 50 agents managing 5,000 shops, you need to know WHO did WHAT and WHEN.

──────────────────────
1. THE AUDIT TRAIL
──────────────────────
The system now automatically logs critical actions:
  • Tier Promotion: When an agent moves a shop from Bronze to Gold.
  • Payment Mode Swap: When a merchant is granted "Direct-to-Shop" payments.
  • Dispute Resolution: Every investigation decision.

──────────────────────
2. INVESTIGATIVE POWER
──────────────────────
If a merchant complains they were unfairly downgraded, the System Admin can view the "Audit Log" to see which Agent made the change and read their reasoning.

──────────────────────
3. TAMPER-PROOFING
──────────────────────
Audit logs are "Insert-Only". They cannot be edited or deleted by Agents, ensuring a permanent forensic record of platform governance.`
  },
  {
    id: "industry-adaptation",
    icon: "🧬",
    title: "Chapter 21 — Industry Adaptation (Commerce OS)",
    tagline: "One platform, four specialized businesses",
    content: `Added: March 27, 2026

Modern Savannah is no longer just a "Menu" app. It is now a versatile Commerce OS that adapts its UI based on the shop's Industry Type.

──────────────────────
1. THE GASTRO MODE (Restaurants)
──────────────────────
• Key Feature: Table-Based Ordering.
• Workflow: Customers scan a "Table QR," order via the Kitchen Display, and choose "Dine-In" or "Takeaway."

──────────────────────
2. THE RETAIL MODE (Stores)
──────────────────────
• Key Feature: Shelf-Discovery.
• Workflow: Focuses on "In-Store Pickup" or "Home Delivery." Table numbers are hidden to keep the UI clean.

──────────────────────
3. THE SERVICE MODE (Salons/Clinics)
──────────────────────
• Key Feature: Session Booking.
• Workflow: Primarily handles "In-Person" appointments and service lists.

──────────────────────
4. THE DIGITAL MODE (Software/E-Books)
──────────────────────
• Key Feature: Instant Fulfillment.
• Workflow: Orders bypass logistics entirely; items are fulfilled via instant links or notification-based delivery.`
  },
  {
    id: "monetization-ads",
    icon: "💰",
    title: "Chapter 22 — Monetization & Ad Network",
    tagline: "Scalable revenue beyond subscriptions",
    content: `Added: March 27, 2026

The platform now features a Native Ad Network to help you monetize the public marketplace traffic.

──────────────────────
1. PLACEMENT TYPES
──────────────────────
• Header Banner: High-impact visibility at the top of the search directory.
• In-Feed Cards: Native-looking ads interspersed between shop listings.
• Sidebar/Spotlight: Featured brands in the discovery rail.

──────────────────────
2. DATA-DRIVEN REVENUE
──────────────────────
As you collect Customer Emails, you build a CRM that makes these ad placements more valuable to brands wanting to target specific demographics.

──────────────────────
3. MERCHANT PROMOTION
──────────────────────
• Merchants can pay a premium to have their shops "Boosted" to the top of the feed or featured in the header banner, creating a secondary revenue stream.`
  },
  {
    id: "regional-privacy",
    icon: "🗺️",
    title: "Chapter 23 — Regional Binding & Privacy Guard",
    tagline: "Local focus, global protection",
    content: `Added: March 27, 2026

Modern Savannah is built for "Regional Mastery." You can now bound shops to specific operational areas to ensure fulfillment is always realistic.

──────────────────────
1. THE REGIONAL BOUND
──────────────────────
• Operational Regions: Shops can be tagged with a specific city or neighborhood (e.g., "Kilimani" or "Nairobi").
• Delivery Geofencing: Customers are notified if they try to place a delivery order outside the shop's operational range, reducing wasted effort and refund friction.

──────────────────────
2. THE PRIVACY GUARD
──────────────────────
To prevent customer spamming and protect merchant integrity, sensitive data (like phone numbers) is masked in the Order Overview by default.
• Logic: Merchants see the customer's name and the masked number (e.g., "+254 ••• 123") until they need the full details for fulfillment.

──────────────────────
3. FRICTIONLESS CHECKOUT
──────────────────────
For "In-Store Pickup" or "Dine-In" orders, the platform automatically streamlines the identity form, making non-essential fields optional to ensure a high-velocity buying experience.`
  },
  {
    id: "logistics-mastery",
    icon: "🚚",
    title: "Chapter 24 — Logistics Master Control",
    tagline: "Centralized fees, regional visibility",
    content: `Added: March 27, 2026

The platform now features "Centralized Logistics Control," moving authority over delivery fees and visibility from individual shops to the Delivery Manager.

──────────────────────
1. THE REGION SELECTOR
──────────────────────
The Public Marketplace is now Region-Bound. Users select their region (e.g., Nairobi, Mombasa), and only shops native to that region are displayed.

──────────────────────
2. CENTRALIZED DELIVERY FEES
──────────────────────
The Delivery Manager sets "Flat Fees" per region in the System Settings. These are automatically "plugged" into the checkout flow based on the shop's location.`
  },
  {
    id: "order-handshake",
    icon: "🤝",
    title: "Chapter 25 — The Order Number Handshake",
    tagline: "Bridging System A and System B for a unified fulfillment experience",
    content: `Added: April 4, 2026

The "Order Number Handshake" is the most advanced synchronization protocol on the platform. It allows System A (the Storefront) to hand off an order to System B (the Master Gateway) and receive a unique, authoritative tracking number in return.

──────────────────────
1. THE INGESTION SYNC
──────────────────────
When a customer completes their order on System A, the system doesn't just wait. It immediately "pings" System B with the full order payload. This happens in the background via the OrderGatewaySDK.

──────────────────────
2. MASTER ID ASSIGNMENT
──────────────────────
System B receives the order, validates the payment status, and generates a Master Order Number (e.g. ORD-260404). This number is now the single source of truth for the entire fulfillment journey.

──────────────────────
3. THE FEEDBACK LOOP (WEBHOOK)
──────────────────────
Within milliseconds, System B sends a webhook back to System A's listener. This payload contains:
  • status: "paid" (This "unlocks" the order on the storefront side)
  • tracking_id: The Master Order Number generated by System B

──────────────────────
4. IDEMPOTENCY & SAFETY
──────────────────────
• Idempotency: If the same order is sent twice, System B recognizes the original ID and simply returns the existing Master ID instead of creating a duplicate.
• Payment Gatekeeping: System B verifies that the internal payment module has cleared the order before any Master ID is assigned, ensuring only valid, paid orders enter the pipeline.`
  },
  {
    id: "wholesale-identity",
    icon: "🔐",
    title: "Chapter 26 — Wholesale & Native Identity",
    tagline: "Unlocking persistent customer relationships and high-speed fulfillment",
    content: `Added: April 9, 2026

The platform has now evolved into a "Native-First" ecosystem. While guest checkout remains a core pillar for friction-free sales, recurring customers and wholesale partners now have a permanent home.

──────────────────────
1. OPTIONAL NATIVE REGISTRATION
──────────────────────
• Seamless Transition: Guest users are prompted in their /my-orders history page to "Join to Save History."
• One-Click Sync: Upon signing up, the system automatically triggers the "claim history" protocol, which reconciles all their previous local guest receipts with their new authenticated account.
• Cross-Device Access: Customers can now log in from any phone or laptop and see their full receipt history perfectly synced.

──────────────────────
2. THE SALES AGENT WIDGET (Wholesale Ops)
──────────────────────
• High-Velocity Checkout: Designed for wholesalers and merchants who need to process orders at physical counters.
• Assistant Logic: The "Sales Assistant" can find products, add them to carts, and immediately trigger the checkout flow via keyboard commands.
• Wholesale Catalog: Accessible via the Developer Portal, allowing agents to see journey maps and catalog health.

──────────────────────
3. PRODUCTION HARDENING (Resource Protection)
──────────────────────
• Anti-Scraping Shields: The product catalog is protected by Row-Level Security (RLS). While it remains public for legitimate customers, it restricts indiscriminate automated scraping by binding visibility to "Online" shops.
• Resource Draining Prevention: Database-level rate limiting and strict identity checks prevent bot-driven order flooding.
• Data Extraction: Authorized System Administrators can now export full order and user data as encrypted CSVs directly from the Master Admin Hub.`
  },
  {
    id: "production-hardening",
    icon: "🚧",
    title: "Chapter 27 — Production Hardening & Testing",
    tagline: "Building for 99.9% reliability and zero-trust security",
    content: `Added: April 10, 2026

Modern Savannah has now entered the "Production-Ready" phase. This means we have moved away from MVP (Minimum Viable Product) shortcuts and implemented industrial-grade guards.

──────────────────────
1. ZERO-TRUST SECURITY (Supabase Vault)
──────────────────────
• The Problem: In many apps, secrets like M-Pesa keys are stored in ".env" files. If a hacker gets access to the server logs, they can see your keys.
• The Solution: We use the Supabase Vault. Your M-Pesa Passkeys and WhatsApp Tokens are now encrypted inside the database. They are only "unlocked" during a transaction and are never visible in the frontend code.

──────────────────────
2. INTEGRATION TESTING (Playwright)
──────────────────────
• The Problem: As we add more features, we risk accidentally breaking the checkout or login pages.
• The Solution: We use Playwright—an automated browser that "acts" like a customer. It clicks buttons, types phone numbers, and checks if the payment prompt appears. This happens automatically before every update to ensure nothing is broken.

──────────────────────
3. TYPE SAFETY (TypeScript)
──────────────────────
• The Problem: JavaScript is flexible but can be "loose," leading to crashes when data looks different than expected (e.g., a missing price).
• The Solution: The platform core is now written in TypeScript. This forces the code to be mathematically correct. If a programmer tries to order 1.5 burgers (instead of a whole number), the code simply won't run, preventing data corruption at the source.

──────────────────────
4. DATABASE GOVERNANCE (Migrations)
──────────────────────
• The Problem: Changing the database structure manually can lead to "Configuration Drift" where your local test site looks different from the live production site.
• The Solution: Every database change is now a "Migration File." This allows us to "replay" the entire history of the database on a clean server in seconds, ensuring the production environment is always a perfect, stable mirror of our local tests.`
  },
  {
    id: "shop-homepages",
    icon: "🏠",
    title: "Chapter 28 — Personalized Shop Homepages",
    tagline: "Every shop gets its own digital storefront",
    content: `Added: April 10, 2026

Modern Savannah now supports beautiful, personalized homepages for every shop. This moves beyond just a simple menu list to a full "online website" experience for each merchant.

──────────────────────
1. THE DYNAMIC TEMPLATE
──────────────────────
• Automatic Branding: The homepage automatically adopts the shop's name, logo, and primary brand colors.
• High-Impact Hero Section: A professional hero section greets customers, featuring the shop's tagline and a direct "Start Ordering" button.
• Smart Sections: Includes "About Us," "Featured Items," and "Contact Details" that pull live data from the shop's profile.

──────────────────────
2. INDEPENDENT URLS
──────────────────────
• Every shop is accessible via a direct link (e.g., /shops/shop-id). 
• This link acts as the shop's official website, which they can share on social media or print on business cards.

──────────────────────
3. FLUID TRANSITIONS
──────────────────────
• When a customer is ready to buy, the homepage transitions them seamlessly into the ordering menu (/shops/shop-id/menu).
• All cart data is preserved across the transition, ensuring a frictionless shopping journey.`
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
            <h1 className="text-xl font-bold text-gray-800">📖 Modern Savannah Operating Manual</h1>
            <p className="text-xs text-gray-400 mt-0.5">The engine of the African digital economy — explained in plain language</p>
          </div>
          <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
            {CHAPTERS.length} Chapters
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full">
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
