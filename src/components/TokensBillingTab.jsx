import { useState, useEffect } from "react";
import { getBillingDetails, requestOkoaJahazi, getTokenTransactions } from "../services/billing-service";

export default function TokensBillingTab({ shopId, shop }) {
  const [billing, setBilling] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingOkoa, setRequestingOkoa] = useState(false);
  const [okoaAmount, setOkoaAmount] = useState(100);

  useEffect(() => {
    if (!shopId) return;
    fetchData();
  }, [shopId]);

  const fetchData = async () => {
    setLoading(true);
    const [bData, tData] = await Promise.all([
      getBillingDetails(shopId),
      getTokenTransactions(shopId)
    ]);
    setBilling(bData);
    setTransactions(tData);
    setLoading(false);
  };

  const handleOkoaRequest = async () => {
    if (!okoaAmount || okoaAmount <= 0) return;
    setRequestingOkoa(true);
    const result = await requestOkoaJahazi(shopId, okoaAmount);
    if (result.success) {
      alert(`Okoa Jahazi Successful! Received ${result.net_tokens} tokens.`);
      fetchData(); // refresh
    } else {
      alert(`Okoa Jahazi Failed: ${result.message}`);
    }
    setRequestingOkoa(false);
  };

  if (loading) return <div className="animate-pulse p-10 text-center text-slate-500 font-bold">Loading Billing Details...</div>;

  const isOkoaDisabled = billing.okoa_jahazi_owed > 0 || billing.token_balance > 50 || requestingOkoa;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Token Balance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Available Tokens</h2>
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">🪙</div>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-900">{billing.token_balance.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-2">Tokens are used for AI Agent actions and premium features.</p>
          </div>
          <button onClick={() => window.open(`https://wa.me/254700000000?text=Hi, I need to buy more tokens for my shop: ${shop?.name}`, "_blank")} className="mt-6 w-full bg-indigo-600 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-indigo-700 transition">
            Top Up Tokens
          </button>
        </div>

        {/* Okoa Jahazi */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-sm font-black text-amber-600 uppercase tracking-widest">Okoa Jahazi (Credit)</h2>
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">🆘</div>
          </div>
          <div>
            {billing.okoa_jahazi_owed > 0 ? (
              <>
                 <p className="text-4xl font-black text-red-600">{billing.okoa_jahazi_owed.toLocaleString()}</p>
                 <p className="text-xs text-red-500 mt-2 font-bold">Outstanding Okoa Balance. Must be cleared before next request.</p>
              </>
            ) : (
               <>
                 <p className="text-4xl font-black text-slate-900">{billing.okoa_jahazi_limit.toLocaleString()}</p>
                 <p className="text-xs text-slate-500 mt-2">Maximum token advance available. (10% processing fee applies)</p>
               </>
            )}
          </div>
          
          <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
             {billing.okoa_jahazi_owed === 0 && (
               <div className="flex items-center gap-2">
                 <input 
                   type="number" 
                   value={okoaAmount} 
                   onChange={e => setOkoaAmount(Number(e.target.value))}
                   max={billing.okoa_jahazi_limit}
                   className="flex-1 bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg outline-none"
                 />
                 <button 
                   onClick={handleOkoaRequest}
                   disabled={isOkoaDisabled}
                   className="bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
                 >
                   {requestingOkoa ? 'Processing...' : 'Request Okoa'}
                 </button>
               </div>
             )}
             {billing.token_balance > 50 && billing.okoa_jahazi_owed === 0 && (
                <p className="text-[10px] text-slate-400 font-bold">Okoa Jahazi is only available when balance is below 50 tokens.</p>
             )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
           <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-slate-100">
           {transactions.length === 0 ? (
              <p className="p-5 text-center text-xs text-slate-500">No token transactions yet.</p>
           ) : (
              transactions.map(tx => (
                <div key={tx.id} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50 transition">
                   <div>
                     <p className="font-bold text-slate-800 capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                     <p className="text-xs text-slate-400">{tx.description} • {new Date(tx.created_at).toLocaleString()}</p>
                   </div>
                   <div className={`font-black ${tx.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                     {tx.amount > 0 ? '+' : ''}{tx.amount}
                   </div>
                </div>
              ))
           )}
        </div>
      </div>
    </div>
  );
}
