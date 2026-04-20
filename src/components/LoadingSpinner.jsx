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
  message = "Loading...",
  fullPage = true,
  size = "md",
}) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const spinner = (
    <div className={fullPage ? "text-center" : "flex justify-center items-center"}>
      {fullPage && (
        <div className="mb-8 animate-pulse">
           <div className="w-16 h-16 bg-theme-main rounded-2xl flex items-center justify-center mx-auto shadow-indigo-200 shadow-xl border-4 border-white transform -rotate-3 overflow-hidden">
               <span className="text-3xl font-black text-theme-accent italic">Sav</span>
           </div>
        </div>
      )}
      <div
        className={`animate-spin rounded-full border-b-2 border-theme-secondary ${sizeClass} ${fullPage ? "mx-auto mb-4" : ""}`}
      ></div>
      {message && fullPage && <p className="text-theme-main font-bold uppercase tracking-tighter text-xs animate-pulse">{message}</p>}
    </div>
  );

  if (!fullPage) return spinner;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {spinner}
    </div>
  );
}
