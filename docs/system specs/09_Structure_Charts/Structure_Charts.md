# Structure Charts

## 1. Context Diagram (Level 0)

```mermaid
flowchart TD
    Customer([Customer])
    ShopOwner([Shop Owner])
    Admin([System Admin])
    WhatsApp([WhatsApp API / App])
    
    System{{"QR Onsite Ordering System"}}
    
    Customer -- "Scans QR, Views Menu, Places Order" --> System
    System -- "Redirects to WhatsApp with Payload" --> WhatsApp
    WhatsApp -- "Delivers Message" --> ShopOwner
    
    ShopOwner -- "Manages Menu, Generates QRs" --> System
    Admin -- "Manages Shops & Plans" --> System
```

## 2. Level 1 Data Flow Diagram (DFD)

```mermaid
flowchart LR
    Customer([Customer])
    Owner([Shop Owner])
    
    Sub1((1.0
QR Session
Management))
    Sub2((2.0
Cart & Order
Processing))
    Sub3((3.0
Menu
Management))
    
    DB[(Database)]
    
    Customer -->|URL Params| Sub1
    Sub1 -->|Valid Session| Sub2
    
    Customer -->|Selects Items| Sub2
    Sub2 -->|Reads Prices/Upsells| DB
    
    Owner -->|Creates/Edits| Sub3
    Sub3 -->|Writes Data| DB
```\n