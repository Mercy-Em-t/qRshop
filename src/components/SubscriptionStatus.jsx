import { Link } from "react-router-dom";
import usePlanAccess from "../hooks/usePlanAccess";

/**
 * Displays the current subscription plan status for a shop.
 * Clicking navigates to the full Subscription management page.
 */
export default function SubscriptionStatus({ shop }) {
  const planAccess = usePlanAccess();

  if (planAccess.loading) {
    return <div className="h-16 bg-gray-100 animate-pulse rounded-xl"></div>;
  }

  const currentPlan = planAccess.planId?.toUpperCase() || "FREE";

  let summaryText = "Basic QR menu — upgrade for smart checkout.";
  if (planAccess.isEnterprise) summaryText = "Custom enterprise features unlocked.";
  else if (planAccess.isBusiness) summaryText = "Full suite: STK payments, multi-user access.";
  else if (planAccess.isPro) summaryText = "Campaigns, analytics & WhatsApp Bot active.";
  else if (planAccess.isBasic) summaryText = "Smart structured WhatsApp checkout unlocked.";

  let daysRemaining = null;
  let isActive = true;
  if (shop?.plan_expires_at && currentPlan !== "FREE") {
    daysRemaining = Math.max(0, Math.ceil((new Date(shop.plan_expires_at) - new Date()) / (1000 * 60 * 60 * 24)));
    isActive = daysRemaining > 0;
  }

  const borderColor = !isActive ? "border-l-red-400" : currentPlan === "FREE" ? "border-l-gray-300" : "border-l-green-500";

  return (
    <Link
      to="/a/subscription"
      className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${borderColor} flex items-center justify-between hover:shadow-md transition-shadow group`}
    >
      <div className="min-w-0">
        <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 flex-wrap">
          <span>{currentPlan} TIER</span>
          {planAccess.isSystemAdmin && (
            <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">ADMIN</span>
          )}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {daysRemaining !== null
            ? isActive
              ? `${daysRemaining} days remaining · ${summaryText}`
              : "⚠️ Plan expired — tap to renew"
            : summaryText}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${
          isActive && currentPlan !== "FREE"
            ? "bg-green-100 text-green-700"
            : currentPlan === "FREE"
            ? "bg-gray-100 text-gray-600"
            : "bg-red-100 text-red-700"
        }`}>
          {isActive && currentPlan !== "FREE" ? "Active" : currentPlan === "FREE" ? "Free" : "Expired"}
        </span>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
