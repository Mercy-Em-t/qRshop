import { useNavigate } from "react-router-dom";

export default function InvalidAccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-red-500 text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-500 mb-6">
          Please scan a valid QR code at the restaurant to access the menu.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors cursor-pointer"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
