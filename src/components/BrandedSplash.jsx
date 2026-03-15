export default function BrandedSplash() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center z-[9999] overflow-hidden">
      {/* Decorative ambient background pulses */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-75"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>

      {/* Main Logo Hexagon */}
      <div className="relative mb-8 animate-fade-in-up">
        {/* Core pulsing shadow */}
        <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-ping opacity-50"></div>
        
        {/* The Mark */}
        <div className="relative w-24 h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-center transform rotate-3">
          <svg className="w-12 h-12 text-indigo-600 transform -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
      </div>

      {/* Loading Bar Track */}
      <div className="w-48 h-1 bg-indigo-900/30 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-white/90 rounded-full w-1/2 animate-[progress_1s_ease-in-out_infinite]"></div>
      </div>

      <p className="text-white/80 font-medium tracking-wide animate-pulse text-sm">
        Authenticating Location...
      </p>

      {/* Embedded custom keyframes for the progress bar sweep */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />
    </div>
  );
}
