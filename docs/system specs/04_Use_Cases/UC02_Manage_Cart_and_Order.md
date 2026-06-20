# UC02: Manage Cart & Checkout

**Actor**: Customer
**Pre-condition**: Customer is on the `/menu` page with a valid session.
**Post-condition**: Order is sent via WhatsApp.

**Main Flow**:
1. Customer browses the menu and taps "Add to Cart" on an item.
2. System updates the cart state.
3. System checks for upsell items.
4. System displays an upsell prompt (e.g., "Would you like Fries with that?").
5. Customer accepts or declines the upsell.
6. Customer navigates to the Cart and proceeds to Checkout.
7. System generates an order summary and a formatted WhatsApp message.
8. System redirects the customer to WhatsApp via a deep link.
9. Customer sends the message to the shop.\n