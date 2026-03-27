export default function Logo({ className = "h-8 w-8", textClassName = "font-black text-xl italic tracking-tighter" }) {
  return (
    <div className="flex items-center gap-2 group cursor-pointer">
      <div className={`${className} bg-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden relative`}>
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 text-white fill-current">
          <path d="M10,85 Q50,40 90,85 Z" className="opacity-40" />
          <path d="M47,85 L53,85 L51,65 Q70,60 85,50 L50,55 L15,50 Q30,60 49,65 Z" />
          <circle cx="15" cy="50" r="2" />
          <circle cx="85" cy="50" r="2" />
          <circle cx="50" cy="55" r="2" />
          <line x1="5" y1="85" x2="95" y2="85" stroke="currentColor" strokeWidth="1" className="opacity-60" />
        </svg>
      </div>
      <span className={`${textClassName} text-gray-900`}>
        Shop<span className="text-green-600">QR</span>
      </span>
    </div>
  );
}
