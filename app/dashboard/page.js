'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, API } from '../lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ totalCustomers: 0, totalPoints: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    const merchantData = localStorage.getItem('merchant');
    if (!merchantData) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(merchantData);
    setMerchant(parsed);
    setJoinUrl(`${window.location.origin}/join/${parsed.id}`);
    fetchCustomers(parsed.id);
  }, []);

  async function fetchCustomers(merchantId) {
    try {
      const res = await authFetch(`${API}/customers/${merchantId}`);
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data) ? data : [];
        setCustomers(list);
        setStats({
          totalCustomers: list.length,
          totalPoints: list.reduce((sum, c) => sum + (c.points || 0), 0),
        });
      } else {
        setError('Impossible de charger les clients.');
      }
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  }

  async function copyJoinUrl() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    localStorage.removeItem('merchant');
    localStorage.removeItem('token');
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-700 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  const qrUrl = joinUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}&ecc=M&format=png`
    : null;

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-amber-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-500 font-semibold uppercase tracking-widest">Fideloo</p>
            <h1 className="text-xl font-bold text-gray-800">
              {merchant?.business_name || 'Mon Commerce'}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
            <p className="text-sm text-gray-500 mb-1">Clients fidèles</p>
            <p className="text-4xl font-bold text-amber-500">{stats.totalCustomers}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
            <p className="text-sm text-gray-500 mb-1">Points distribués</p>
            <p className="text-4xl font-bold text-amber-500">{stats.totalPoints}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/dashboard/scan')}
            className="bg-amber-400 hover:bg-amber-500 text-white rounded-2xl p-6 shadow-sm text-left transition-colors group"
          >
            <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-white/40 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5V16M4 6h4V4m0 2v2M4 6v2m0-2H2m18 0h-4V4m4 2v2m0-2h2" />
              </svg>
            </div>
            <p className="font-bold text-lg">Scanner</p>
            <p className="text-white/80 text-sm">Ajouter des points</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/settings')}
            className="bg-white hover:bg-gray-50 text-gray-700 rounded-2xl p-6 shadow-sm border border-amber-100 text-left transition-colors group"
          >
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-bold text-lg">Paramètres</p>
            <p className="text-gray-400 text-sm">Ma carte fidélité</p>
          </button>
        </div>

        {/* Transactions shortcut */}
        <button
          onClick={() => router.push('/dashboard/transactions')}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 rounded-2xl px-6 py-4 shadow-sm border border-amber-100 flex items-center gap-4 transition-colors group"
        >
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-gray-800">Historique</p>
            <p className="text-gray-400 text-sm">Toutes les transactions</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* QR Code / Share section */}
        {joinUrl && (
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">Partager ma carte fidélité</h2>
              <p className="text-xs text-gray-400 mt-0.5">Les clients scannent ce QR code pour s'inscrire</p>
            </div>

            <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
              {qrUrl && (
                <div className="flex-shrink-0 bg-white border border-gray-100 rounded-2xl p-3 shadow-inner">
                  <img
                    src={qrUrl}
                    alt="QR Code carte fidélité"
                    width={160}
                    height={160}
                    className="rounded-lg"
                  />
                </div>
              )}

              <div className="flex-1 space-y-3 w-full">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Lien d'inscription</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={joinUrl}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 truncate focus:outline-none"
                    />
                    <button
                      onClick={copyJoinUrl}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        copied
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                      }`}
                    >
                      {copied ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                </div>

                {qrUrl && (
                  <a
                    href={qrUrl}
                    download={`fideloo-qr-${merchant?.business_name || 'carte'}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-amber-400 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Télécharger le QR Code
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer List */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Mes clients</h2>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              {stats.totalCustomers} au total
            </span>
          </div>

          {customers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Aucun client encore</p>
              <p className="text-gray-400 text-sm mt-1">Partagez votre carte fidélité pour commencer</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {customers.map((customer) => (
                <li key={customer.id} className="px-6 py-4 flex items-center justify-between hover:bg-amber-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm">
                      {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{customer.name || 'Client anonyme'}</p>
                      <p className="text-xs text-gray-400">{customer.email || ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-500">{customer.points || 0} pts</p>
                    <p className="text-xs text-gray-400">points</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </main>
    </div>
  );
}
