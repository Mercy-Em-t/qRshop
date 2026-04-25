import { Link } from "react-router-dom";

export default function MenuItem({ item, onAdd, isShopOnline, isGridView }) {
  const { id, name, price, image_url, attributes } = item;
  const size = attributes?.size || attributes?.weight || "";

  if (isGridView) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col group transition-all hover:shadow-md">
        <Link to={`/product/${id}`} className="relative h-40 overflow-hidden">
          <img
            src={image_url || "/placeholder-product.png"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {size && (
            <span className="absolute top-3 left-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">
              {size}
            </span>
          )}
        </Link>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <Link to={`/product/${id}`}>
               <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-1 leading-tight hover:text-theme-secondary transition-colors">
                  {name}
               </h3>
            </Link>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-black text-theme-secondary dark:text-blue-400">
              KSh {price}
            </span>
            <button
              onClick={() => onAdd(item)}
              disabled={!isShopOnline}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                isShopOnline
                  ? "bg-theme-secondary text-white hover:bg-theme-main active:scale-90"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List View (Horizontal)
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4 transition-all hover:shadow-md group">
      <Link to={`/product/${id}`} className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
        <img
          src={image_url || "/placeholder-product.png"}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </Link>
      <div className="flex-1 min-w-0">
         <div className="flex justify-between items-start">
            <Link to={`/product/${id}`} className="flex-1 min-w-0">
               <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 truncate hover:text-theme-secondary transition-colors">
                  {name}
               </h3>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                  {size || "Standard Size"}
               </p>
            </Link>
            <div className="text-right">
               <p className="text-base font-black text-theme-secondary dark:text-blue-400">
                  {price}
               </p>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">KSh</p>
            </div>
         </div>
      </div>
      <button
        onClick={() => onAdd(item)}
        disabled={!isShopOnline}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
          isShopOnline
            ? "bg-theme-secondary text-white hover:bg-theme-main active:scale-95"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}