import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const AI_BACKEND_URL =
  import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:3000";

/**
 * AIAssistantCard
 * -----------------------------------------------------------------------
 * Dashboard card that surfaces the AI Assistant Suite connection status.
 * It pings the backend-connector /health endpoint and shows:
 *   - Online / Offline connection status with an animated dot
 *   - Loaded suites (tms, shopify…)
 *   - Tool count from the health payload
 *   - Quick-launch into /a/ai-brain
 *   - Trigger Agent webhook button
 * -----------------------------------------------------------------------
 */
export default function AIAssistantCard({ shopId }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking"); // "checking" | "online" | "offline"
  const [healthData, setHealthData] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null); // "success" | "error" | null
  const [hitlPending, setHitlPending] = useState(false);

  // ── Ping health endpoint ──────────────────────────────────────────────
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${AI_BACKEND_URL}/health`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error("Non-200");
      const data = await res.json();
      setHealthData(data);
      setStatus("online");
    } catch {
      setStatus("offline");
      setHealthData(null);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 20000); // re-ping every 20 s
    return () => clearInterval(interval);
  }, [checkHealth]);

  // ── Trigger Agent webhook ─────────────────────────────────────────────
  const handleTriggerAgent = async () => {
    if (!shopId || status !== "online") return;
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch(`${AI_BACKEND_URL}/webhook/tms/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            import.meta.env.VITE_AI_WEBHOOK_SECRET || "dev-secret"
          }`,
        },
        body: JSON.stringify({
          event_type: "dashboard_manual_trigger",
          data: { shop_id: shopId, triggered_by: "shop_owner" },
        }),
      });
      if (res.ok || res.status === 202) {
        setTriggerResult("success");
      } else if (res.status === 403) {
        // HITL intercept — treat as expected
        setHitlPending(true);
        setTriggerResult("hitl");
      } else {
        setTriggerResult("error");
      }
    } catch {
      setTriggerResult("error");
    } finally {
      setTriggering(false);
      setTimeout(() => setTriggerResult(null), 4000);
    }
  };

  // ── Derived display values ────────────────────────────────────────────
  const isOnline = status === "online";
  const isChecking = status === "checking";
  const suites = healthData?.loaded_suites ?? [];
  const toolCount = healthData?.tool_count ?? 0;

  return (
    <div
      className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-xl shadow-lg p-6 border-2 border-transparent hover:border-purple-500 transition-all relative overflow-hidden group"
      style={{ minHeight: "160px" }}
    >
      {/* Background glow orb */}
      <div className="absolute -top-6 -right-6 w-28 h-28 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-400/30 transition-colors" />

      {/* HITL pending warning */}
      {hitlPending && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest z-10">
          ⚠️ HITL Pending
        </div>
      )}

      {/* ── Header row ── */}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              🤖 AI Suite
            </h2>
            <span className="bg-purple-500/40 text-purple-200 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border border-purple-400/30">
              Agent
            </span>
          </div>
          <p className="text-purple-200/60 text-xs leading-snug">
            Autonomous assistant connected to your shop.
          </p>
        </div>

        {/* Connection status dot */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`relative flex h-2.5 w-2.5 ${
                isChecking ? "opacity-50" : ""
              }`}
            >
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isOnline
                    ? "bg-green-400"
                    : isChecking
                    ? "bg-amber-400"
                    : "bg-red-500"
                }`}
              />
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${
                isOnline
                  ? "text-green-400"
                  : isChecking
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {isOnline ? "Online" : isChecking ? "Checking…" : "Offline"}
            </span>
          </div>
          {/* Refresh button */}
          <button
            onClick={checkHealth}
            className="text-purple-400/60 hover:text-purple-300 text-[9px] transition cursor-pointer"
            title="Re-check connection"
          >
            ↺ ping
          </button>
        </div>
      </div>

      {/* ── Stats chips ── */}
      <div className="flex flex-wrap gap-2 mb-4 relative z-10">
        {isOnline ? (
          <>
            {suites.map((s) => (
              <span
                key={s}
                className="bg-white/10 text-white/80 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 capitalize"
              >
                {s} suite
              </span>
            ))}
            <span className="bg-purple-500/30 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-400/20">
              {toolCount} tools
            </span>
          </>
        ) : (
          <span className="text-purple-300/40 text-[11px] italic">
            {isChecking ? "Connecting to backend…" : "Backend not reachable"}
          </span>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="flex gap-2 relative z-10">
        {/* Primary: open AI Chat page */}
        <button
          onClick={() => navigate("/a/ai-chat")}
          className="flex-1 bg-purple-500 hover:bg-purple-400 text-white text-[11px] font-black py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
          id="ai-assistant-open-chat"
        >
          💬 Open Agent Chat
        </button>

        {/* Secondary: trigger webhook */}
        <button
          onClick={handleTriggerAgent}
          disabled={!isOnline || triggering}
          title={
            !isOnline
              ? "Backend is offline"
              : "Manually trigger the TMS agent"
          }
          className={`flex-1 text-[11px] font-black py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 border ${
            !isOnline || triggering
              ? "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
              : triggerResult === "success"
              ? "bg-green-500/20 border-green-400/40 text-green-300"
              : triggerResult === "error"
              ? "bg-red-500/20 border-red-400/40 text-red-300"
              : triggerResult === "hitl"
              ? "bg-amber-500/20 border-amber-400/40 text-amber-300"
              : "bg-white/10 border-white/20 text-white hover:bg-white/20"
          }`}
          id="ai-assistant-trigger-agent"
        >
          {triggering ? (
            <>
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Running…
            </>
          ) : triggerResult === "success" ? (
            "✓ Task Queued"
          ) : triggerResult === "error" ? (
            "✗ Failed"
          ) : triggerResult === "hitl" ? (
            "⚠️ Needs Approval"
          ) : (
            "⚡ Trigger Agent"
          )}
        </button>
      </div>
    </div>
  );
}
