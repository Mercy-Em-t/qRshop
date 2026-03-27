import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

export default function ShopFinances() {
  const [revenue, setRevenue] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const shopId = user?.shop_id;

  useEffect(() => {
    if (shopId) fetchData();
  }, [shopId]);

  const fetchData = async () => {
    setLoading(true);
    const [revRes, expRes] = await Promise.all([
      supabase.from('shop_daily_revenue').select('*').eq('shop_id', shopId).order('sale_date', { ascending: false }),
      supabase.from('shop_daily_expenses').select('*').eq('shop_id', shopId).order('expense_date', { ascending: false })
    ]);
    
    if (revRes.data) setRevenue(revRes.data);
    if (expRes.data) setExpenses(expRes.data);
    setLoading(false);
  };

  const totalRevenue = revenue.reduce((sum, day) => sum + parseFloat(day.total_revenue), 0);
  const totalExpenses = expenses.reduce((sum, day) => sum + parseFloat(day.total_spent), 0);
  const netProfit = totalRevenue - totalExpenses;

  if (loading) return <div className="p-8 text-center text-gray-500">Calculating Ledger...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link to="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
             <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                💰 Accounting Hub
             </h1>
          </div>
          <button onClick={fetchData} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">Refresh Sync</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        
        {/* Profit Overview Card */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-8 rounded-[2.5rem] text-white shadow-2xl mb-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
           <p className="text-indigo-300 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">Net Earnings Snapshot</p>
           <h2 className="text-5xl font-black mb-1">KSh {netProfit.toLocaleString()}</h2>
           <p className="text-indigo-200/60 text-sm font-medium">Automatic calculation of Sales vs Wholesale Costs</p>
           
           <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
              <div>
                 <p className="text-[10px] font-black uppercase text-green-400 mb-1 tracking-widest">Gross Revenue</p>
                 <p className="text-xl font-bold">KSh {totalRevenue.toLocaleString()}</p>
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase text-red-400 mb-1 tracking-widest">Supply Costs</p>
                 <p className="text-xl font-bold">KSh {totalExpenses.toLocaleString()}</p>
              </div>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
           {/* Revenue Breakdown */}
           <section>
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                 📈 Sales History
              </h3>
              <div className="space-y-3">
                 {revenue.length === 0 && <p className="text-center py-10 text-gray-400 italic bg-white rounded-3xl border border-dashed text-sm">No settled sales found.</p>}
                 {revenue.map((day, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
                       <div>
                          <p className="font-bold text-gray-900">{new Date(day.sale_date).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">{day.order_count} orders processed</p>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-green-600">+ KSh {parseFloat(day.total_revenue).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">Net of discounts</p>
                       </div>
                    </div>
                 ))}
              </div>
           </section>

           {/* Expense Breakdown */}
           <section>
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                 📉 Distribution Costs
              </h3>
              <div className="space-y-3">
                 {expenses.length === 0 && <p className="text-center py-10 text-gray-400 italic bg-white rounded-3xl border border-dashed text-sm">No wholesale expenses tracked.</p>}
                 {expenses.map((day, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
                       <div>
                          <p className="font-bold text-gray-900">{new Date(day.expense_date).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">{day.wholesale_order_count} wholesale batches</p>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-red-500">- KSh {parseFloat(day.total_spent).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">Inventory supply</p>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>

      </main>
    </div>
  );
}
