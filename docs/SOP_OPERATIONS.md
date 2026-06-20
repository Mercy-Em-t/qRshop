# Savannah Platform: Standard Operating Procedures (SOP)
**Phase: Global Scaling & Regional Agency Operations**

This document codifies the daily usage and management of the Savannah ecosystem to ensure maximum efficiency, trust, and profitability.

---

## 1. Merchant Onboarding & Tiering
The "Trust Layer" is maintained by Regional Agents. No shop enters the marketplace without a jurisdictional link.

### 1.1 The Verification Ladder
*   **Tier 0: Unverified**: New shops. **Escrow Payments Mandatory.** Restricted to 5 items.
*   **Tier 1: Bronze**: Basic inspection complete. 20 items allowed.
*   **Tier 2: Silver**: Verified physical location and identity. 100 items allowed.
*   **Tier 3: Gold**: High volume, 98% positive delivery record. **Eligible for Direct-to-Shop Payments.**

### 1.2 Onboarding Workflow
1.  Merchant registers via `/request-access`.
2.  System Admin assigns a **Regional Agent** based on the shop's location.
3.  Agent performs a physical or digital KYC (Know Your Customer).
4.  Agent "Promotes" the shop to Bronze status in the **Agent Hub**.

---

## 2. Hybrid Payment Routing (Money Flow)
We operate a hybrid model to balance merchant liquidity with consumer safety.

### 2.1 Escrow Mode (Default)
*   **Usage**: All Unverified, Bronze, and Silver merchants.
*   **Flow**: Customer pays Savannah M-Pesa Till -> Savannah holds funds -> Merchant dispatches -> Delivery confirmed -> Savannah pays Merchant (minus commission).
*   **Benefit**: 100% Protection for consumers.

### 2.2 Direct Mode (Performance Reward)
*   **Usage**: Gold-tier Merchants only.
*   **Flow**: Customer pays Merchant M-Pesa Till directly.
*   **Benefit**: Instant cash flow for the merchant; zero administrative burden for the platform.

---

## 3. Logistics & Hub Coordination
Efficiency in the "Last Mile" is the platform's core value proposition.

### 3.1 The Logistics Loop
1.  **Dispatch**: Shop marks order as `ready_for_pickup`.
2.  **Hub Entry**: Hub Manager assigns a Rider.
3.  **Batching**: Hub Manager groups 3-5 orders in the same direction to one Rider for fuel efficiency.
4.  **Security**: Rider uses the **Delivery Worker Console** to mark progress.
5.  **Proof**: "Order Completed" status triggers the Escrow release.

---

## 4. Dispute & Integrity Management
Agents are the "Judges" of the platform.

### 4.1 Reporting Protocol
*   If a customer reports a shop (via the Marketplace card), the **Regional Agent** receives an instant alert.
*   **Investigation**: Agent must call/visit the shop within 24 hours.
*   **Slashing**: If a scam is confirmed, the Agent drops the shop back to "Unverified" or "Deactivated" and blocks their Payouts.

---

## 5. Financial Reconciliation
Reconciliation happens **Weekly** (Mondays) to minimize M-Pesa B2C withdrawal fees.

1.  **Recon Report**: Generate the `shop_finances_view` for every merchant.
2.  **Deductions**: Deduct the Platform Commission (e.g., 2%) and Agent Commission (e.g., 1%).
3.  **Batch Payout**: Send one bulk M-Pesa disbursement to the merchant's registered phone.
