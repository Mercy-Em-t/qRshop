import { useRegisterSW } from 'virtual:pwa-register/react'

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  // Only render if we need to refresh or if we are ready offline
  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-[1000] p-4 flex flex-col gap-3 bg-white border border-gray-100 shadow-2xl rounded-2xl animate-in slide-in-from-bottom-5 duration-500 max-w-[320px]">
      <div className="flex items-start gap-3">
        <div className="bg-green-100 p-2 rounded-xl text-xl">
           {offlineReady ? '🚀' : '✨'}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">
            {offlineReady ? 'App is ready for offline use!' : 'New Update Available!'}
          </p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {offlineReady 
              ? 'You can now access your shop menu even without an internet connection.' 
              : 'I have added some new features and optimizations. Update now to keep things smooth.'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-1">
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="flex-1 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200"
          >
            Update Now
          </button>
        )}
        <button
          onClick={() => close()}
          className="flex-1 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-gray-100 transition"
        >
          {offlineReady ? 'Awesome' : 'Later'}
        </button>
      </div>
    </div>
  )
}
