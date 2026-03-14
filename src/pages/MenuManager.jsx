import { Link } from "react-router-dom";

export default function MenuManager() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-green-600 font-medium hover:text-green-700 transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Menu Manager</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-gray-500">
            Menu management will be available after Supabase is configured.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            You&apos;ll be able to add, edit, and delete menu items here.
          </p>
        </div>
      </main>
    </div>
  );
}
