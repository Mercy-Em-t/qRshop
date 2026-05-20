import { Link } from "react-router-dom";
import { getThumbnailUrl } from "../utils/image-utils";

export default function MenuItem({ item, onAdd, isShopOnline, isGridView }) {
  const { id, name, price, image_url, attributes } = item;
  const optimizedImage = getThumbnailUrl(image_url);

  const size = attributes?.size || attributes?.weight || "";

  if (isGridView) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 flex flex-col group transition-all hover:shadow-md min-w-0 w-full">
        <Link to={`/product/${id}`} className="relative aspect-square w-full overflow-hidden block bg-gray-50 flex-shrink-0">
          <img
            src={optimizedImage || "/placeholder-product.png"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {size && (
            <span className="absolute top-1 left-1 sm:top-3 sm:left-3 bg-white/80 backdrop-blur-md px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-gray-500">
              {size}
            </span>
          )}
        </Link>
        <div className="p-2 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <Link to={`/product/${id}`} className="block min-w-0">
               <h3 className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-800 line-clamp-2 leading-tight hover:text-theme-secondary transition-colors">
                  {name}
               </h3>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-2 sm:mt-3 min-w-0">
            <span className="text-[10px] sm:text-xs md:text-sm font-black text-theme-secondary truncate flex-shrink-0">
              KSh {price}
            </span>
            <button
              onClick={() => onAdd(item)}
              disabled={!isShopOnline}
              className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg sm:rounded-2xl flex items-center justify-center transition-all shadow-sm flex-shrink-0 ${
                isShopOnline
                  ? "bg-theme-secondary text-white hover:bg-theme-main active:scale-90 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md group w-full min-w-0">
      <Link to={`/product/${id}`} className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
        <img
          src={optimizedImage || "/placeholder-product.png"}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </Link>
      <div className="flex-1 min-w-0">
         <div className="flex justify-between items-start gap-2 w-full min-w-0">
            <Link to={`/product/${id}`} className="flex-1 min-w-0">
               <h3 className="text-base font-bold text-gray-800 truncate hover:text-theme-secondary transition-colors">
                  {name}
               </h3>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                  {size || "Standard Size"}
               </p>
            </Link>
            <div className="text-right flex-shrink-0">
               <p className="text-base font-black text-theme-secondary">
                  {price}
               </p>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">KSh</p>
            </div>
         </div>
      </div>
      <button
        onClick={() => onAdd(item)}
        disabled={!isShopOnline}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm flex-shrink-0 ${
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