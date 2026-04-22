import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser, markPasswordChanged } from "../services/auth-service";
import Logo from "../components/Logo";

const RULES = [
  { label: "At least 8 characters",        test: (p) => p.length >= 8 },
  { label: "At least 1 uppercase letter",  test: (p) => /[A-Z]/.test(p) },
  { label: "At least 1 number",            test: (p) => /[0-9]/.test(p) },
  { label: "At least 1 special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function ForcePasswordReset() {
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);
  const navigate = useNavigate();
  const user = getCurrentUser();

  const allRulesPassed = RULES.every((r) => r.test(password));
  const passwordsMatch = password === confirm && confirm.length > 0;
  const canSubmit = allRulesPassed && passwordsMatch && !saving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);

    const { error: updateErr } = await supabase.auth.updateUser({ password });

    if (updateErr) {
      setError(updateErr.message);
      setSaving(false);
      return;
    }

    await markPasswordChanged(user?.id);
    navigate("/a", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
      <div className="mb-8">
        <Logo textClassName="font-black text-2xl italic tracking-tighter text-white" />
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🔐
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Set Your Password</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            Required before accessing your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* New Password */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-medium"
            />
          </div>

          {/* Policy Checker */}
          {password.length > 0 && (
            <ul className="space-y-1.5 bg-slate-50 rounded-xl p-4 border border-slate-100">
              {RULES.map((rule) => {
                const passed = rule.test(password);
                return (
                  <li key={rule.label} className={`flex items-center gap-2 text-xs font-semibold ${passed ? "text-green-600" : "text-gray-400"}`}>
                    <span>{passed ? "✅" : "○"}</span>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Confirm Password */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={`w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:bg-white transition font-medium ${
                confirm.length > 0 
                  ? passwordsMatch ? "border-green-500 focus:border-green-600" : "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-green-600"
              }`}
            />
            {confirm.length > 0 && !passwordsMatch && (
              <p className="text-red-500 text-[10px] font-bold mt-1.5 uppercase tracking-tight">Passwords do not match</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
              <p className="text-red-600 text-[10px] font-bold text-center uppercase tracking-tight">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {saving ? "Securing Account..." : "Confirm & Enter Dashboard"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
        This step cannot be skipped
      </p>
    </div>
  );
}
