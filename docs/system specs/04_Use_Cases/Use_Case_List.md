# Use Case Diagram and List

## 1. Use Case Diagram

```mermaid
usecaseDiagram
    actor Customer
    actor "Shop Owner" as Owner
    actor Admin

    package "QR Ordering System" {
        usecase "UC01: Scan QR & View Menu" as UC01
        usecase "UC02: Manage Cart & Checkout" as UC02
        usecase "UC03: Manage Menu Items" as UC03
        usecase "UC04: Generate QR Codes" as UC04
        usecase "UC05: Manage Subscriptions" as UC05
    }

    Customer --> UC01
    Customer --> UC02
    
    Owner --> UC03
    Owner --> UC04
    
    Admin --> UC05
```

## 2. Use Case List
- **UC01**: Scan QR & View Menu
- **UC02**: Manage Cart & Checkout
- **UC03**: Manage Menu Items
- **UC04**: Generate QR Codes
- **UC05**: Manage Subscriptions\n