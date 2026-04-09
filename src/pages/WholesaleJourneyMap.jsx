import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function WholesaleJourneyMap() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "friction",
      title: "Manual Bottleneck",
      description: "Client (Mercyy): 'Do you have a catalogue?' | Agent (Atuls): 'No, check our page then inbox...'",
      problem: "Generic, reactive responses cause client drop-off and lost revenue.",
      icon: "🐌",
      color: "border-red-500 text-red-400"
    },
    {
      id: "catalog",
      title: "Systemic Discovery",
      description: "The system intercepts the inquiry and delivers a structured catalogue with prices and MOQs.",
      solution: "Empowers the client with immediate data, removing the need for 1-by-1 questions.",
      icon: "⚡",
      color: "border-blue-500 text-blue-400"
    },
    {
      id: "propel",
      title: "Agent-Propelled Cart",
      description: "Agent sees the client's interest and pre-fills the cart. 'I've added the cotton yarns you requested.'",
      solution: "Proactive sales support shifts the burden of effort from client to system.",
      icon: "🏎️",
      color: "border-green-500 text-green-400"
    },
    {
       id: "sync",
       title: "Unified Fulfillment",
       description: "One-click checkout via MPesa. Stock updates and logs are instantly synced with Master Admin.",
       solution: "Full visibility for business owners; seamless experience for clients.",
       icon: "🤝",
       color: "border-indigo-500 text-indigo-400"
     }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono p-12">
      <header className="mb-16 border-b border-white/10 pb-8 flex justify-between items-end">
        <div>
          <Link to="/developer/portal" className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition tracking-[0.3em] mb-4 block">
            &lt;/ Back to Hub
          </Link>
          <h1 className="text-5xl font-black uppercase tracking-tighter">Wholesale Interaction Map</h1>
          <p className="text-gray-500 mt-2">Visualizing the transformation of sales friction into structured growth.</p>
        </div>
        <div className="text-right">
           <div className="text-[10px] font-black uppercase tracking-widest text-[#00FF41]">Live Scenario Engine</div>
           <div className="text-2xl font-black text-white">MODE: INTERACTIVE</div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-20">
        
        {/* Left: Step Navigation */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(index)}
              className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${activeStep === index ? `${step.color} bg-white/5` : 'border-white/5 text-gray-600 hover:border-white/20'}`}
            >
              <span className="text-2xl">{step.icon}</span>
              <div>
                <h3 className="font-black uppercase text-xs tracking-widest">{step.title}</h3>
                <p className="text-[11px] mt-1 opacity-60 line-clamp-1">{step.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Visual Flow */}
        <div className="relative bg-gray-900/30 border border-white/5 rounded-[3rem] p-12 overflow-hidden">
           <div className="absolute top-0 right-0 p-8">
              <span className="text-[10px] font-black uppercase text-gray-700">Sequence: {activeStep + 1} / {steps.length}</span>
           </div>

           <div className="h-full flex flex-col justify-center items-center text-center">
              <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-5xl mb-8 animate-in zoom-in-50 duration-500 ${steps[activeStep].color}`}>
                 {steps[activeStep].icon}
              </div>
              
              <h2 className="text-3xl font-black uppercase mb-4 tracking-tight">{steps[activeStep].title}</h2>
              <p className="text-xl text-gray-400 mb-8 max-w-lg leading-relaxed">{steps[activeStep].description}</p>
              
              <div className={`p-6 bg-white/5 rounded-2xl border-l-4 max-w-md ${steps[activeStep].color}`}>
                 <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">Impact Protocol</div>
                 <div className="text-sm font-bold italic">"{steps[activeStep].problem || steps[activeStep].solution}"</div>
              </div>

              {/* Interaction Connection Visual */}
              <div className="mt-12 flex gap-4">
                 {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 w-12 rounded-full transition-all duration-500 ${i <= activeStep ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-gray-800'}`}></div>
                 ))}
              </div>
              
              <div className="mt-12">
                 <Link 
                   to="/developer/wholesale" 
                   className="inline-block bg-white text-black px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition shadow-xl"
                 >
                    Launch Wholesale Engine &gt;
                 </Link>
              </div>
           </div>
        </div>
      </div>

      <footer className="mt-20 border-t border-white/5 pt-10 flex justify-between items-center opacity-30 text-[10px] font-black uppercase tracking-widest">
         <div>Registry: wholesale-journey-map-v1</div>
         <div className="flex gap-8">
            <span>Lat: -1.2921°</span>
            <span>Lng: 36.8219°</span>
            <span className="animate-pulse">Active Node</span>
         </div>
      </footer>
    </div>
  );
}
