# Modern Savannah — Scalable Rebuild: SAD Roadmap

> **Branch:** `v2/scalable-rebuild`  
> **Platform:** qRshop / Modern Savannah Commerce OS  
> **Objective:** Methodically redesign the platform into a scalable, maintainable, and professionally documented system.

---

## Progress Tracker

| Week | Deliverable | Status |
|------|-------------|--------|
| 2  | Methodology + Stakeholder List + Scope Boundaries | ⬜ Pending |
| 3  | Functional & Non-Functional Requirements + Acceptance Criteria | ⬜ Pending |
| 4  | Use Case Diagram + 1–2 Fully Dressed Use Cases | ⬜ Pending |
| 5  | As-Is and To-Be Process Models | ⬜ Pending |
| 6  | ERD / Domain Model + Data Dictionary | ⬜ Pending |
| 7  | Requirements Validation + Prioritization + Traceability Matrix *(Checkpoint)* | ⬜ Pending |
| 8  | Architecture Diagram + System Context Diagram | ⬜ Pending |
| 9  | UI Wireframes / Clickable Prototype + Usability Feedback Summary | ⬜ Pending |
| 10 | Structure Chart(s) + Interaction Design Artifacts for Key Use Cases | ⬜ Pending |
| 11 | CRUD Matrix + Logical Schema Draft (high-level) | ⬜ Pending |
| 12 | Test Plan Outline + Sample UAT Test Cases + Implementation / Changeover Plan | ⬜ Pending |
| 13 | Final SAD Documentation Portfolio + Group Presentation / Demo | ⬜ Pending |

---

## Week 2 — Methodology, Stakeholders & Scope

### Methodology
> *To be selected — e.g. Agile/Scrum, Waterfall, Unified Process, or Hybrid*

**Candidate:** Agile-Iterative with formal SAD artifacts (SADile)
- Iterative builds allow the live system to keep running on `main`
- Formal documentation produced at each sprint gate
- Code and documentation live side-by-side in this branch

---

### Stakeholder List

| Stakeholder | Role | Interest |
|-------------|------|----------|
| Platform Owner (you) | System Administrator | Owns the business logic, approves features, manages tenants |
| Shop Owners (e.g. Whitney / Kahakai6, Mama Rosy) | Primary Users | Manage products, orders, QR codes, staff |
| End Customers | Consumers | Browse menu, place orders, track delivery |
| Delivery Workers / Riders | Operations | Receive delivery tasks, update status |
| Delivery Manager | Operations Lead | Assign batches, monitor fleet, manage fees |
| Regional Agents | Governance | Onboard/verify shops, handle disputes in jurisdiction |
| Platform Suppliers | B2B Partners | List wholesale catalogs, receive bulk orders |
| Community Members | Social Users | Post in community feed, tag products, discover shops |
| Payment Gateway (M-Pesa/Daraja) | External System | Processes STK Push payments |
| WhatsApp API | External System | Delivers order confirmations and Auto-Dashboard messages |
| Supabase | Infrastructure | Auth, database, storage, edge functions |

---

### Scope Boundaries

#### IN SCOPE
- Multi-tenant shop management (products, orders, QR, payments)
- Customer-facing ordering flow (menu → cart → checkout → tracking)
- Admin panel (platform-level management of shops, suppliers, agents)
- Supplier/B2B wholesale portal
- Community social feed
- PWA / mobile-first delivery portal
- Analytics and reporting dashboards

#### OUT OF SCOPE (v2 Phase 1)
- Native iOS / Android apps
- Multi-currency (only KES / M-Pesa supported initially)
- Third-party logistics API integrations (manual rider assignment only)
- Custom white-label domain per shop (structural TBD)

---

## Week 3 — Requirements

> *To be completed Sprint 3*

### Functional Requirements
- [ ] FR-01: Shop owners can register and manage a product catalog
- [ ] FR-02: Customers can scan QR and place orders without an account
- [ ] FR-03: Orders flow through status states: Received → Preparing → Ready → Completed
- [ ] FR-04: M-Pesa STK Push triggers at checkout for paid-tier shops
- [ ] FR-05: Shop owners receive WhatsApp notifications for new orders
- [ ] FR-06: Admin can manage all shops, tier upgrades, and agent assignments
- [ ] *(more to be added)*

### Non-Functional Requirements
- [ ] NFR-01: Page load < 2s on 3G mobile connection
- [ ] NFR-02: System must handle 100 concurrent orders without degradation
- [ ] NFR-03: All customer PII protected by Row-Level Security (RLS)
- [ ] NFR-04: Platform uptime > 99.5%
- [ ] *(more to be added)*

### Acceptance Criteria
> *To be defined per requirement — format: Given / When / Then*

---

## Week 4 — Use Cases

> *To be completed Sprint 4*

- [ ] Use Case Diagram (actors + system boundary)
- [ ] Fully Dressed Use Case 1: Customer Places an Order
- [ ] Fully Dressed Use Case 2: Shop Owner Manages Their Menu

---

## Week 5 — Process Models

> *To be completed Sprint 5*

- [ ] As-Is Process: Current order flow (with known pain points annotated)
- [ ] To-Be Process: Redesigned flow with improvements

---

## Week 6 — ERD & Data Dictionary

> *To be completed Sprint 6*

- [ ] Entity-Relationship Diagram (all core entities)
- [ ] Data Dictionary (table-by-table, column-by-column)

**Core Entities (draft):** `shops`, `shop_users`, `menu_items`, `orders`, `order_items`, `qrs`, `campaigns`, `promotions`, `suppliers`, `wholesale_orders`, `logistics_hubs`, `community_posts`, `agents`

---

## Week 7 — Validation & Traceability *(Checkpoint)*

> *To be completed Sprint 7*

- [ ] Requirements validation (walkthrough / review)
- [ ] MoSCoW prioritization (Must / Should / Could / Won't)
- [ ] Traceability Matrix (FR → Use Case → Test Case)

---

## Week 8 — Architecture

> *To be completed Sprint 8*

- [ ] System Context Diagram (C4 Level 1)
- [ ] Architecture Diagram (C4 Level 2 — containers)

---

## Week 9 — UI/UX

> *To be completed Sprint 9*

- [ ] Wireframes for key screens (Menu, Checkout, Dashboard, Admin)
- [ ] Clickable prototype (Figma or in-browser)
- [ ] Usability feedback summary

---

## Week 10 — Interaction Design

> *To be completed Sprint 10*

- [ ] Structure chart(s) for key modules
- [ ] Interaction design artifacts (sequence diagrams for key use cases)

---

## Week 11 — CRUD Matrix & Logical Schema

> *To be completed Sprint 11*

- [ ] CRUD Matrix (Actor × Entity × Operation)
- [ ] Logical schema draft

---

## Week 12 — Testing & Changeover

> *To be completed Sprint 12*

- [ ] Test plan outline
- [ ] Sample UAT test cases
- [ ] Implementation & changeover plan (how `v2` merges into `main`)

---

## Week 13 — Final Portfolio & Demo

> *To be completed Sprint 13*

- [ ] Final SAD Documentation Portfolio compiled
- [ ] Group presentation / live demo prepared

---

*Document maintained in branch `v2/scalable-rebuild` — updated each sprint.*
