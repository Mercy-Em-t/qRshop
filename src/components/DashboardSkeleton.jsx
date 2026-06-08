export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <header className="bg-white shadow-sm h-16 w-full"></header>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl p-8 mb-8 border border-slate-100 shadow-sm">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-slate-100 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="h-20 bg-slate-100 rounded-2xl"></div>
             <div className="h-20 bg-slate-100 rounded-2xl"></div>
             <div className="h-20 bg-slate-100 rounded-2xl"></div>
             <div className="h-20 bg-slate-100 rounded-2xl"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4,5,6,7,8].map((i) => (
             <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full mb-3"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
