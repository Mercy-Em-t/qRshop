import usePlanAccess from "../hooks/usePlanAccess";

/**
 * Displays the current subscription plan status for a shop.
 */
export default function SubscriptionStatus({ shop }) {
  const planAccess = usePlanAccess();

  if (planAccess.loading) {
    return <div className="h-20 bg-gray-100 animate-pulse rounded-xl"></div>;
  }

  const currentPlan = planAccess.planId?.toUpperCase() || "FREE";
  
  // Calculate expiry if available in shop object
  let isActive = true;
  let summaryText = "Core QR ordering features.";
  
  if (planAccess.isEnterprise) summaryText = "Custom enterprise features unlocked.";
  else if (planAccess.isBusiness) summaryText = "Full suite operations and team access.";
  else if (planAccess.isPro) summaryText = "Campaigns, Smart Analytics, and custom subdomains.";
  else if (planAccess.isBasic) summaryText = "Smart structured WhatsApp checkout unlocked.";

  let expiryNode = null;
  if (shop?.plan_expires_at && currentPlan !== "FREE") {
     const daysRemaining = Math.max(0, Math.ceil((new Date(shop.plan_expires_at) - new Date()) / (1000 * 60 * 60 * 24)));
     isActive = daysRemaining > 0;
     expiryNode = (
       <p className="text-sm text-gray-500 mt-1">
          {isActive ? `${daysRemaining} days remaining` : "Plan expired. Downgraded to Free."}
       </p>
     );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${isActive ? "border-green-500" : "border-red-400"}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
             <span>{currentPlan} TIER</span>
             {planAccess.isSystemAdmin && <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">ADMIN OVERRIDE</span>}
          </h3>
          {expiryNode || <p className="text-sm text-gray-500 mt-1">{summaryText}</p>}
        </div>
        <span
          className={`px-3 py-1 text-sm font-bold rounded-full ${
            isActive && currentPlan !== "FREE" ? "bg-green-100 text-green-700" : currentPlan === "FREE" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"
          }`}
        >
          {isActive && currentPlan !== "FREE" ? "Active" : currentPlan === "FREE" ? "Free Tier" : "Expired"}
        </span>
      </div>
    </div>
  );
}
