import { useState } from "react";
import { supabase } from "../services/supabase-client";

export default function SeedWholesaleUser() {
  const [email, setEmail] = useState("wholesale@tmsavannah.com");
  const [password, setPassword] = useState("wholesale2026");
  const [shopId, setShopId] = useState("d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882");
  const [status, setStatus] = useState("Ready to provision.");
  const [loading, setLoading] = useState(false);

  const handleProvision = async () => {
    setLoading(true);
    setStatus("Provisioning...");

    try {
      // 1. Check if Supabase is connected
      if (!supabase) throw new Error("Supabase client is not initialized.");

      // 2. Clear out any previous session logic that might interfere
      localStorage.removeItem("qr_session");
      sessionStorage.removeItem("qr_session");
      localStorage.removeItem("qrshop_session");

      // 3. Perform Native SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'merchant',
            shop_id: shopId
          }
        }
      });

      if (authError) {
        console.error("Auth Error:", authError);
        throw new Error(`${authError.name || 'AuthError'}: ${authError.message}`);
      }

      if (authData.user) {
        setStatus("AUTH SUCCESS! Attempting Profile Linkage...");

        // 4. Try manual linkage
        const { error: linkError } = await supabase
          .from("shop_users")
          .insert({
            id: authData.user.id,
            shop_id: shopId,
            email: email,
            role: 'merchant'
          });

        if (linkError) {
          console.warn("Linkage Error:", linkError);
          setStatus(`AUTH OK, but Profile Linkage failed: ${linkError.message}`);
        } else {
          await supabase.from("shops").update({ 
            needs_password_change: true,
            kyc_completed: false 
          }).eq("shop_id", shopId);
          
          setStatus("SUCCESS! Account provisioned natively.");
        }
      }
    } catch (err) {
      console.error("Provisioning Failure:", err);
      setStatus(`FAIL: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginTest = async () => {
    setLoading(true);
    setStatus("Testing Login...");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setStatus(`LOGIN FAIL: ${error.message} (Code: ${error.status || 'unknown'})`);
      } else {
        setStatus(`LOGIN SUCCESS! Session user: ${data.user.email}`);
      }
    } catch (err) {
      setStatus(`INTERNAL ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white ">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl p-10 border border-slate-700">
        <h1 className="text-2xl font-black mb-1 text-center">Native Account Provisioner</h1>
        <p className="text-slate-400 mb-8 text-sm text-center">
          Secure identity creation using the platform SDK.
        </p>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Account Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Initial Password</label>
            <input 
              type="text" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Target Shop UUID</label>
            <input 
              type="text" 
              value={shopId} 
              onChange={e => setShopId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono"
            />
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 mb-8 font-mono text-xs text-green-400 break-all border border-green-900/30 min-h-[60px]">
          {status}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleProvision}
            disabled={loading}
            className="w-full bg-indigo-600 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Working..." : "1. Provision Account"}
          </button>

          <button
            onClick={handleLoginTest}
            disabled={loading}
            className="w-full bg-slate-700 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-600 transition disabled:opacity-50"
          >
            {loading ? "Checking..." : "2. Test Native Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
