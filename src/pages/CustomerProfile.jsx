import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCurrentUser } from "../services/auth-service";
import { supabase } from "../services/supabase-client";
import { MapPin, Phone, User, ArrowLeft, Save, Trash2 } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CustomerProfile() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
     full_name: "",
     phone: "",
     default_address: "",
     latitude: null,
     longitude: null
  });

  useEffect(() => {
    if (!user) { navigate("/login?role=customer"); return; }
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (e) {
      console.error("Profile fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("customer_profiles")
        .upsert({
           id: user.id,
           ...profile,
           updated_at: new Date().toISOString()
        });

      if (error) throw error;
      alert("Profile updated successfully!");
    } catch (e) {
      alert("Failed to save profile: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading your preferences..." />;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
           <Link to="/menu" className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
           </Link>
           <h1 className="font-black text-slate-800 uppercase tracking-widest text-sm">Account Settings</h1>
           <div className="w-9" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-8">
         <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-4 mb-2">
               <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-100">
                  <User className="w-8 h-8" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">Your Identity</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{user.email}</p>
               </div>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={profile.full_name}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    placeholder="Enter your name"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-slate-800 transition-all"
                  />
               </div>

               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">WhatsApp Phone</label>
                  <input 
                    type="tel" 
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    placeholder="+254..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-slate-800 transition-all"
                  />
               </div>
            </div>
         </div>

         <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <MapPin className="w-5 h-5 text-green-600" />
               <h2 className="text-lg font-black text-slate-900">Saved Address</h2>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
               Your primary delivery address is saved here for fast 1-click checkout.
            </p>

            <textarea 
               rows="3"
               value={profile.default_address}
               onChange={(e) => setProfile({...profile, default_address: e.target.value})}
               className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-slate-800 transition-all text-sm"
               placeholder="Street name, Apartment name, Floor/Suite Number..."
            />

            {profile.latitude && (
               <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <MapPin className="w-4 h-4" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest leading-none">GPS Coordinates Locked</p>
                        <p className="text-[9px] text-blue-400 font-bold mt-1 uppercase leading-none italic">Precise Pin Data Active</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setProfile({...profile, latitude: null, longitude: null})}
                    className="text-blue-400 hover:text-red-500 transition-colors"
                  >
                     <Trash2 className="w-4 h-4" />
                  </button>
               </div>
            )}
         </div>

         <button 
           onClick={handleSave}
           disabled={saving}
           className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
         >
            {saving ? (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <Save className="w-4 h-4" />
            )}
            <span>Save My Profile</span>
         </button>
      </main>
    </div>
  );
}
