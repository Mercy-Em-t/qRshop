import React from 'react';

/**
 * Specialized UI for Promo Bundles / Combos.
 * Shows bundle savings and allows one-tap claim.
 */
export default function BundleCard({ bundle, onClaim, menuItems }) {
  const { name, description, discount_type, discount_value, bundle_price, promotion_items } = bundle;
  
  // Find the names of items included in this bundle
  const bundleProductIds = new Set(promotion_items?.map(pi => pi.menu_item_id) || []);
  const itemsInBundle = menuItems.filter(item => bundleProductIds.has(item.id));
  
  const originalTotal = itemsInBundle.reduce((sum, i) => sum + i.price, 0);
  const displayBundlePrice = discount_type === 'bundle_price' ? bundle_price : originalTotal - (discount_type === 'percent' ? (originalTotal * discount_value / 100) : discount_value);
  const savings = originalTotal - displayBundlePrice;

  return (
    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg flex-shrink-0 w-[280px] min-w-[280px] sm:w-72 sm:min-w-[288px] snap-center">
      <div className="flex justify-between items-start mb-3">
        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
          🔥 Exclusive Deal
        </span>
        {savings > 0 && (
           <span className="bg-yellow-400 text-teal-900 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-sm">
             Save KSh {Math.round(savings)}
           </span>
        )}
      </div>

      <h3 className="text-xl font-black mb-1 leading-tight truncate">{name}</h3>
      <p className="text-xs text-white/80 mb-4 h-8 line-clamp-2 leading-snug">
        {description || `Enjoy this special combo of ${itemsInBundle.length} items.`}
      </p>

      <div className="bg-black/10 rounded-xl p-3 mb-5 border border-white/10">
        <ul className="space-y-1">
          {itemsInBundle.map(item => (
            <li key={item.id} className="text-[11px] font-medium flex justify-between">
              <span>• {item.name}</span>
              <span className="opacity-60 line-through">KSh {item.price}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 mt-auto">
        <div>
          <p className="text-[10px] uppercase font-bold opacity-60 leading-none mb-1">Bundle Price</p>
          <p className="text-2xl font-black leading-none">KSh {displayBundlePrice}</p>
        </div>
        <button 
          onClick={() => onClaim(bundle, itemsInBundle)}
          className="bg-white text-emerald-700 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-tight shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          Claim Now
        </button>
      </div>
    </div>
  );
}
