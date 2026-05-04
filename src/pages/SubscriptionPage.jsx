import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth-service";
import { supabase } from "../services/supabase-client";
import usePlanAccess from "../hooks/usePlanAccess";
import { PLANS } from "../config/plans";

// AI Credits add-on definition
const AI_ADDON = {
  id: "ai_credits",
  name: "AI Sales Credits",
  icon: "🧠",
  color: "indigo",
  description: "Monthly AI conversation credits for your Sales Assistant",
};

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const shopId = user?.shop_id || sessionStorage.getItem("active_shop_id");
  const planAccess = usePlanAccess();

  const [shop, setShop] = useState(null);
  const [allSubs, setAllSubs] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewTarget, setRenewTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const currentPlanId = planAccess.planId || "free";

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchData();
  }, [shopId]);

  const fetchData = async () => {
    if (!shopId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [shopRes, subsRes] = await Promise.all([
        supabase.from("shops").select("name, plan, plan_expires_at").eq("shop_id", shopId).single(),
        supabase.from("subscriptions").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }),
      ]);
      if (shopRes.data) setShop(shopRes.data);
      if (subsRes.data) setAllSubs(subsRes.data);
    } catch (err) {
      console.warn("Subscription fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Active subscription rows (deduplicated by plan_type)
  const activeSubs = allSubs.filter(s => s.status === "active");
  const hasAiCredits = activeSubs.some(s => s.plan_type === "ai_credits");

  // Days remaining helper
  const daysRemaining = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const mainSub = activeSubs.find(s => !["ai_credits"].includes(s.plan_type));
  const aiSub = activeSubs.find(s => s.plan_type === "ai_credits");

  const handlePlanSelect = (planId) => {
    if (planId === currentPlanId) return;
    setSelectedPlanId(planId);
  };

  const handleRequestUpgrade = () => {
    if (!selectedPlanId || selectedPlanId === currentPlanId) return;
    const plan = PLANS.find(p => p.id === selectedPlanId);
    const msg = encodeURIComponent(
      `Hi! I'd like to upgrade my QRShop account to the *${plan?.name}* plan (KSh ${plan?.priceLabel}/mo).\n\nShop: ${shop?.name || shopId}`
    );
    window.open(`https://wa.me/254700000000?text=${msg}`, "_blank");
  };

  const openRenewModal = (sub) => {
    setRenewTarget(sub);
    setShowRenewModal(true);
  };

  const handleRenewRequest = () => {
    if (!renewTarget) return;
    setRequesting(true);
    const planName = renewTarget.plan_type === "ai_credits"
      ? "AI Sales Credits add-on"
      : PLANS.find(p => p.id === renewTarget.plan_type)?.name || renewTarget.plan_type;
    const msg = encodeURIComponent(
      `Hi! I'd like to *renew* my QRShop *${planName}* subscription.\n\nShop: ${shop?.name || shopId}`
    );
    window.open(`https://wa.me/254700000000?text=${msg}`, "_blank");
    setRequesting(false);
    setShowRenewModal(false);
  };

  const colorMap = {
    green:  { ring: "ring-green-500",  bg: "bg-green-600",  light: "bg-green-50",  text: "text-green-700",  border: "border-green-500",  badge: "bg-green-100 text-green-700"  },
    blue:   { ring: "ring-blue-500",   bg: "bg-blue-600",   light: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-500",   badge: "bg-blue-100 text-blue-700"    },
    purple: { ring: "ring-purple-500", bg: "bg-purple-600", light: "bg-purple-50", text: "text-purple-700", border: "border-purple-500", badge: "bg-purple-100 text-purple-700"},
    indigo: { ring: "ring-indigo-500", bg: "bg-indigo-600", light: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-500", badge: "bg-indigo-100 text-indigo-700"},
  };

  if (loading || planAccess.loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/a")} className="text-green-600 font-medium hover:text-green-700 transition text-sm">
            ← Dashboard
          </button>
          <h1 className="text-lg font-bold text-gray-900">Subscription</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Active Subscriptions ── */}
        <section>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Active Subscriptions</h2>
          <div className="space-y-3">
            {/* Main plan */}
            {mainSub ? (
              <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">🏪</div>
                  <div>
                    <p className="font-black text-gray-900 text-sm uppercase tracking-wide">
                      {PLANS.find(p => p.id === mainSub.plan_type)?.name || mainSub.plan_type} Plan
                    </p>
                    {mainSub.end_date && (
                      <p className={`text-xs font-bold mt-0.5 ${daysRemaining(mainSub.end_date) <= 7 ? "text-red-500" : "text-gray-400"}`}>
                        {daysRemaining(mainSub.end_date) > 0
                          ? `${daysRemaining(mainSub.end_date)} days remaining · expires ${new Date(mainSub.end_date).toLocaleDateString()}`
                          : "⚠️ Expired"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
                  {daysRemaining(mainSub.end_date) <= 14 && (
                    <button onClick={() => openRenewModal(mainSub)} className="bg-green-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl hover:bg-green-700 transition uppercase tracking-widest">
                      Renew
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl">🏪</div>
                <div>
                  <p className="font-black text-gray-700 text-sm uppercase tracking-wide">Free Tier</p>
                  <p className="text-xs text-gray-400 mt-0.5">Basic QR menu and click-to-chat ordering</p>
                </div>
                <span className="ml-auto bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Free</span>
              </div>
            )}

            {/* AI Credits add-on */}
            {hasAiCredits && aiSub && (
              <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">🧠</div>
                  <div>
                    <p className="font-black text-gray-900 text-sm uppercase tracking-wide">AI Sales Credits</p>
                    {aiSub.end_date && (
                      <p className={`text-xs font-bold mt-0.5 ${daysRemaining(aiSub.end_date) <= 7 ? "text-red-500" : "text-gray-400"}`}>
                        {daysRemaining(aiSub.end_date) > 0
                          ? `${daysRemaining(aiSub.end_date)} days remaining`
                          : "⚠️ Expired"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
                  {daysRemaining(aiSub.end_date) <= 14 && (
                    <button onClick={() => openRenewModal(aiSub)} className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition uppercase tracking-widest">
                      Renew
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Plan Selection Cards ── */}
        <section>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Choose a Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isSelected = selectedPlanId === plan.id;
              const c = colorMap[plan.colorTag] || colorMap.green;

              return (
                <label
                  key={plan.id}
                  htmlFor={`plan-${plan.id}`}
                  className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 flex gap-4 items-start
                    ${isCurrent ? `${c.border} shadow-md` : isSelected ? `${c.border} shadow-md` : "border-gray-100 hover:border-gray-200"}
                  `}
                >
                  <input
                    type="radio"
                    id={`plan-${plan.id}`}
                    name="plan"
                    value={plan.id}
                    checked={isCurrent || isSelected}
                    disabled={isCurrent}
                    onChange={() => handlePlanSelect(plan.id)}
                    className={`mt-1 w-4 h-4 accent-${plan.colorTag}-600 flex-shrink-0`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-gray-900 text-sm">{plan.name}</p>
                      {isCurrent && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.badge} uppercase tracking-widest`}>
                          Current
                        </span>
                      )}
                      {plan.popular && !isCurrent && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-widest">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className={`text-xl font-black mt-1 ${c.text}`}>
                      {plan.priceLabel === "0" ? "Free" : `KSh ${plan.priceLabel}`}
                      {plan.priceLabel !== "0" && <span className="text-xs font-medium text-gray-400">/mo</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{plan.shortDesc}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Upgrade CTA */}
          {selectedPlanId && selectedPlanId !== currentPlanId && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-green-800">
                  Upgrade to {PLANS.find(p => p.id === selectedPlanId)?.name}
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  KSh {PLANS.find(p => p.id === selectedPlanId)?.priceLabel}/month — contact us via WhatsApp to activate
                </p>
              </div>
              <button
                onClick={handleRequestUpgrade}
                className="bg-green-600 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-green-700 transition shadow-md flex-shrink-0"
              >
                Request Upgrade →
              </button>
            </div>
          )}
        </section>

        {/* ── AI Credits Add-on ── */}
        {!hasAiCredits && (
          <section>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Add-ons</h2>
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl border border-indigo-100 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🧠</div>
                <div>
                  <p className="font-black text-gray-900 text-sm">AI Sales Credits</p>
                  <p className="text-xs text-gray-500 mt-0.5">Power your Sales Assistant with monthly AI conversation credits</p>
                  <p className="text-xs font-black text-indigo-700 mt-1">Contact us for pricing</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const msg = encodeURIComponent(`Hi! I'd like to add *AI Sales Credits* to my QRShop account.\n\nShop: ${shop?.name || shopId}`);
                  window.open(`https://wa.me/254700000000?text=${msg}`, "_blank");
                }}
                className="bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl hover:bg-indigo-700 transition shadow-md flex-shrink-0"
              >
                Get AI Credits
              </button>
            </div>
          </section>
        )}

        {/* ── Subscription History ── */}
        {allSubs.length > 0 && (
          <section>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Subscription History</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {allSubs.slice(0, 6).map((sub, i) => (
                <div key={sub.id} className={`flex items-center justify-between px-5 py-3 text-sm ${i !== 0 ? "border-t border-gray-50" : ""}`}>
                  <div>
                    <p className="font-bold text-gray-800 capitalize">{sub.plan_type} Plan</p>
                    <p className="text-xs text-gray-400">
                      {new Date(sub.start_date).toLocaleDateString()} → {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : "Ongoing"}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                    sub.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {sub.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Support note */}
        <p className="text-center text-xs text-gray-400 pb-4">
          To change your plan, message our support team via WhatsApp · All plans are billed monthly
        </p>
      </main>

      {/* ── Renew Modal ── */}
      {showRenewModal && renewTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-7">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">
                {renewTarget.plan_type === "ai_credits" ? "🧠" : "🏪"}
              </div>
              <h3 className="text-xl font-black text-gray-900">Renew Subscription</h3>
              <p className="text-sm text-gray-500 mt-2">
                Renew your <span className="font-bold capitalize">{renewTarget.plan_type}</span> plan
                {renewTarget.end_date && ` · expires ${new Date(renewTarget.end_date).toLocaleDateString()}`}
              </p>
              {daysRemaining(renewTarget.end_date) === 0 && (
                <p className="text-xs text-red-500 font-bold mt-2">⚠️ Your plan has expired — renew now to restore access.</p>
              )}
              {daysRemaining(renewTarget.end_date) > 0 && daysRemaining(renewTarget.end_date) <= 14 && (
                <p className="text-xs text-amber-600 font-bold mt-2">⏰ Only {daysRemaining(renewTarget.end_date)} days remaining</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Plan</span>
                <span className="font-black capitalize text-gray-900">{renewTarget.plan_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span className="font-black text-gray-900">30 days</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                <span className="text-gray-500">Contact</span>
                <span className="font-black text-gray-900">via WhatsApp</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowRenewModal(false)}
                className="py-3 rounded-xl bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRenewRequest}
                disabled={requesting}
                className="py-3 rounded-xl bg-green-600 text-white font-black text-xs uppercase tracking-widest hover:bg-green-700 transition shadow-md disabled:opacity-50"
              >
                {requesting ? "Opening..." : "Renew Now →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
