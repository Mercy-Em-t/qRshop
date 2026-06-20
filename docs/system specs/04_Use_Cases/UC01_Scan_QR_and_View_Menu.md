# UC01: Scan QR & View Menu

**Actor**: Customer
**Pre-condition**: Customer is physically present at the shop and has a smartphone.
**Post-condition**: Customer views the shop's digital menu.

**Main Flow**:
1. Customer scans the QR code on the table.
2. Device navigates to the `/enter` URL.
3. System validates the shop ID and table ID parameters.
4. System creates a QR session and stores it in `sessionStorage`.
5. System redirects the customer to the `/menu` page.
6. System loads and displays the menu items.

**Alternate Flow (Invalid QR)**:
1a. If the URL parameters are invalid or missing, the system redirects to an error page (`/invalid-qr`).\n