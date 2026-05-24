const fs = require('fs');
const path = require('path');
const files = [
  'src/pages/AdminIndustries.jsx',
  'src/pages/AdminShops.jsx',
  'src/pages/MasterAdmin.jsx',
  'src/pages/DeveloperPortal.jsx',
  'src/pages/AdminUserGuide.jsx',
  'src/pages/AdminSuppliers.jsx',
  'src/pages/AdminTodo.jsx',
  'src/pages/AdminPlans.jsx',
  'src/pages/AdminReport.jsx',
  'src/pages/AdminSEO.jsx',
  'src/pages/AdminGlobalProducts.jsx',
  'src/pages/AdminPayouts.jsx',
  'src/pages/AdminMonitoring.jsx',
  'src/pages/AdminEngineering.jsx',
  'src/pages/AdminGlobalOrders.jsx',
  'src/pages/AdminGateway.jsx',
  'src/pages/AdminAnalytics.jsx',
  'src/pages/AdminBooklet.jsx',
  'src/pages/Admin.jsx'
];

files.forEach(f => {
  const p = path.join(process.cwd(), f);
  if(fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/user\.role !== "system_admin"/g, 'user.system_role !== "system_admin"');
    fs.writeFileSync(p, content);
    console.log('Fixed ' + f);
  }
});
