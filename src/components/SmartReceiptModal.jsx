import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

export default function SmartReceiptModal({ shopName, table, items, total, discountAmount, couponCode, orderId, isOffline, onClose, onShareImage, onShareText, isFree }) {
  const receiptRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const shortId = orderId ? orderId.split("-")[0].toUpperCase() : "N/A";
  const date = new Date().toLocaleString();
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleShareImage = async () => {
    setGenerating(true);
    try {
      if (receiptRef.current) {
        const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: "#ffffff" });
        const dataUrl = canvas.toDataURL("image/png");
        onShareImage(dataUrl);
      }
    } catch (err) {
      console.error("Failed to generate receipt image", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4">
      {/* Hidden Receipt Node for html2canvas to screenshot */}
      <div 
         ref={receiptRef} 
         className="absolute top-[-9999px] left-[-9999px] bg-white w-[380px] p-8"
         style={{ fontFamily: "monospace" }}
      >
        <div className="text-center mb-6">
           <h1 className="text-3xl font-black mb-1">{shopName}</h1>
           <p className="text-gray-600 text-sm border-b-2 border-dashed border-gray-300 pb-4">
              Receipt #{shortId}<br/>
              Table: {table}<br/>
              {date}
           </p>
        </div>
        
        <div className="space-y-3 mb-6">
           {items.map(item => (
              <div key={item.id} className="flex justify-between text-base">
                 <span>{item.quantity}x {item.name}</span>
                 <span>KSh {item.price * item.quantity}</span>
              </div>
           ))}
        </div>

        <div className="border-t-2 border-dashed border-gray-300 pt-4 space-y-2 mb-6">
           <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>KSh {subtotal}</span>
           </div>
           {discountAmount > 0 && (
             <div className="flex justify-between text-gray-800 font-bold">
               <span>Discount ({couponCode})</span>
               <span>- KSh {discountAmount}</span>
             </div>
           )}
           <div className="flex justify-between text-xl font-black pt-2">
              <span>TOTAL</span>
              <span>KSh {total}</span>
           </div>
        </div>

        <div className="text-center font-bold text-sm bg-gray-100 p-3 rounded">
           {isOffline ? "📥 OFFLINE / PAY AT DESK" : "💳 AWAITING PAYMENT"}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">Powered by Savannah OS</p>
      </div>

      {/* Actual User Facing Modal */}
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="text-center mb-6">
           <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
           <h2 className="text-2xl font-bold text-gray-900">Order Placed!</h2>
           <p className="text-gray-500 text-sm mt-1">Ticket: #{shortId}</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
           <h3 className="font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-2">Send Order to Kitchen</h3>
           <p className="text-sm text-gray-600 mb-4">You must notify the shop via WhatsApp. How would you like to send the receipt?</p>
           
           <div className="space-y-3">
              <button 
                 onClick={handleShareImage}
                 disabled={generating}
                 className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                 {generating ? "Generating Image..." : <>🖼️ Share Smart Image</>}
              </button>

              <button 
                 onClick={onShareText}
                 className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                 {isFree ? "🔒 Pro: Send Text Receipt" : "💬 Send Text Receipt"}
              </button>
           </div>
        </div>
        
        <button onClick={onClose} className="w-full text-center text-gray-500 font-medium hover:text-gray-800 transition">
           Skip this step
        </button>
      </div>
    </div>
  );
}
