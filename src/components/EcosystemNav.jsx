import { Link, useLocation } from "react-router-dom";

export default function EcosystemNav() {
  const location = useLocation();
  const isCommunity = location.pathname.includes("/community");

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-center gap-1">
        
        <Link 
          to="/explore" 
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-bold transition-all relative ${!isCommunity ? 'text-gray-900 bg-gray-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
        >
          🛍️ Discover Shops
          {!isCommunity && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-green-500 rounded-t-md"></div>}
        </Link>
        
        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        <Link 
          to="/community" 
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-bold transition-all relative ${isCommunity ? 'text-indigo-900 bg-indigo-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
        >
          🗣️ Community Feed
          {isCommunity && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-t-md"></div>}
        </Link>

      </div>
    </div>
  );
}
