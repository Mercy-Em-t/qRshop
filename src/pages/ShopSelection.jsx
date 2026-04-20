import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

export default function ShopSelection() {
  const [profiles, setProfiles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const pending = localStorage.getItem("pending_selection");
    if (!pending) {
      navigate("/login");
      return;
    }
    setProfiles(JSON.parse(pending));
  }, [navigate]);

  const handleSelect = (profile) => {
    const sessionUser = {
      id: profile.user_id || JSON.parse(localStorage.getItem("pending_user_id")),
      email: profile.email || profile.shop_name,
      role: profile.role,
      shop_id: profile.shop_id,
      shop_name: profile.shop_name
    };

    localStorage.setItem("savannah_session", JSON.stringify(sessionUser));
    localStorage.removeItem("pending_selection");
    localStorage.removeItem("pending_user_id");

    if (profile.role === 'system_admin') {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="mb-8">
        <Logo textClassName="font-black text-2xl italic tracking-tighter" />
      </div>
      
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-black text-gray-900 text-center mb-2">Choose Your Node</h1>
        <p className="text-xs text-gray-400 text-center mb-10 font-bold uppercase tracking-widest">
          Multiple shop associations found for your account
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <button
              key={profile.shop_id}
              onClick={() => handleSelect(profile)}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-green-400 transition-all text-left flex flex-col justify-between h-48 group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      {profile.shop_name?.charAt(0) || '🏪'}
                   </div>
                   <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                      {profile.role}
                   </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 group-hover:text-green-600 transition-colors">
                  {profile.shop_name}
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {profile.subdomain || 'node'}.tmsavannah.com
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] font-black text-green-600 uppercase tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Enter Workspace</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </div>

              {/* Decorative background circle */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 duration-500"></div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
           <button 
             onClick={() => { localStorage.clear(); navigate("/login"); }}
             className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-red-500 transition-colors border-b border-transparent hover:border-red-200 pb-1"
           >
             Sign out of all nodes
           </button>
        </div>
      </div>
    </div>
  );
}
