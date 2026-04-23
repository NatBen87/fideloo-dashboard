'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function CardPage() {
  const { customerId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/customers/card/${customerId}`).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`${API}/notifications/customer/${customerId}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ])
      .then(([card, notifs]) => {
        setData(card);
        setNotifications(Array.isArray(notifs) ? notifs : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [customerId]);

  async function markRead() {
    try {
      await fetch(`${API}/notifications/customer/${customerId}/mark-read`, { method: 'POST' });
      setNotifications([]);
    } catch {}
  }

  function toggleNotifs() {
    if (!showNotifs && notifications.length > 0) markRead();
    setShowNotifs(v => !v);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="font-bold text-gray-800 text-lg">Carte introuvable</p>
          <p className="text-gray-400 text-sm mt-2">Ce lien n'est pas valide ou a expiré.</p>
        </div>
      </div>
    );
  }

  const merchant = data.merchant || {};
  const threshold = merchant.reward_threshold || 10;
  const progress = Math.min((data.points / threshold) * 100, 100);
  const rewardReady = data.points >= threshold;
  const primaryColor = merchant.primary_color || '#F59E0B';
  const unreadCount = notifications.length;

  const tiers = Array.isArray(merchant.reward_tiers) && merchant.reward_tiers.length > 0
    ? [...merchant.reward_tiers].sort((a, b) => a.points - b.points)
    : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: `${primaryColor}18` }}>
      <div className="w-full max-w-sm space-y-4">

        {/* Notification bell */}
        {unreadCount > 0 && (
          <button
            onClick={toggleNotifs}
            className="w-full flex items-center gap-3 bg-white rounded-2xl border border-amber-100 shadow-sm px-5 py-4 hover:bg-amber-50 transition-colors"
          >
            <div className="relative">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {unreadCount}
              </span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-800 text-sm">{unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} notification{unreadCount > 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-400">de {merchant.business_name}</p>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showNotifs ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {showNotifs && notifications.length === 0 && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            {notifications.map((n, i) => (
              <div key={n.id || i} className={`px-5 py-4 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <p className="font-semibold text-gray-800 text-sm">{n.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1.5">{new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
              </div>
            ))}
          </div>
        )}

        {/* Wallet card */}
        <div
          className="rounded-3xl p-7 text-white shadow-xl relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)` }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Carte fidélité</p>
                <p className="text-2xl font-bold leading-tight">{merchant.business_name || 'Commerce'}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 backdrop-blur-sm">
                {merchant.business_name?.charAt(0) || '?'}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs opacity-70 mb-0.5">Client</p>
              <p className="text-xl font-bold">{data.name}</p>
            </div>

            <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-xs opacity-70">Points fidélité</p>
                  <p className="text-4xl font-black">{data.points}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-70">Objectif</p>
                  <p className="text-xl font-bold">{threshold} pts</p>
                </div>
              </div>
              <div className="w-full bg-white/25 rounded-full h-3">
                <div
                  className="bg-white h-3 rounded-full progress-bar shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs opacity-70 mt-2 text-right">
                {rewardReady ? '🎉 Récompense disponible !' : `${threshold - data.points} point${threshold - data.points > 1 ? 's' : ''} pour la prochaine récompense`}
              </p>
            </div>
          </div>
        </div>

        {/* Reward info */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Récompense</p>
              <p className="text-sm font-semibold text-gray-800">
                {threshold} points = {merchant.reward_description || '1 récompense offerte'}
              </p>
            </div>
          </div>

          {tiers && tiers.length > 1 && (
            <div className="border-t border-gray-50 pt-3 space-y-2">
              {tiers.map((t, i) => (
                <div key={i} className={`flex items-center justify-between text-sm ${data.points >= t.points ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                  <span>{t.points} pts</span>
                  <div className="flex items-center gap-1">
                    {data.points >= t.points && <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    <span>{t.reward}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rewardReady && (
            <div className="mt-3 pt-3 border-t border-amber-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
              <p className="text-sm font-semibold text-green-700">
                Récompense disponible — présentez cette page au commerce !
              </p>
            </div>
          )}
        </div>

        {/* Referral */}
        {data.referral_code && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
            <p className="font-bold text-gray-800 text-sm mb-1">Parrainez vos amis</p>
            <p className="text-xs text-gray-400 mb-3">+3 points offerts à vous et votre ami pour chaque parrainage.</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${data.merchant_id}?ref=${data.referral_code}`}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 truncate focus:outline-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${data.merchant_id}?ref=${data.referral_code}`)}
                className="flex-shrink-0 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl text-xs font-bold transition-colors"
              >
                Copier
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-2">Présentez cette page à chaque visite · Fideloo</p>
      </div>
    </div>
  );
}
