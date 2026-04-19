export default function MenuItem({ item, onAdd, isShopOnline = true }) {
  return (
    <div className="border border-gray-100 rounded-2xl p-4 flex gap-4 bg-white shadow-sm hover:shadow-md transition">
      
      {/* Thumbnail */}
      {item.product_images && item.product_images.length > 0 && (
         <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden relative border border-gray-100">
            <img src={item.product_images[0].url} alt={item.name} className="w-full h-full object-cover" />
         </div>
      )}

      <div className="flex-1 flex flex-col justify-between">
         <div>
            <div className="flex justify-between items-start gap-2">
               <h3 className="text-lg font-bold text-gray-800 leading-tight">{item.name}</h3>
               {item.product_link && (
                  <a href={item.product_link} target="_blank" rel="noreferrer" className="text-theme-secondary hover:bg-theme-secondary/10 border-theme-secondary/20 flex-shrink-0">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                       <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                       <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                     </svg>
                  </a>
               )}
            </div>
            {item.description && (
               <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
            )}

            {/* Tags / Variants UI */}
            {(item.tags?.length > 0 || (item.variant_options && Object.keys(item.variant_options).length > 0)) && (
               <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                  {item.tags?.map((t, idx) => (
                     <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase border border-gray-200">{t}</span>
                  ))}
                  {item.variant_options && Object.keys(item.variant_options).slice(0, 2).map((vKey, idx) => (
                     <span key={`v-${idx}`} className="bg-theme-accent/10 text-theme-secondary border-theme-accent/20 flex items-center gap-1">
                        Select {vKey}
                     </span>
                  ))}
               </div>
            )}
         </div>

         <div className="flex items-end justify-between mt-3">
            <span className="text-theme-secondary font-black underline decoration-theme-accent/50 decoration-2 underline-offset-4">
               KSh {item.price}
            </span>
            <button
               onClick={() => isShopOnline && onAdd(item)}
               disabled={!isShopOnline}
               className={`px-4 py-2 rounded-xl transition-all shadow-xl font-black uppercase text-xs tracking-widest ${!isShopOnline ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-theme-main text-white hover:bg-theme-secondary active:scale-95'}`}
            >
               <span>Add</span>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
               </svg>
            </button>
         </div>
      </div>
    </div>
  );
}
