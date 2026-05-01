import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import * as XLSX from 'xlsx';

export default function ShopFinances() {
  const [revenue, setRevenue] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30"); // '7', '30', '90', '180'
  const [viewMode, setViewMode] = useState("daily"); // 'daily' or 'weekly'
  
  const user = getCurrentUser();
  const shopId = user?.shop_id;

  useEffect(() => {
    if (shopId) fetchData();
  }, [shopId]);

  const fetchData = async () => {
    setLoading(true);
    const [revRes, expRes] = await Promise.all([
      supabase.from('shop_daily_revenue').select('*').eq('shop_id', shopId).order('sale_date', { ascending: true }),
      supabase.from('shop_daily_expenses').select('*').eq('shop_id', shopId).order('expense_date', { ascending: true })
    ]);
    
    if (revRes.data) setRevenue(revRes.data);
    if (expRes.data) setExpenses(expRes.data);
    setLoading(false);
  };

  // 1. FILTER DATA BY RANGE
  const filteredData = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
    
    const filteredRev = revenue.filter(r => new Date(r.sale_date) >= cutoffDate);
    const filteredExp = expenses.filter(e => new Date(e.expense_date) >= cutoffDate);
    
    return { revenue: filteredRev, expenses: filteredExp };
  }, [revenue, expenses, timeRange]);

  // 2. PREPARE CHART DATA (MERGED)
  const chartData = useMemo(() => {
    const dataMap = {};
    
    filteredData.revenue.forEach(r => {
      const date = r.sale_date;
      dataMap[date] = { ...dataMap[date], date, revenue: parseFloat(r.total_revenue) };
    });
    
    filteredData.expenses.forEach(e => {
      const date = e.expense_date;
      dataMap[date] = { ...dataMap[date], date, expenses: parseFloat(e.total_spent) };
    });
    
    const sorted = Object.values(dataMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (viewMode === "weekly") {
      // Group by week
      const weekly = [];
      let currentWeek = null;
      
      sorted.forEach(day => {
        const d = new Date(day.date);
        const weekNum = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
        
        if (!currentWeek || currentWeek.weekNum !== weekNum) {
          currentWeek = { 
            date: `Week of ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
            weekNum,
            revenue: 0,
            expenses: 0
          };
          weekly.push(currentWeek);
        }
        currentWeek.revenue += day.revenue || 0;
        currentWeek.expenses += day.expenses || 0;
      });
      return weekly;
    }
    
    return sorted;
  }, [filteredData, viewMode]);

  const totalRevenue = filteredData.revenue.reduce((sum, day) => sum + parseFloat(day.total_revenue), 0);
  const totalExpenses = filteredData.expenses.reduce((sum, day) => sum + parseFloat(day.total_spent), 0);
  const netProfit = totalRevenue - totalExpenses;

  const handleExport = () => {
    const workbook = XLSX.utils.book_new();
    
    const revData = filteredData.revenue.map(r => ({
      Date: r.sale_date,
      Revenue: parseFloat(r.total_revenue),
      Orders: r.order_count
    }));
    
    const expData = filteredData.expenses.map(e => ({
      Date: e.expense_date,
      Expenses: parseFloat(e.total_spent),
      'Wholesale Orders': e.wholesale_order_count
    }));
    
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(revData), "Revenue");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(expData), "Expenses");
    
    XLSX.writeFile(workbook, `Shop_Statement_${timeRange}days.xlsx`);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center px-4">
      <div className="relative mb-8">
        <div className="w-20 h-20 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">💰</div>
      </div>
      <p className="text-white font-black uppercase tracking-[0.4em] text-[12px] mb-2">Syncing Financial Core</p>
      <p className="text-indigo-400/40 text-[10px] font-bold uppercase tracking-widest">Compiling Transactional Ledger...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 selection:bg-indigo-500/30">
      <header className="bg-slate-900/50 backdrop-blur-3xl border-b border-white/5 p-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
             <Link to="/a" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 group">
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
             </Link>
             <div>
                <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                   <span className="text-indigo-500">💰</span> Accounting Hub
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                   <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.2em]">Node-Live / {user.shop_name}</p>
                </div>
             </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
             <button onClick={handleExport} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Export Statement
             </button>
             <button onClick={fetchData} className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-10 bg-white/5 p-4 rounded-[2.5rem] border border-white/5">
           <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/5">
              {[
                { label: '7D', value: '7' },
                { label: '30D', value: '30' },
                { label: '90D', value: '90' },
                { label: '6M', value: '180' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTimeRange(opt.value)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${timeRange === opt.value ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  {opt.label}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grouping:</span>
              <button 
                onClick={() => setViewMode(viewMode === 'daily' ? 'weekly' : 'daily')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${viewMode === 'weekly' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/10'}`}
              >
                {viewMode.toUpperCase()} VIEW
              </button>
           </div>
        </div>

        {/* Master Performance Card */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
           <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 via-indigo-950 to-black p-10 rounded-[3rem] border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-20 -mt-20 group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                       <p className="text-indigo-400 font-black uppercase tracking-[0.25em] text-[10px] mb-2">Portfolio Growth Dynamics</p>
                       <h2 className="text-5xl font-black italic tracking-tighter text-white">KSh {netProfit.toLocaleString()}</h2>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl font-black text-xs ${netProfit >= 0 ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                       {netProfit >= 0 ? '↑ SURPLUS' : '↓ DEFICIT'}
                    </div>
                 </div>

                 <div className="flex-grow mt-4 h-[240px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                       <AreaChart data={chartData}>
                          <defs>
                             <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                             </linearGradient>
                             <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis 
                             dataKey="date" 
                             hide 
                          />
                          <YAxis hide />
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px', fontWeight: '900' }}
                             itemStyle={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                          <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-8">
              <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] flex-grow flex flex-col justify-center">
                 <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Gross Inflow
                 </p>
                 <p className="text-4xl font-black text-white tracking-tighter">KSh {totalRevenue.toLocaleString()}</p>
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2">{filteredData.revenue.length} Active Sales Nodes</p>
              </div>
              <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] flex-grow flex flex-col justify-center">
                 <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    Capital Outflow
                 </p>
                 <p className="text-4xl font-black text-white tracking-tighter">KSh {totalExpenses.toLocaleString()}</p>
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2">{filteredData.expenses.length} Supply Batches</p>
              </div>
           </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mt-20">
           {/* Revenue Stream */}
           <section>
              <div className="flex items-center justify-between mb-8 px-2">
                 <h3 className="text-lg font-black text-white italic tracking-tight flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                    </div>
                    Inflow Log
                 </h3>
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Filtered / {filteredData.revenue.length}</span>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                 {filteredData.revenue.length === 0 && (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-16 text-center text-slate-600">
                       <p className="text-[10px] font-black uppercase tracking-widest">No settled inflow in window.</p>
                    </div>
                 )}
                 {([...filteredData.revenue].reverse()).map((day, idx) => (
                    <div key={idx} className="group bg-white/[0.02] hover:bg-white/[0.05] p-7 rounded-[2.5rem] border border-white/5 flex justify-between items-center transition-all hover:scale-[1.02] active:scale-[0.98]">
                       <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-white/5 rounded-2xl flex flex-col items-center justify-center text-white/40 group-hover:bg-green-500 group-hover:text-white transition-all">
                             <span className="text-lg font-black">{new Date(day.sale_date).getDate()}</span>
                             <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">{new Date(day.sale_date).toLocaleDateString(undefined, { month: 'short' })}</span>
                          </div>
                          <div>
                             <p className="font-black text-white tracking-tight text-lg">Detailed Sync Node</p>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                                <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                                {day.order_count} Validated Transactions
                             </p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-2xl font-black text-green-400 italic">+{parseFloat(day.total_revenue).toLocaleString()}</p>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Net Value</p>
                       </div>
                    </div>
                 ))}
              </div>
           </section>

           {/* Cost Stream */}
           <section>
              <div className="flex items-center justify-between mb-8 px-2">
                 <h3 className="text-lg font-black text-white italic tracking-tight flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"/></svg>
                    </div>
                    Outflow Log
                 </h3>
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Filtered / {filteredData.expenses.length}</span>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                 {filteredData.expenses.length === 0 && (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-16 text-center text-slate-600">
                       <p className="text-[10px] font-black uppercase tracking-widest">No capital outflow in window.</p>
                    </div>
                 )}
                 {([...filteredData.expenses].reverse()).map((day, idx) => (
                    <div key={idx} className="group bg-white/[0.02] hover:bg-white/[0.05] p-7 rounded-[2.5rem] border border-white/5 flex justify-between items-center transition-all hover:scale-[1.02] active:scale-[0.98]">
                       <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-white/5 rounded-2xl flex flex-col items-center justify-center text-white/40 group-hover:bg-red-500 group-hover:text-white transition-all">
                             <span className="text-lg font-black">{new Date(day.expense_date).getDate()}</span>
                             <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">{new Date(day.expense_date).toLocaleDateString(undefined, { month: 'short' })}</span>
                          </div>
                          <div>
                             <p className="font-black text-white tracking-tight text-lg">Supply & Infrastructure</p>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                {day.wholesale_order_count} Wholesale Batches
                             </p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-2xl font-black text-red-400 italic">-{parseFloat(day.total_spent).toLocaleString()}</p>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Capital Burden</p>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
