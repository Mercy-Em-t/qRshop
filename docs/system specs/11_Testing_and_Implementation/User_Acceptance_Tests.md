# Sample User Acceptance Tests (UAT)

## UAT-001: Scan QR and Access Menu
**Description**: Verify a customer can scan a valid QR code and see the menu.
**Steps**:
1. Scan the test QR code for Shop 1, Table 5.
2. Observe redirection to `/menu`.
**Expected Result**: The menu page loads within 2 seconds, displaying items for Shop 1.

## UAT-002: Add Items and Generate WhatsApp Order
**Description**: Verify a customer can build an order and send it.
**Steps**:
1. Tap "Add" on a Burger.
2. Accept the Fries upsell prompt.
3. Open Cart and tap "Checkout".
**Expected Result**: The device opens WhatsApp with a pre-filled message indicating "Shop 1, Table 5, 1x Burger, 1x Fries".

## UAT-003: Shop Owner Adds Menu Item
**Description**: Verify shop owner can update the menu.
**Steps**:
1. Log into Dashboard.
2. Navigate to Menu Manager -> Add Item.
3. Enter "Soda", price "2.00", category "Drinks". Save.
**Expected Result**: Item appears in the dashboard list. When reloading the customer `/menu` page, the new item is visible.\n