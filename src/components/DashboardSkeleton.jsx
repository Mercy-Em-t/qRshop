export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header matching Dashboard */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-7 bg-slate-200 rounded w-48"></div>
          <div className="hidden sm:flex gap-4">
            <div className="h-8 w-28 bg-slate-200 rounded-xl"></div>
            <div className="h-8 w-28 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Subscription Status Skeleton */}
        <div className="mb-6">
          <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
        </div>

        {/* Quick Actions / Statistics Grid matching Dashboard.jsx */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border-2 border-transparent flex flex-col justify-between h-36">
                <div>
                  <div className="h-5 bg-slate-200 rounded w-2/3 mb-4"></div>
                  <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-4/5"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
