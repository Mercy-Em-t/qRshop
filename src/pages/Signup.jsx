import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUpUser, claimGuestOrders } from "../services/auth-service";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { user, error: signUpErr } = await signUpUser(email, password, { 
        full_name: name 
      });

      if (signUpErr) {
        setError(signUpErr);
        setLoading(false);
        return;
      }

      // Success! Now claim any local guest orders
      await claimGuestOrders(user);

      setSuccess(true);
      setTimeout(() => {
        navigate("/history");
      }, 3000);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-sm w-full animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Aboard!</h2>
          <p className="text-gray-500 mb-8">Your account is ready and your order history has been synced. Redirecting you to your dashboard...</p>
          <div className="animate-pulse flex space-x-2 justify-center">
            <div className="h-2 w-2 bg-green-600 rounded-full"></div>
            <div className="h-2 w-2 bg-green-600 rounded-full"></div>
            <div className="h-2 w-2 bg-green-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-block mb-6">
             <span className="text-3xl">🛍️</span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Create Account</h1>
          <p className="text-gray-500 font-medium">Join to save your order history forever.</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-slate-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-slate-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-slate-300 font-medium"
              />
              <p className="text-[10px] text-gray-400 mt-2 ml-1">Must be at least 6 characters.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 animate-shake">
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
            >
              {loading ? "Initializing..." : "Register Now"}
            </button>
          </form>

          <div className="mt-10 border-t border-slate-50 pt-8 text-center text-sm">
            <p className="text-gray-500 font-medium">
              Already have an account? 
              <Link to="/login" className="text-green-600 font-bold ml-1 hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
           <Link to="/history" className="text-xs font-bold text-gray-400 hover:text-gray-600 tracking-wide uppercase">
              ← Continue as Guest
           </Link>
        </div>
      </div>
    </div>
  );
}
