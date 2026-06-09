import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase-client';

export default function LogicAuditorDashboard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // We fetch a specific shop for demo purposes if the user is a shop owner.
  // For the Master Admin, we'd pick a target shop.
  const [targetShopId, setTargetShopId] = useState('');

  useEffect(() => {
    // Automatically fetch the first available shop for testing purposes if none set
    async function fetchDefaultShop() {
      const { data: shops } = await supabase.from('shops').select('id').limit(1);
      if (shops && shops.length > 0) {
        setTargetShopId(shops[0].id);
      }
    }
    fetchDefaultShop();
  }, []);

  const runAudit = async () => {
    if (!targetShopId) return;
    setLoading(true);
    setError(null);
    try {
      // Mocking past 60 days
      const d = new Date();
      const endDate = d.toISOString();
      d.setDate(d.getDate() - 60);
      const startDate = d.toISOString();

      const { data: responseData, error: invokeError } = await supabase.functions.invoke('logic-auditor', {
        body: { shopId: targetShopId, startDate, endDate }
      });

      if (invokeError) throw new Error(invokeError.message);
      setData(responseData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="z-10">
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
              Discrete Logic Auditor
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Systematic structural integrity & temporal analysis</p>
          </div>
          <div className="z-10 mt-4 md:mt-0 flex gap-4">
            <input 
              type="text" 
              placeholder="Target Shop ID" 
              value={targetShopId}
              onChange={(e) => setTargetShopId(e.target.value)}
              className="bg-gray-900 border border-gray-600 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button 
              onClick={runAudit}
              disabled={loading || !targetShopId}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              {loading ? 'Executing Engine...' : 'Run Diagnostics'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-lg animate-pulse">
            <h3 className="text-red-400 font-bold flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Engine Execution Failed
            </h3>
            <p className="text-red-200 mt-1 font-mono">{error}</p>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
            
            {/* System Integrity Widget */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl hover:border-gray-500 transition-colors">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${data.structuralSafety === "SECURE" ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`}></div>
                System Integrity Seal
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-900 rounded-xl">
                  <span className="text-gray-400">Formal Verification Status</span>
                  <span className={`font-mono font-bold ${data.structuralSafety === "SECURE" ? 'text-green-400' : 'text-red-400'}`}>
                    {data.structuralSafety}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-900 rounded-xl">
                  <span className="text-gray-400">Asymptotic Complexity</span>
                  <span className="font-mono text-blue-400">O(n log n)</span>
                </div>
              </div>
            </div>

            {/* Stochastic Risk Widget */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl hover:border-gray-500 transition-colors">
              <h2 className="text-2xl font-bold text-white mb-6">Stochastic VIP Risk</h2>
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-gray-400 mb-1">Items at risk of decay</p>
                    <p className="text-4xl font-extrabold text-orange-400">
                      {data.stochasticRiskProbabilities?.length || 0}
                    </p>
                  </div>
                  <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                
                {data.stochasticRiskProbabilities && data.stochasticRiskProbabilities.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {data.stochasticRiskProbabilities.map((risk, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="font-mono text-sm text-gray-300">{risk.item}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500" style={{ width: `${risk.probabilityOfDecay * 100}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-orange-400">{(risk.probabilityOfDecay * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fallacy Console */}
            <div className="lg:col-span-2 bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6">Fallacy & Tautology Matrix</h2>
              
              {data.humanLogicFallacies && data.humanLogicFallacies.length > 0 ? (
                <div className="space-y-4">
                  {data.humanLogicFallacies.map((fallacy, idx) => (
                    <div key={idx} className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl flex items-start gap-4">
                      <div className="bg-red-500/20 p-2 rounded-lg text-red-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <h4 className="text-red-300 font-bold mb-1">Human Strategy Error Detected</h4>
                        <p className="text-gray-400 font-mono text-sm">{fallacy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-gray-700 rounded-xl text-center">
                  <p className="text-green-500 font-mono font-bold">No Logical Fallacies Detected</p>
                  <p className="text-gray-500 text-sm mt-2">The system topology is logically sound.</p>
                </div>
              )}

              {/* Tautology Violations */}
              {data.tautologyViolations && data.tautologyViolations.length > 0 && (
                <div className="mt-6 space-y-4">
                  {data.tautologyViolations.map((violation, idx) => (
                    <div key={idx} className="p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-xl flex items-start gap-4">
                      <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </div>
                      <div>
                        <h4 className="text-yellow-300 font-bold mb-1">Tautology Violation</h4>
                        <p className="text-gray-400 font-mono text-sm">{violation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resolution Engine Raw JSON */}
            <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-inner">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Raw Matrix Vector (JSON)</h3>
              <div className="bg-black p-4 rounded-lg overflow-auto max-h-96 custom-scrollbar">
                <pre className="text-xs text-green-400 font-mono">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>

          </div>
        )}
      </div>
      
      {/* Custom styles for animations and scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}} />
    </div>
  );
}
