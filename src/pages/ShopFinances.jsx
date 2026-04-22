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

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
      <p className="text-indigo-300/60 font-black uppercase tracking-[0.3em] text-[10px]">Syncing Financial Core...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 selection:bg-indigo-500/30">
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-white/5 p-6 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
             <Link to="/a" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all border border-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
             </Link>
             <div>
                <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                   <span className="text-indigo-500">💰</span> Accounting Hub
                </h1>
                <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.2em] mt-0.5">Ledger Analysis / {user.shop_name}</p>
             </div>
          </div>
          <button onClick={fetchData} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
             Refresh Sync
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-10">
        
        {/* Master P&L Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-10 rounded-[3rem] text-white shadow-2xl mb-12 relative overflow-hidden border border-white/20">
           <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-2xl -ml-20 -mb-20"></div>
           
           <div className="relative z-10">
              <p className="text-white/60 font-black uppercase tracking-[0.25em] text-[10px] mb-4">Total Net Earnings (YTD)</p>
              <div className="flex items-baseline gap-3">
                 <h2 className="text-7xl font-black italic tracking-tighter">KSh {netProfit.toLocaleString()}</h2>
                 <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${netProfit >= 0 ? 'bg-black/20 text-green-300' : 'bg-black/20 text-red-300'}`}>
                    {netProfit >= 0 ? '↑ PROFIT' : '↓ LOSS'}
                 </span>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mt-12 pt-12 border-t border-white/10">
                 <div className="group">
                    <p className="text-[10px] font-black uppercase text-indigo-200/50 mb-2 tracking-widest flex items-center gap-2">
                       <span className="w-2 h-0.5 bg-green-400"></span>
                       Gross Revenue
                    </p>
                    <p className="text-3xl font-black tracking-tight group-hover:text-green-300 transition-colors">KSh {totalRevenue.toLocaleString()}</p>
                 </div>
                 <div className="group">
                    <p className="text-[10px] font-black uppercase text-indigo-200/50 mb-2 tracking-widest flex items-center gap-2">
                       <span className="w-2 h-0.5 bg-red-400"></span>
                       Supply Costs
                    </p>
                    <p className="text-3xl font-black tracking-tight group-hover:text-red-300 transition-colors">KSh {totalExpenses.toLocaleString()}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
           {/* Revenue Stream */}
           <section>
              <div className="flex items-center justify-between mb-8 px-2">
                 <h3 className="text-lg font-black text-white italic tracking-tight flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 text-sm">📈</div>
                    Sales Performance
                 </h3>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{revenue.length} Entries</span>
              </div>
              
              <div className="space-y-4">
                 {revenue.length === 0 && (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-[2rem] p-12 text-center animate-pulse">
                       <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No settled sales detected.</p>
                    </div>
                 )}
                 {revenue.map((day, idx) => (
                    <div key={idx} className="group bg-white/[0.03] hover:bg-white/[0.06] p-6 rounded-[2rem] border border-white/5 flex justify-between items-center transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-lg font-black text-white/20 group-hover:text-indigo-500 transition-colors">
                             {new Date(day.sale_date).getDate()}
                          </div>
                          <div>
                             <p className="font-black text-white tracking-tight">{new Date(day.sale_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{day.order_count} Validated Transactions</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-black text-green-400 italic font-mono">+ {parseFloat(day.total_revenue).toLocaleString()}</p>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Net Revenue</p>
                       </div>
                    </div>
                 ))}
              </div>
           </section>

           {/* Cost Stream */}
           <section>
              <div className="flex items-center justify-between mb-8 px-2">
                 <h3 className="text-lg font-black text-white italic tracking-tight flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 text-sm">📉</div>
                    Supply & Logistics
                 </h3>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{expenses.length} Batches</span>
              </div>
              
              <div className="space-y-4">
                 {expenses.length === 0 && (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-[2rem] p-12 text-center animate-pulse text-slate-500">
                       <p className="text-xs font-bold uppercase tracking-widest">No supply costs recorded.</p>
                    </div>
                 )}
                 {expenses.map((day, idx) => (
                    <div key={idx} className="group bg-white/[0.03] hover:bg-white/[0.06] p-6 rounded-[2rem] border border-white/5 flex justify-between items-center transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-lg font-black text-white/20 group-hover:text-red-500 transition-colors">
                             {new Date(day.expense_date).getDate()}
                          </div>
                          <div>
                             <p className="font-black text-white tracking-tight">{new Date(day.expense_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{day.wholesale_order_count} Wholesale Batches</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-black text-red-400 italic font-mono">- {parseFloat(day.total_spent).toLocaleString()}</p>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Inventory Cost</p>
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
