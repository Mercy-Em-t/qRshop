export default function Cart({ items, onAdd, onRemove, total }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">Your cart is empty</p>
        <p className="text-sm mt-1">Add items from the menu to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.instance_id}
          className={`flex items-center justify-between rounded-lg p-3 transition-colors ${
            item.is_bundled
              ? 'border border-teal-200 bg-teal-50/60 dark:bg-teal-900/20 dark:border-teal-800'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-gray-800 dark:text-gray-100 leading-tight">{item.name}</h4>
              {item.is_bundled && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-teal-500 text-white px-1.5 py-0.5 rounded-full">
                  🎁 Bundle
                </span>
              )}
            </div>
            {item.selected_options && Object.keys(item.selected_options).length > 0 && (
               <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(item.selected_options).map(([key, value]) => (
                     <span key={key} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-700">
                        {key}: <span className="font-bold text-slate-700 dark:text-slate-200">{value}</span>
                     </span>
                  ))}
               </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-sm font-bold ${item.is_bundled ? 'text-teal-700 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>
                KSh {item.price}
              </p>
              {item.is_bundled && item.original_price != null && item.original_price !== item.price && (
                <p className="text-xs text-gray-400 line-through">KSh {item.original_price}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onRemove(item.instance_id)}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              −
            </button>
            <span className="font-semibold text-gray-800 dark:text-gray-100 w-6 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onAdd(item)}
              disabled={item.is_bundled}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                item.is_bundled
                  ? 'bg-teal-100 text-teal-400 cursor-not-allowed dark:bg-teal-900/30'
                  : 'bg-theme-secondary text-white hover:bg-theme-secondary/90 cursor-pointer dark:shadow-theme-secondary/20'
              }`}
              title={item.is_bundled ? "Bundle quantities are fixed" : "Add one more"}
            >
              +
            </button>
          </div>
        </div>
      ))}

      <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-2 flex justify-between items-center">
        <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">Total</span>
        <span className="text-xl font-black text-theme-secondary dark:text-blue-400">KSh {total}</span>
      </div>
    </div>
  );
}
