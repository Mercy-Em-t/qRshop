import { useState, useEffect } from "react";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";
import LoadingSpinner from "./LoadingSpinner";

export default function MaintenanceGate({ children, preFetchedMaintenance }) {
  const [maintenance, setMaintenance] = useState(preFetchedMaintenance || null);
  
  const [loading, setLoading] = useState(() => {
    if (preFetchedMaintenance) return false;
    
    // Determine if we should block for maintenance check
    const publicPaths = ['/', '/pricing', '/login', '/signup', '/terms', '/privacy', '/about', '/contact', '/request-access'];
    const isPublicPath = typeof window !== 'undefined' && publicPaths.includes(window.location.pathname);
    
    // Check if we are on the main domain (not a subdomain)
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const parts = hostname.split('.');
    const isMainDomain = parts.length < 3 || parts[0] === 'www' || hostname.includes('vercel.app') || hostname === 'localhost';

    // If it's a public path on main domain, don't block
    return !(isPublicPath && isMainDomain);
  });

  const user = getCurrentUser();

  useEffect(() => {
    // We always fetch the latest maintenance status in the background
    // but only block if 'loading' was initially true
    async function checkMaintenance() {
      try {
        const { data, error } = await supabase
          .from("system_config")
          .select("config_value")
          .eq("config_key", "maintenance_mode")
          .maybeSingle();

        if (!error && data) {
          setMaintenance(data.config_value);
        }
      } catch (err) {
        console.error("Maintenance check failed:", err);
      } finally {
        setLoading(false);
      }
    }

    checkMaintenance();
  }, []); // Run on mount to ensure background sync

  if (loading) return <LoadingSpinner message="Checking system status..." />;

  // Bypass Logic
  const isActive = maintenance?.is_active === true;
  const allowAdmins = maintenance?.allow_admins === true;
  const isSystemAdmin = user?.system_role === "system_admin";

  if (isActive && !(allowAdmins && isSystemAdmin)) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="w-full max-w-lg text-center space-y-8 relative z-10">
           <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 shadow-2xl mb-4 animate-bounce duration-[3000ms] ease-in-out">
              <span className="text-5xl">⚡</span>
           </div>
           
           <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                 System Optimization
              </h1>
              <p className="text-lg text-indigo-200/70 font-medium">
                 {maintenance?.message || "We're currently performing some scheduled maintenance to improve your experience. We'll be back online shortly."}
              </p>
           </div>

           <div className="pt-8 border-t border-white/5">
              <div className="flex flex-col items-center gap-4">
                 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Status: Hardening Security</span>
                 </div>
                 <p className="text-gray-500 text-sm italic">
                    All your store data and orders are completely safe and secure.
                 </p>
              </div>
           </div>

           <div className="pt-12 text-[10px] uppercase tracking-[0.3em] font-bold text-gray-600">
              Modern Savannah Enterprise Infrastructure
           </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
