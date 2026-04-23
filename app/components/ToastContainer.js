'use client';
import { useEffect, useState } from 'react';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { ...e.detail, id }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3500);
    };
    window.addEventListener('fideloo:toast', handler);
    return () => window.removeEventListener('fideloo:toast', handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-2xl shadow-xl text-white font-medium text-sm max-w-xs animate-toast-in ${
            toast.type === 'error'
              ? 'bg-red-500'
              : toast.type === 'warning'
              ? 'bg-amber-500'
              : 'bg-green-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'error' ? (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : toast.type === 'warning' ? (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      ))}
    </div>
  );
}
