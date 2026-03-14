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
      <div
        className={`animate-spin rounded-full border-b-2 border-green-600 ${sizeClass} ${fullPage ? "mx-auto mb-4" : ""}`}
      ></div>
      {message && fullPage && <p className="text-gray-600">{message}</p>}
    </div>
  );

  if (!fullPage) return spinner;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {spinner}
    </div>
  );
}
