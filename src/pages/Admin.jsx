import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getCurrentUser } from "../services/auth-service";

export default function Admin() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== "system_admin") {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/admin/shops"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              🏪 Shop Management
            </h2>
            <p className="text-gray-500 text-sm">
              View and manage all registered shops.
            </p>
          </Link>

          <Link
            to="/admin/plans"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              💳 Plan Management
            </h2>
            <p className="text-gray-500 text-sm">
              Configure subscription plans and features.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
