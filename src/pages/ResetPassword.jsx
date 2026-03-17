import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // When the user clicks the link in their email, they arrive here.
    // Supabase Auth automatically parses the access_token hash fragment and signs them in to a temporary session.
    // We just need to listen for that session and verify they are allowed to reset.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
         setError("No active reset session found. Ensure you clicked the link in your email recently.");
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
       setError(error.message);
    } else {
       setMessage("Password successfully updated! Redirecting to login...");
       setTimeout(() => {
          navigate("/login");
       }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Set New Password
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter at least 6 characters"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          {message && <p className="text-green-600 text-sm font-medium">{message}</p>}

          <button
            type="submit"
            disabled={loading || !!message || !!error}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-800 transition-colors hover:underline">
             ← Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
