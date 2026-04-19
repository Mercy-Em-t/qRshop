/**
 * The Story of the Modern Savannah:
 * In the heart of the digital landscape, the Acacia Tree stands as a beacon of connection.
 * Rooted in the rich heritage of Africa, its branches are embedded with glowing tech wires, 
 * signaling the pulse of a new commerce ecosystem. As the sun rises over the Savannah, 
 * it brings life to every shop and every customer, finally settling into the core of the tree 
 * to power the Modern Savannah Commerce Operating System.
 */

export default function BrandedSplash() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[9999] overflow-hidden">
      {/* 60%: Main Background (Deep Purple/Slate) */}
      <div className="absolute inset-0 bg-[#020617]"></div>
      
      {/* 30%: Secondary Theme (Indigo/Purple Glow) */}
      <div className="absolute top-0 w-full h-full opacity-40 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-900/40 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-900/40 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative flex flex-col items-center">
        {/* 10%: Accent (Pulsating Sunlight - Amber/Gold) */}
        <div className="absolute -top-24 w-48 h-48 bg-gradient-to-t from-amber-500 to-yellow-200 rounded-full blur-3xl opacity-40 animate-sunrise-pulse shadow-[0_0_100px_rgba(245,158,11,0.5)]"></div>

        {/* Modern Savannah Logo with "Aligning Wires" reveal */}
        <div className="relative z-10 w-56 h-56 animate-logo-reveal">
          <img 
            src="/modern_savannah_logo.png" 
            alt="Modern Savannah Logo" 
            className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-wires-sync"
          />
          {/* Animated Wire scan-line overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent w-full h-full translate-x-[-100%] animate-wire-scan"></div>
        </div>

        {/* Loading Analytics */}
        <div className="mt-16 space-y-4 flex flex-col items-center text-center">
          <div className="w-40 h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-indigo-500 rounded-full w-full animate-progress-flow"></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500/80 transition-all drop-shadow-sm">
            Aligning Savannah Core
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sunrise-pulse {
          0% { transform: translateY(40px) scale(0.8); opacity: 0.3; }
          50% { transform: translateY(0) scale(1.1); opacity: 0.7; }
          100% { transform: translateY(40px) scale(0.8); opacity: 0.3; }
        }
        @keyframes logo-reveal {
          0% { clip-path: inset(100% 0 0 0); opacity: 0; }
          100% { clip-path: inset(0 0 0 0); opacity: 1; }
        }
        @keyframes wire-scan {
          0% { transform: translateX(-100%)}
          50% { transform: translateX(100%)}
          100% { transform: translateX(-100%)}
        }
        @keyframes wires-sync {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(168,85,247,0.4)) contrast(1); }
          50% { filter: drop-shadow(0 0 30px rgba(168,85,247,0.9)) contrast(1.1); }
        }
        @keyframes progress-flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-sunrise-pulse {
          animation: sunrise-pulse 4s infinite ease-in-out;
        }
        .animate-logo-reveal {
          animation: logo-reveal 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-wire-scan {
          animation: wire-scan 3s infinite ease-in-out;
        }
        .animate-wires-sync {
          animation: wires-sync 2.5s infinite ease-in-out;
        }
        .animate-progress-flow {
          animation: progress-flow 1.5s infinite ease-in-out;
        }
      `}} />
    </div>
  );
}
