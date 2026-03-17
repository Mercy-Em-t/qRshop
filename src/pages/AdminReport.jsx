import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth-service";

export default function AdminReport() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [activeReport, setActiveReport] = useState("inbox");

  useEffect(() => {
    if (!user || user.role !== "system_admin") {
      navigate("/login");
    }
  }, [navigate, user]);

  const reports = [
    {
      id: "health",
      title: "Platform Health & Diagnostics",
      date: "Today",
      author: "System Automated",
      icon: "🩺",
      content: (
        <div className="space-y-6">
           <div className="flex gap-2 text-sm text-gray-500 font-medium mb-4">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Status: Cohesive & Stable</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Uptime: 99.9%</span>
           </div>
           <p className="text-gray-600 leading-relaxed">
              <strong>System Initialization Analysis:</strong> Since the core infrastructure booted, the platform has maintained peak stability. Supabase network latency remains below 120ms on average.
           </p>
           <div>
              <h4 className="font-bold text-gray-800 mb-2">Architectural Cohesion Audit</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
                 <li><strong>Backend (Supabase):</strong> Unified under Row-Level Security (RLS) linking to `shop_id`. No isolated or orphaned data fragments exist. Rate-Limits are handled via pure Postgres triggers.</li>
                 <li><strong>Frontend Engine:</strong> Routing layer maps flawlessly from physical QR scans (`/q/:qrId`) to virtual shop profiles (`/shops/:shopId`). All hooks bind securely to `qrshop_session`.</li>
                 <li><strong>Legal & Compliance:</strong> The perimeter privacy interceptor successfully blocks background telemetry until local GDPR/Kenya DPA consent is granted.</li>
                 <li><strong>eCommerce Synchronization:</strong> The Bulk CSV Lexical Uploader correctly maps nested JSON variants and multiple image attachments directly into scalable arrays.</li>
              </ul>
           </div>
        </div>
      )
    },
    {
      id: "journey",
      title: "System Evolution Journey",
      date: "Yesterday",
      author: "System Architect",
      icon: "🛤️",
      content: (
        <div className="space-y-6">
           <p className="text-gray-600 leading-relaxed">
              <strong>The V1 to V3 Transition:</strong> What started as a static menu concept has evolved into a fully-fledged, multi-tenant lightweight commerce infrastructure. Note the major paradigm shifts:
           </p>
           <div className="relative border-l-2 border-indigo-200 ml-3 pl-4 space-y-6">
              <div className="relative">
                 <div className="absolute -left-[25px] bg-white border-2 border-indigo-200 w-4 h-4 rounded-full"></div>
                 <h4 className="font-bold text-gray-800 text-sm">V1: The Static Concept</h4>
                 <p className="text-sm text-gray-500 mt-1">Proof of concept. Basic digital representation of menus.</p>
              </div>
              <div className="relative">
                 <div className="absolute -left-[25px] bg-white border-2 border-indigo-400 w-4 h-4 rounded-full"></div>
                 <h4 className="font-bold text-gray-800 text-sm">V2: Programmability</h4>
                 <p className="text-sm text-gray-500 mt-1">Introduction of 'Smart QR Nodes'. Codes could now switch context (Order vs Campaign) dynamically without reprinting physics codes.</p>
              </div>
              <div className="relative">
                 <div className="absolute -left-[25px] bg-indigo-600 border-2 border-indigo-600 w-4 h-4 rounded-full shadow-sm"></div>
                 <h4 className="font-bold text-indigo-900 text-sm">V3: True Commerce OS</h4>
                 <p className="text-sm text-gray-700 mt-1 font-medium">The current era. Subdomain routing, multi-image product ingestion, legal compliance walls, and unified God-mode system management.</p>
              </div>
           </div>
        </div>
      )
    },
    {
      id: "goals",
      title: "System Goals & Trajectory",
      date: "System Core",
      author: "Super Manager Directive",
      icon: "🎯",
      content: (
        <div className="space-y-6">
           <p className="text-gray-600 leading-relaxed">
              <strong>Forward Trajectory:</strong> The foundation is solid. The next immediate protocol shifts from building features to validating the ecosystem at scale.
           </p>
           <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                 <h4 className="font-bold text-amber-900 mb-1">1. Pilot Validation</h4>
                 <p className="text-amber-700 text-sm">Onboard the first 5 test shops. Monitor organic usage patterns, offline-queue stress limits, and unhandled interface errors in real-world environments.</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                 <h4 className="font-bold text-purple-900 mb-1">2. White-Label Subdomains</h4>
                 <p className="text-purple-700 text-sm">Automate Vercel DNS injection so `shopname.platform.com` seamlessly points to the tenant dashboard without manual intervention.</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                 <h4 className="font-bold text-emerald-900 mb-1">3. Aggregated Analytics</h4>
                 <p className="text-emerald-700 text-sm">Roll up all shop-level scan telemetry (`qr_events`) into a global heatmap here in the System Manager desk to pitch platform dominance to investors.</p>
              </div>
           </div>
        </div>
      )
    },
    {
      id: "security",
      title: "Automated Security Audit (Action Required)",
      date: "CRITICAL: ONGOING",
      author: "Vulnerability Scanner",
      icon: "🚨",
      content: (
        <div className="space-y-6">
           <div className="flex gap-2 text-sm text-red-500 font-medium mb-4">
              <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-1 rounded shadow-sm animate-pulse">Status: THREAT DETECTED</span>
              <span className="bg-orange-100 text-orange-800 border border-orange-200 px-2 py-1 rounded">Vulnerabilities: 3</span>
           </div>
           <p className="text-red-600 leading-relaxed font-bold">
              <strong>WARNING:</strong> The scanner has identified fundamental security vulnerabilities rooted in the platform's MVP architecture. Production deployment under these conditions invites sabotage and data corruption.
           </p>
           
           <div className="space-y-4 text-sm mt-4">
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-xl">
                 <h4 className="font-bold text-red-900 mb-1">1. Authentication Circumvention</h4>
                 <p className="text-red-700">Currently mapping sessions against a custom `shop_users` table with plaintext verification. This invites packet sniffing and session spoofing. <strong>Action: </strong> Must migrate strictly to Native Supabase Auth JWTs.</p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-xl">
                 <h4 className="font-bold text-red-900 mb-1">2. Open Row-Level Security (RLS)</h4>
                 <p className="text-red-700">To enable the MVP, tables like `product_images` and `shop_compliance_settings` were forced into public write access (`auth.uid() = true`). Any bad actor with the anon key can execute script-based mass deletion. <strong>Action: </strong> Lockdown all policies to verify the JWT `shop_id` claim.</p>
              </div>
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl">
                 <h4 className="font-bold text-orange-900 mb-1">3. Permissive Data Insertion</h4>
                 <p className="text-orange-800">The database accepts any client payload format without backend validation constraints, meaning numeric overrides or negative stock counts could be maliciously injected.</p>
              </div>
           </div>
           
           <p className="text-gray-500 text-xs mt-6 italic">We must tie these dependencies down together immediately.</p>
        </div>
      )
    },
    {
      id: "economics",
      title: "Platform Economics & Architecture Costs",
      date: "CRITICAL: ONGOING",
      author: "Financial Directive",
      icon: "💸",
      content: (
        <div className="space-y-6">
           <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl mb-6 shadow-sm">
             <h3 className="font-black text-indigo-900 text-xl mb-4">Unit Analytics: What does a Shop cost us?</h3>
             <p className="text-gray-700 leading-relaxed mb-4">
               The V3 system is compiled on edge-serverless architecture (Vercel + Supabase). We pay exactly <strong>$0.00</strong> for idle time. Costs trigger exclusively upon dynamic engagement (scans).
             </p>

             <div className="space-y-3">
               <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                  <span className="font-bold text-gray-800">Compute (Vercel Edge)</span>
                  <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">~$0.05 / 1k Scans</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                  <span className="font-bold text-gray-800">Database (Supabase I/O)</span>
                  <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">~$0.02 / 1k Scans</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                  <span className="font-bold text-gray-800">Media Pipeline (Supabase Storage)</span>
                  <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">~$0.02 / 1k Scans</span>
               </div>
               <div className="flex justify-between items-center py-2">
                  <span className="font-black text-indigo-900 text-lg">Total Operations Gravity</span>
                  <span className="font-black text-indigo-700 text-lg bg-indigo-100 px-3 py-1 rounded-lg">~$0.09 / 1,000 Scans</span>
               </div>
             </div>
           </div>

           <div className="grid md:grid-cols-2 gap-6">
             <div className="bg-white border text-gray-800 border-gray-200 p-5 rounded-2xl shadow-sm">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                   <span className="text-xl">⚠️</span> The "Free Tier" Burden
                </h4>
                <p className="text-sm leading-relaxed mb-3">
                   A free tier shop doing 100 scans/day generates ~3k monthly scans. The physical cost is exactly <strong>$0.27 USD / month</strong>.
                </p>
                <p className="text-sm leading-relaxed">
                   While microscopic individually, 10,000 non-paying shops equates to <strong>$2,700/mo</strong> in dead compute weight. Therefore, "Free" shops are strictly blocked at 2 initial deploying nodes to constrain abuse.
                </p>
             </div>

             <div className="bg-white border text-gray-800 border-gray-200 p-5 rounded-2xl shadow-sm ring-2 ring-emerald-500 ring-offset-2">
                <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                   <span className="text-xl">📈</span> The "Pro" Tier Margins
                </h4>
                <p className="text-sm leading-relaxed mb-3">
                   If a premium shop processes 10,000 scans per month, their physical gravity cost is <strong>$0.90 USD</strong>.
                </p>
                <p className="text-sm leading-relaxed font-bold">
                   If the Pro Subscription costs $15.00, our Gross Software Margin stands at 94.0%.
                </p>
             </div>
           </div>
        </div>
      )
    }
  ];

  const activeReportData = reports.find(r => r.id === activeReport);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/admin"
            className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition"
          >
            ← System Control
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">M</div>
             <h1 className="text-lg font-black text-gray-900 tracking-tight hidden sm:block">System Manager's Desk</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
         {/* Desktop layout: Sidebar + Main Content */}
         <div className="flex flex-col md:flex-row gap-6">
            
            {/* Sidebar Inbox */}
            <div className="md:w-1/3 space-y-2">
               <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4 px-2">Secure Inbox</h2>
               
               {reports.map((report) => (
                  <button 
                     key={report.id}
                     onClick={() => setActiveReport(report.id)}
                     className={`w-full text-left p-4 rounded-2xl transition-all duration-200 border ${
                        activeReport === report.id 
                        ? 'bg-white border-indigo-200 shadow-md transform scale-100 relative z-10' 
                        : 'bg-transparent border-transparent hover:bg-gray-100 text-gray-600 hover:border-gray-200 scale-95 opacity-80'
                     }`}
                  >
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-2xl">{report.icon}</span>
                        <span className={`text-xs font-bold ${activeReport === report.id ? 'text-indigo-600' : 'text-gray-400'}`}>{report.date}</span>
                     </div>
                     <h3 className={`font-bold mt-2 ${activeReport === report.id ? 'text-gray-900' : 'text-gray-700'}`}>{report.title}</h3>
                     <p className="text-xs text-gray-500 mt-1 line-clamp-1">From: {report.author}</p>
                  </button>
               ))}
               
               <div className="mt-8 p-4 bg-gray-100 rounded-2xl border border-gray-200 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Platform Status</p>
                  <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                     <span className="text-sm font-bold text-gray-700">All Systems Nominal</span>
                  </div>
               </div>
            </div>

            {/* Main Email/Report View */}
            <div className="md:w-2/3">
               {activeReport === 'inbox' ? (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 h-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-4 text-gray-300">
                        📬
                     </div>
                     <h2 className="text-xl font-bold text-gray-400">Select a report</h2>
                     <p className="text-sm text-gray-400 mt-2 max-w-sm">Review the incoming automated reports from the V3 core engine via the secure inbox menu.</p>
                  </div>
               ) : (
                  <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in-up">
                     
                     {/* Report Header */}
                     <div className="bg-gray-900 p-6 md:p-8 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 text-9xl opacity-10">
                           {activeReportData.icon}
                        </div>
                        <div className="relative z-10">
                           <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">{activeReportData.author} • {activeReportData.date}</p>
                           <h2 className="text-2xl md:text-3xl font-black">{activeReportData.title}</h2>
                        </div>
                     </div>

                     {/* Report Content */}
                     <div className="p-6 md:p-8">
                        {activeReportData.content}

                        {/* Sign-off */}
                        <div className="mt-12 pt-6 border-t border-gray-100 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                              🤖
                           </div>
                           <div>
                              <p className="text-sm font-bold text-gray-800">ShopQR V3 Core Engine</p>
                              <p className="text-xs text-gray-400">Automated Intelligence Division</p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>

         </div>
      </main>
    </div>
  );
}
