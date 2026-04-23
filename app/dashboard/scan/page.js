'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, API } from '../../lib/api';

export default function ScanPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState(null);
  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [pointsToAdd, setPointsToAdd] = useState(1);
  const [addingPoints, setAddingPoints] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem('merchant');
    if (!d) { router.push('/'); return; }
    setMerchant(JSON.parse(d));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setCustomer(null);
    setSuccessMsg('');
    setActionError('');
    setHistory([]);
    setShowHistory(false);
    try {
      const res = await authFetch(`${API}/customers/find/${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setCustomer(data);
      } else {
        setSearchError(data.message || 'Client introuvable.');
      }
    } catch {
      setSearchError('Erreur de connexion au serveur.');
    } finally {
      setSearching(false);
    }
  }

  async function handleAddPoints() {
    if (!customer || !merchant) return;
    setAddingPoints(true);
    setSuccessMsg('');
    setActionError('');
    try {
      const res = await authFetch(`${API}/transactions`, {
        method: 'POST',
        body: JSON.stringify({ merchant_id: merchant.id, customer_id: customer.id, points: pointsToAdd }),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomer(data.customer);
        setSuccessMsg(`+${pointsToAdd} point${pointsToAdd > 1 ? 's' : ''} ajouté${pointsToAdd > 1 ? 's' : ''} !`);
        if (showHistory) await loadHistory(data.customer.id);
      } else {
        setActionError(data.message || "Erreur lors de l'ajout.");
      }
    } catch {
      setActionError('Erreur de connexion.');
    } finally {
      setAddingPoints(false);
    }
  }

  async function handleRedeem() {
    if (!customer) return;
    setRedeeming(true);
    setSuccessMsg('');
    setActionError('');
    try {
      const res = await authFetch(`${API}/customers/${customer.id}/redeem`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCustomer(data.customer);
        setSuccessMsg('Récompense utilisée ! Points déduits.');
        if (showHistory) await loadHistory(data.customer.id);
      } else {
        setActionError(data.message || 'Erreur lors de la rédemption.');
      }
    } catch {
      setActionError('Erreur de connexion.');
    } finally {
      setRedeeming(false);
    }
  }

  async function loadHistory(id) {
    setLoadingHistory(true);
    try {
      const res = await authFetch(`${API}/transactions/customer/${id || customer.id}`);
      if (res.ok) setHistory(await res.json());
    } catch {}
    finally { setLoadingHistory(false); }
  }

  async function toggleHistory() {
    if (!showHistory && history.length === 0) await loadHistory();
    setShowHistory(h => !h);
  }

  const threshold = merchant?.reward_threshold || 10;
  const progress = customer ? Math.min((customer.points / threshold) * 100, 100) : 0;
  const canRedeem = customer && customer.points >= threshold;

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
            <h1 className="text-xl font-bold text-gray-800">Scanner un client</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-800">Rechercher un client</h2>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Nom, email ou identifiant
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="marie@exemple.com ou Marie Dupont"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || searching}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {searching ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rechercher
              </>
            )}
          </button>
          {searchError && <p className="text-sm text-red-500 text-center">{searchError}</p>}
        </form>

        {customer && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-5">
            {/* Customer header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-xl flex-shrink-0">
                {customer.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-lg">{customer.name}</p>
                <p className="text-sm text-gray-400">{customer.email}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Points accumulés</span>
                <span className="font-bold text-amber-600">{customer.points} / {threshold} pts</span>
              </div>
              <div className="w-full bg-amber-100 rounded-full h-3">
                <div
                  className="bg-amber-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Feedback messages */}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm text-center font-medium">
                {successMsg}
              </div>
            )}
            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
                {actionError}
              </div>
            )}

            {/* Redeem reward */}
            {canRedeem && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800 font-semibold text-sm mb-1">Récompense disponible !</p>
                <p className="text-amber-600 text-xs mb-3">{merchant?.reward_description || 'Récompense offerte'}</p>
                <button
                  onClick={handleRedeem}
                  disabled={redeeming}
                  className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {redeeming ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      Utiliser la récompense
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Add points */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
                Points à ajouter
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPointsToAdd(n)}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm border transition-colors ${
                      pointsToAdd === n
                        ? 'bg-amber-400 border-amber-400 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-amber-300'
                    }`}
                  >
                    +{n}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddPoints}
                disabled={addingPoints}
                className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {addingPoints ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  `Ajouter ${pointsToAdd} point${pointsToAdd > 1 ? 's' : ''}`
                )}
              </button>
            </div>

            {/* Transaction history */}
            <button
              onClick={toggleHistory}
              className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-amber-600 transition-colors py-1 border-t border-gray-100 pt-4"
            >
              <span className="font-medium">Historique des visites</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showHistory && (
              <div>
                {loadingHistory ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun historique disponible.</p>
                ) : (
                  <ul className="space-y-3">
                    {history.map((t) => (
                      <li key={t.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-gray-700">
                            {t.points > 0 ? 'Visite' : 'Récompense utilisée'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(t.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </p>
                        </div>
                        <span className={`font-bold ${t.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {t.points > 0 ? '+' : ''}{t.points} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
