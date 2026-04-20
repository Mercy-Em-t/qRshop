import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authenticateUser } from "../services/auth-service";
import Logo from "../components/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { user, profiles, requiresSelection, error: authError } = await authenticateUser(email, password);
    setLoading(false);

    if (authError) {
      setError(authError);
      return;
    }

    if (requiresSelection) {
      localStorage.setItem("pending_selection", JSON.stringify(profiles));
      localStorage.setItem("pending_user_id", JSON.stringify(user.id));
      navigate("/shop-selection");
      return;
    }

    if (user.role === 'system_admin') {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8">
         <Logo textClassName="font-black text-2xl italic tracking-tighter" />
      </div>
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full border border-slate-100">
        <h1 className="text-2xl font-black text-gray-900 text-center mb-2">
          Shop Login
        </h1>
        <p className="text-xs text-gray-400 text-center mb-8 font-bold uppercase tracking-widest">Operator Portal</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="email"
              className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@shop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-medium"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"
            >
              Security Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-medium"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
               <p className="text-red-600 text-[10px] font-bold text-center uppercase tracking-tight">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 active:scale-95 disabled:opacity-50 cursor-pointer mt-4"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
          
          <div className="text-center mt-4">
             <Link to="/forgot-password" size="sm" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-green-600 transition-colors">
                Forgot Security Key?
             </Link>
          </div>
        </form>
      </div>
      
      <p className="mt-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Modern Savannah Secure Node</p>
    </div>
  );
}
