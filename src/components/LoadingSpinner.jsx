/**
 * Reusable loading spinner shown during network-dependent operations.
 *
 * @param {string}  [message]   Optional text shown below the spinner.
 * @param {boolean} [fullPage]  When true (default), centres the spinner on a
 *                               full-screen background. Set to false for inline use.
 * @param {"sm"|"md"|"lg"} [size]  Spinner size preset (default "md").
 */
const SIZE_CLASSES = {
  sm: "h-5 w-5",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export default function LoadingSpinner({
  message = "Checking System Status...",
  fullPage = true,
  size = "md",
}) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const spinner = (
    <div className={fullPage ? "text-center relative z-10" : "flex justify-center items-center"}>
      {fullPage && (
        <div className="mb-12 relative flex justify-center items-center">
            {/* The "Lighting Up" Logo Container */}
            <div className="w-24 h-24 bg-transparent rounded-full flex items-center justify-center mx-auto overflow-hidden relative group">
                {/* Branding Image Logo */}
                <img 
                    src="/modern_savannah_logo.png" 
                    alt="Savannah Platform" 
                    className="w-full h-full object-contain animate-pulse"
                />
            </div>
        </div>
      )}
      
      {/* Loading Progress Indicator */}
      <div className="relative mb-6">
          <div className={`animate-spin rounded-full border-t-2 border-r-2 border-amber-500 ${sizeClass} mx-auto transition-all duration-700`}></div>
      </div>

      {message && fullPage && (
        <p className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
           {message}
        </p>
      )}
    </div>
  );

  if (!fullPage) return spinner;

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial-fade-dark overflow-hidden fixed inset-0 z-[9999]">
      {spinner}
    </div>
  );
}
