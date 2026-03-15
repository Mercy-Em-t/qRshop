/**
 * Banner that warns users when they are offline.
 * Displayed at the top of pages when network is unavailable.
 */
export default function OfflineAlert({
  message = "You appear to be offline. Showing cached data.",
}) {
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <p className="text-sm text-yellow-700 text-center">📡 {message}</p>
    </div>
  );
}
