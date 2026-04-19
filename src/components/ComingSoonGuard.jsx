import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * A soft, user-friendly overlay that locks a feature area
 * while still letting the user see what's underneath it (privacy blur).
 */
export default function ComingSoonGuard({ children, title = "Under Construction", message = "This feature is currently being built in private. Check back soon for the full launch!" }) {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden">
      {/* Underlying Content (Blurred out) */}
      <div className="pointer-events-none select-none filter blur-sm opacity-60">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm text-center border border-gray-100 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            🔒
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-3">{title}</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            {message}
          </p>
          <div className="space-y-3">
             <button 
               onClick={() => navigate('/dashboard')}
               className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-gray-800 transition"
             >
               Return to Dashboard
             </button>
             <button 
               onClick={() => navigate('/')}
               className="w-full bg-gray-50 text-gray-600 font-bold py-3.5 rounded-xl text-sm hover:bg-gray-100 transition"
             >
               Go Home
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
