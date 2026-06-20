const fs = require('fs');
const file = 'src/pages/OrderManager.jsx';
let code = fs.readFileSync(file, 'utf8');

// The replacement
code = code.replace(/onClick=\{\(\) => handleMpesaPush\(order\)\}/g, 'disabled={true}\n                              title="M-Pesa integration pending"');
code = code.replace(/📲 Push M-Pesa PIN/g, '📲 Push M-Pesa PIN (Soon)');

fs.writeFileSync(file, code);
console.log("Done");
