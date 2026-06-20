# Requirements Elicitation Report

## 1. Methodology
To ensure the QR Onsite Ordering Platform meets the needs of its users, a synthesized elicitation approach was utilized, incorporating the following methodologies based on industry context:

- **Interviews**: Conducted (simulated) interviews with shop owners (like those of MamaRosy, Kahakai6, and AuraAndCo) to understand their operational bottlenecks.
- **Observation**: Analysis of traditional restaurant ordering workflows to identify friction points.
- **Customer Surveys**: Synthesized feedback from typical restaurant patrons regarding their preferences for digital menus vs. physical menus.

## 2. Stakeholder Analysis
- **Shop Owners**: Need a low-barrier entry to digital ordering. They are familiar with WhatsApp and prefer it over complex proprietary POS tablets.
- **Customers**: Demand speed, ease of use (no app downloads), and clear pricing/images.
- **Platform Admins**: Require a scalable architecture to manage hundreds of shops, billing, and system health.

## 3. Key Findings & Constraints
- **Constraint**: Shops often have unstable internet connections; the menu must load quickly and cache effectively.
- **Finding**: WhatsApp is universally adopted by the target shop owners, making it the ideal order reception mechanism.
- **Constraint**: Menu access must be restricted to onsite users to prevent spam orders. QR session validation is critical.\n