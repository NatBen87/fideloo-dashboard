'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, API } from '../../lib/api';

export default function TransactionsPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const d = localStorage.getItem('merchant');
    if (!d) { router.push('/'); return; }
    const m = JSON.parse(d);
    setMerchant(m);
    fetchTransactions(m.id);
  }, []);

  async function fetchTransactions(merchantId) {
    try {
      const res = await authFetch(`${API}/transactions/merchant/${merchantId}`);
      const data = await res.json();
      if (res.ok) {
        setTransactions(Array.isArray(data) ? data : []);
      } else {
        setError('Impossible de charger les transactions.');
      }
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  }

  const totalPoints = transactions.filter(t => t.points > 0).reduce((s, t) => s + t.points, 0);
  const totalRedemptions = transactions.filter(t => t.points < 0).length;

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white shadow-sm border-b border-amber-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-amber-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-xs text-amber-500 font-semibold uppercase tracking-widest">Fideloo</p>
            <h1 className="text-xl font-bold text-gray-800">Historique</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Summary stats */}
        {!loading && transactions.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 text-center">
              <p className="text-2xl font-bold text-amber-500">{transactions.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Transactions</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 text-center">
              <p className="text-2xl font-bold text-green-500">+{totalPoints}</p>
              <p className="text-xs text-gray-400 mt-0.5">Points donnés</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 text-center">
              <p className="text-2xl font-bold text-red-400">{totalRedemptions}</p>
              <p className="text-xs text-gray-400 mt-0.5">Récompenses</p>
            </div>
          </div>
        )}

        {/* Transaction list */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Toutes les transactions</h2>
            {!loading && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                {transactions.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Aucune transaction</p>
              <p className="text-gray-400 text-sm mt-1">Les transactions apparaîtront ici après la première visite</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <li key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-amber-50/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.points > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      {t.points > 0 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{t.customer_name}</p>
                      <p className="text-xs text-gray-400">
                        {t.points > 0 ? 'Visite' : 'Récompense utilisée'} ·{' '}
                        {new Date(t.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${t.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {t.points > 0 ? '+' : ''}{t.points} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
