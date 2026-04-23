'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function CardPage() {
  const { customerId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API}/customers/card/${customerId}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [customerId]);

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

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-4">

        {/* Loyalty card visual */}
        <div
          className="rounded-3xl p-7 text-white shadow-lg"
          style={{ background: merchant.primary_color || '#F59E0B' }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">
                Carte fidélité
              </p>
              <p className="text-2xl font-bold leading-tight">
                {merchant.business_name || 'Commerce'}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0">
              {merchant.business_name?.charAt(0) || '?'}
            </div>
          </div>

          <div className="mb-5">
            <p className="text-xs opacity-70 mb-0.5">Client</p>
            <p className="text-lg font-semibold">{data.name}</p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="opacity-70">Points fidélité</span>
              <span className="font-bold">{data.points} / {threshold}</span>
            </div>
            <div className="w-full bg-white/25 rounded-full h-2.5">
              <div
                className="bg-white h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Reward info card */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

          {rewardReady && (
            <div className="mt-3 pt-3 border-t border-amber-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
              <p className="text-sm font-semibold text-green-700">
                Récompense disponible — présentez cette page au commerce !
              </p>
            </div>
          )}
        </div>

        {/* Remaining points info */}
        {!rewardReady && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm px-5 py-4">
            <p className="text-sm text-gray-500 text-center">
              Encore <span className="font-bold text-amber-600">{threshold - data.points} point{threshold - data.points > 1 ? 's' : ''}</span> pour votre prochaine récompense
            </p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-2">
          Présentez cette page à chaque visite · Fideloo
        </p>
      </div>
    </div>
  );
}
