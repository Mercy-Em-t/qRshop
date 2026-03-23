import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const authOptions = isLocal ? {} : {
      // In production, configure the callback URL in Supabase Dashboard -> Auth -> URL Configuration
      redirectTo: `${window.location.origin}/reset-password`, 
    };
    const { error } = await supabase.auth.resetPasswordForEmail(email, authOptions);

    if (error) {
       setError(error.message);
    } else {
       setMessage("Check your email for the password reset link.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Reset Password
        </h1>
        <p className="text-sm text-center text-gray-500 mb-6">Enter your email and we'll send you a link to reset your password.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          {message && <p className="text-green-600 text-sm font-medium">{message}</p>}

          <button
            type="submit"
            disabled={loading || message}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Sending link..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-green-600 font-bold hover:underline">
             ← Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
