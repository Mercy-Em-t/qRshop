import { Suspense } from 'react';

export default function LazyRoute({ children }) {
  return (
    <Suspense fallback={
      <div role="status" aria-live="polite" className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full"></div>
        <span className="sr-only">Loading...</span>
      </div>
    }>
      {children}
    </Suspense>
  );
}
