export default function Logo({ className = "h-8 w-8", textClassName = "font-black text-xl italic tracking-tighter" }) {
  return (
    <div className="flex items-center gap-2 group cursor-pointer">
      <div className={`${className} bg-purple-950 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden relative border border-white/10`}>
        <img 
          src="/modern_savannah_logo.png" 
          alt="Modern Savannah Logo" 
          className="w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/40 to-transparent"></div>
      </div>
      <span className={`${textClassName} text-purple-950`}>
        Modern<span className="text-amber-500 font-black">Savannah</span>
      </span>
    </div>
  );
}
