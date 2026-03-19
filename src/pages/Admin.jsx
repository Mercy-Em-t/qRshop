import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getCurrentUser, logout } from "../services/auth-service";

export default function Admin() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== "system_admin") {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          <button
             onClick={() => { logout(); navigate("/login"); }}
             className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
             Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/admin/shops"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              🏪 Shop Management
            </h2>
            <p className="text-gray-500 text-sm">
              View and manage all registered shops.
            </p>
          </Link>

          <Link
            to="/admin/plans"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              💳 Plan Management
            </h2>
            <p className="text-gray-500 text-sm">
              Configure subscription plans and features.
            </p>
          </Link>

          <Link
            to="/admin/seo"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-100 relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 bg-blue-500 w-16 h-16 rounded-bl-full opacity-10 group-hover:scale-110 transition-transform"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              🔍 Global SEO
            </h2>
            <p className="text-gray-500 text-sm">
              Manage JSON-LD structured data and Google listings for the platform and individual shops.
            </p>
          </Link>

          <Link
            to="/admin/report"
            className="bg-gray-900 rounded-xl shadow-sm p-6 hover:shadow-md transition-transform transform hover:-translate-y-1 relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 bg-green-500 w-16 h-16 rounded-bl-full opacity-20 group-hover:scale-110 transition-transform"></div>
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              📊 System Report <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">V3 Live</span>
            </h2>
            <p className="text-gray-400 text-sm">
              Live cohesion audit and overview of the platform architecture.
            </p>
          </Link>

          <Link
            to="/admin/engineering"
            className="bg-black border border-green-900/50 rounded-xl shadow-2xl shadow-green-900/10 p-6 hover:shadow-green-900/30 transition-shadow relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 bg-green-500 w-16 h-16 rounded-bl-full opacity-10 group-hover:scale-110 transition-transform"></div>
            <h2 className="text-lg font-black text-green-500 mb-2 font-mono uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              Engineering Compartment
            </h2>
            <p className="text-green-800/80 text-sm font-mono">
              God-mode simulation access and infrastructure tooling controls.
            </p>
          </Link>

          {/* NEW PHASE 29 VIEWS */}
          <Link
            to="/admin/global-orders"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              🌍 Global Order Stream
            </h2>
            <p className="text-gray-500 text-sm">
              Live read-heavy feed of all cross-tenant platform orders.
            </p>
          </Link>

          <Link
            to="/admin/global-products"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              📦 Global Catalog
            </h2>
            <p className="text-gray-500 text-sm">
              Monitor all listed tenant products for quality and compliance.
            </p>
          </Link>

          <Link
            to="/admin/monitoring"
            className="bg-gray-900 rounded-xl shadow-sm p-6 hover:shadow-md transition-transform transform hover:-translate-y-1 relative overflow-hidden group border border-gray-800"
          >
             <div className="absolute top-0 right-0 bg-red-500 w-16 h-16 rounded-bl-full opacity-20 group-hover:scale-110 transition-transform"></div>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span> Live Operations
            </h2>
            <p className="text-gray-400 text-sm">
              Live API sensors, system flags, and packet logs.
            </p>
          </Link>

          <Link
            to="/admin/analytics"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group border border-gray-200"
          >
             <div className="absolute top-0 right-0 bg-emerald-500 w-16 h-16 rounded-bl-full opacity-10 group-hover:scale-110 transition-transform"></div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              📈 Platform Analytics
            </h2>
            <p className="text-gray-500 text-sm">
              Aggregated platform GMV, shop counts, and financial readouts.
            </p>
          </Link>

          <a
            href="/system_architecture.md"
            download="V3_QR_System_Architecture.md"
            className="bg-indigo-50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-indigo-100"
          >
            <h2 className="text-lg font-semibold text-indigo-800 mb-2">
              📚 System Architecture
            </h2>
            <p className="text-indigo-600/80 text-sm">
              Download the official V3 Interaction Loop & Architecture Specs.
            </p>
          </a>

          <a
            href="/super_manager_guide.md"
            download="V3_Super_Manager_Guide.md"
            className="bg-purple-50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-purple-100"
          >
            <h2 className="text-lg font-semibold text-purple-800 mb-2">
              👑 Super Manager Guide
            </h2>
            <p className="text-purple-600/80 text-sm">
              Download documentation on System Admin roles, capabilities, and security.
            </p>
          </a>
          <Link
            to="/admin/payouts"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-green-100 relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 bg-green-500 w-16 h-16 rounded-bl-full opacity-10 group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-800">💰 Shop Payouts</h2>
            </div>
            <p className="text-gray-500 text-sm">
              Track outstanding balances, platform commissions, delivery fee splits, and mark shops as settled.
            </p>
          </Link>

          <Link
            to="/admin/booklet"
            className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-md p-6 hover:shadow-xl transition-transform transform hover:-translate-y-1 relative overflow-hidden group border border-indigo-500/30"
          >
             <div className="absolute top-0 right-0 bg-white w-20 h-20 rounded-bl-full opacity-5 group-hover:scale-110 transition-transform"></div>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              📖 Features Booklet
            </h2>
            <p className="text-indigo-200 text-sm">
              Plain-language guide to every ShopQR feature. Perfect for explaining the platform to business owners.
            </p>
          </Link>

          <Link
            to="/admin/todo"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-yellow-200 relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 bg-yellow-400 w-16 h-16 rounded-bl-full opacity-10 group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-800">📋 System TODO</h2>
              <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-bold">3 Pending</span>
            </div>
            <p className="text-gray-500 text-sm">
              Step-by-step integration checklists for M-Pesa, WhatsApp API, and Subscription management.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
