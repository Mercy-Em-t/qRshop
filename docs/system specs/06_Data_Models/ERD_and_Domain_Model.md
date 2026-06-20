# Entity Relationship Diagram and Domain Model

## 1. Domain Model Overview
The core domain revolves around **Shops**, which have physical **Tables** and offer **Menu_Items**. Customers create **Orders** containing **Order_Items**. The system tracks access via **QR_Sessions** and manages relationships like **Upsell_Items**.

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    SHOPS ||--o{ TABLES : "has"
    SHOPS ||--o{ MENU_ITEMS : "offers"
    SHOPS ||--o{ ORDERS : "receives"
    SHOPS ||--o{ QR_SESSIONS : "validates"
    SHOPS ||--o| SUBSCRIPTIONS : "has"
    
    TABLES ||--o{ ORDERS : "places"
    
    MENU_ITEMS ||--o{ ORDER_ITEMS : "included in"
    MENU_ITEMS ||--o{ UPSELL_ITEMS : "has suggested"
    
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    
    DEVICES ||--o{ SESSIONS : "initiates"
    SESSIONS ||--o{ VISITS : "tracks"
    
    QRS ||--o{ VISITS : "scanned in"
    QRS ||--o{ DEPLOYMENTS : "installed at"
```\n