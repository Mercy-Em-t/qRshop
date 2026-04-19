import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth-service";
import { User, LogOut, ShoppingBag, MapPin } from "lucide-react";

export default function CustomerHeader() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <div className="relative">
      {user ? (
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 hover:bg-green-100 transition shadow-sm"
          >
            <User className="w-5 h-5" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-50 mb-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged In As</p>
                 <p className="text-xs font-bold text-slate-800 truncate">{user.email}</p>
              </div>
              
              <Link to="/history" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition">
                <ShoppingBag className="w-4 h-4" />
                <span>Order History</span>
              </Link>
              
              <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition">
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses</span>
              </Link>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition text-left mt-1 border-t border-slate-50 pt-3"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link 
          to="/login?role=customer" 
          className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-green-600 transition flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          <span>Login</span>
        </Link>
      )}
    </div>
  );
}
