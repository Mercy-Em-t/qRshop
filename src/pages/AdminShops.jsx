import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

export default function AdminShops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newShopName, setNewShopName] = useState("");
  const [newShopPhone, setNewShopPhone] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const user = getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== "system_admin") {
      navigate("/login");
      return;
    }
    fetchShops();
  }, [user, navigate]);

  const fetchShops = async () => {
    setLoading(true);
    // Fetch all shops and their owner credentials
    const { data: shopsData, error: shopsErr } = await supabase
      .from("shops")
      .select(`
        *,
        shop_users (email, role)
      `)
      .order("created_at", { ascending: false });

    if (!shopsErr && shopsData) {
      setShops(shopsData);
    }
    setLoading(false);
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // 1. Create the physical Shop space
      const { data: newShop, error: shopErr } = await supabase
        .from("shops")
        .insert([{ name: newShopName, phone: newShopPhone, plan: "free" }])
        .select()
        .single();
      
      if (shopErr) throw shopErr;

      // 2. Create the associated Admin User for that Shop space
      // Auto-generate a secure random 8-character password
      const genPassword = Math.random().toString(36).substring(2, 10);

      const { error: userErr } = await supabase
        .from("shop_users")
        .insert([{
           email: newAdminEmail,
           password: genPassword,
           role: "shop_owner",
           shop_id: newShop.id
        }]);
      
      if (userErr) throw userErr;

      setNewShopName("");
      setNewShopPhone("");
      setNewAdminEmail("");
      
      alert(`✅ Success! Parallel Shop Space Deployed.\n\nShop Owner Platform Credentials:\nEmail: ${newAdminEmail}\nPassword: ${genPassword}\n\nPlease copy and email this password securely to the user.`);
      fetchShops();
    } catch (err) {
      alert("Deployment failed. Have you run the Multi-Tenant SQL Migration script? Error: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/admin"
            className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
          >
            ← System Admin
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Global Infrastructure</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[3fr_2fr] gap-8">
        
        {/* Network Operations Center */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Active Shop Ecosystem</h2>
          
          {loading ? (
             <p className="text-gray-500 py-4">Polling regional nodes...</p>
          ) : shops.length === 0 ? (
             <p className="text-gray-500 py-4">No parallel shop spaces active.</p>
          ) : (
             <div className="space-y-4">
               {shops.map((shop) => (
                 <div key={shop.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="text-lg font-bold text-gray-900">{shop.name}</h3>
                         <span className="font-mono text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">{shop.id}</span>
                      </div>
                      <span className="bg-green-100 text-green-800 font-bold px-2 py-1 rounded-full text-xs uppercase uppercase">
                         {shop.plan} Plan
                      </span>
                   </div>
                   
                   <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <span>📞 {shop.phone || "No phone"}</span>
                   </div>

                   <div className="bg-gray-50 rounded-lg p-3 text-sm mt-2 border border-blue-50">
                      <p className="font-bold text-gray-800 mb-1">Administrative Seats:</p>
                      {shop.shop_users?.map((su, idx) => (
                         <div key={idx} className="flex items-center justify-between text-gray-600">
                           <span>{su.email}</span>
                           <span className="bg-blue-100 text-blue-800 font-semibold px-2 rounded-full text-[10px] uppercase">
                             {su.role}
                           </span>
                         </div>
                      ))}
                      {(!shop.shop_users || shop.shop_users.length === 0) && (
                         <span className="text-red-500">Unclaimed / No login bound</span>
                      )}
                   </div>
                 </div>
               ))}
             </div>
          )}
        </section>

        {/* Space Launcher */}
        <section>
           <div className="bg-indigo-600 text-white rounded-xl shadow-lg p-6 sticky top-24">
             <h2 className="text-xl font-bold mb-2">Launch Sandbox</h2>
             <p className="text-indigo-200 text-sm mb-6">Instantly provision and boot a completely isolated, scalable backend environment for a new client.</p>

             <form onSubmit={handleCreateShop} className="space-y-4">
               <div>
                  <label className="block text-sm font-semibold mb-1 text-indigo-100">Shop Entity Name</label>
                  <input
                    required
                    type="text"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    placeholder="e.g. The Rustic Burger"
                    className="w-full bg-indigo-700/50 border border-indigo-400 rounded-lg px-3 py-2 text-white placeholder-indigo-300 outline-none focus:ring-2 focus:ring-white transition"
                  />
               </div>
               <div>
                  <label className="block text-sm font-semibold mb-1 text-indigo-100">Contact Gateway (Phone)</label>
                  <input
                    required
                    type="tel"
                    value={newShopPhone}
                    onChange={(e) => setNewShopPhone(e.target.value)}
                    placeholder="e.g. 254700000000"
                    className="w-full bg-indigo-700/50 border border-indigo-400 rounded-lg px-3 py-2 text-white placeholder-indigo-300 outline-none focus:ring-2 focus:ring-white transition"
                  />
               </div>
               <div className="border-t border-indigo-400/50 my-2 pt-4">
                  <label className="block text-sm font-semibold mb-1 text-indigo-100">Owner Login Email</label>
                  <input
                    required
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="owner@rustic.com"
                    className="w-full bg-indigo-700/50 border border-indigo-400 rounded-lg px-3 py-2 text-white placeholder-indigo-300 outline-none focus:ring-2 focus:ring-white transition"
                  />
               </div>
               
               <button
                 type="submit"
                 disabled={isCreating}
                 className="w-full mt-2 bg-white text-indigo-800 font-bold py-3 rounded-lg hover:bg-indigo-50 transition cursor-pointer disabled:opacity-50"
               >
                 {isCreating ? "Provisioning..." : "⚡ Boot Environment"}
               </button>
             </form>
           </div>
        </section>
      </main>
    </div>
  );
}
