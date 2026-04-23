'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function JoinPage() {
  const { merchantId } = useParams();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');

  const [merchant, setMerchant] = useState(null);
  const [step, setStep] = useState('loading');
  const [form, setForm] = useState({ name: '', email: '', birthday: '' });
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [referred, setReferred] = useState(false);

  useEffect(() => { fetchMerchant(); }, []);

  async function fetchMerchant() {
    try {
      const res = await fetch(`${API}/merchants/${merchantId}`);
      const data = await res.json();
      if (res.ok) {
        setMerchant(data);
        setStep('join');
      } else {
        setStep('error');
      }
    } catch {
      setStep('error');
    }
  }

  async function handleJoin() {
    if (!form.name.trim() || !form.email.trim()) return;
    setLoading(true);
    try {
      const body = {
        merchant_id: merchantId,
        name: form.name,
        email: form.email,
      };
      if (form.birthday) body.birthday = form.birthday;
      if (refCode) body.referral_code = refCode;

      const res = await fetch(`${API}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomer(data);
        setReferred(data.referred || false);
        setStep('success');
      } else if (res.status === 400 && data.customer) {
        setCustomer(data.customer);
        setStep('success');
      } else {
        alert(data.message || 'Une erreur est survenue.');
      }
    } catch {
      alert('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  }

  const threshold = merchant?.reward_threshold || 10;

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="font-bold text-gray-800 text-lg">Commerce introuvable</p>
          <p className="text-gray-400 text-sm mt-2">Ce lien de carte fidélité n'est pas valide.</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    const pts = customer?.points || 0;
    const progress = Math.min((pts / threshold) * 100, 100);
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-4">
          {referred && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3 flex items-center gap-3">
              <span className="text-xl">🎁</span>
              <p className="text-sm text-green-800 font-medium">Bonus parrainage ! +3 points offerts à vous et votre ami.</p>
            </div>
          )}

          {/* Wallet card */}
          <div className="rounded-3xl p-7 text-white shadow-lg" style={{ background: merchant?.primary_color || '#F59E0B' }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Carte fidélité</p>
                <p className="text-2xl font-bold leading-tight">{merchant?.business_name}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0">
                {merchant?.business_name?.charAt(0) || '?'}
              </div>
            </div>
            <div className="mb-5">
              <p className="text-xs opacity-70 mb-0.5">Client</p>
              <p className="text-lg font-semibold">{customer?.name}</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="opacity-70">Points fidélité</span>
                <span className="font-bold">{pts} / {threshold}</span>
              </div>
              <div className="w-full bg-white/25 rounded-full h-2.5">
                <div className="bg-white h-2.5 rounded-full progress-bar" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 text-center">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Bienvenue {customer?.name?.split(' ')[0]} !</h2>
            <p className="text-gray-400 text-sm mb-4">
              Tu es inscrit à la carte fidélité de <strong>{merchant?.business_name}</strong>. Présente cette page à chaque visite !
            </p>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-0.5">Récompense</p>
              <p className="text-sm text-amber-800">
                <strong>{threshold} points</strong> = {merchant?.reward_description || '1 récompense offerte'}
              </p>
              {threshold - pts > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Plus que <strong>{threshold - pts} point{threshold - pts > 1 ? 's' : ''}</strong> !
                </p>
              )}
            </div>
          </div>

          {/* Referral link */}
          {customer?.referral_code && (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 text-sm mb-1">Parrainez vos amis</h3>
              <p className="text-xs text-gray-400 mb-3">Gagnez +3 points pour chaque ami qui s'inscrit via votre lien.</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`${window.location.origin}/join/${merchantId}?ref=${customer.referral_code}`}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 truncate focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/join/${merchantId}?ref=${customer.referral_code}`);
                  }}
                  className="flex-shrink-0 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Copier
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 pb-2">Aucune app à télécharger · Gratuit · Sans spam</p>
        </div>
      </div>
    );
  }

  // Compute next tier from reward_tiers
  const tiers = Array.isArray(merchant?.reward_tiers) && merchant.reward_tiers.length > 0
    ? [...merchant.reward_tiers].sort((a, b) => a.points - b.points)
    : [{ points: threshold, reward: merchant?.reward_description || '1 récompense offerte' }];
  const nextTier = tiers[0];

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
            style={{ background: merchant?.primary_color || '#F59E0B' }}
          >
            {merchant?.business_name?.charAt(0) || '?'}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{merchant?.business_name}</h1>
          <p className="text-gray-400 text-sm mt-1">Carte de fidélité</p>
        </div>

        {refCode && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
            <span>🎁</span>
            <p className="text-sm text-green-800 font-medium">Parrainage actif — vous recevrez +3 points bonus !</p>
          </div>
        )}

        {/* Progress bar preview for 0 pts */}
        <div className="bg-white rounded-2xl border border-amber-100 p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Prochaine récompense</p>
              <p className="text-sm font-semibold text-gray-800">{nextTier.reward}</p>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>0 pts</span>
            <span>{nextTier.points} pts</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-2">
            <div className="bg-amber-400 h-2 rounded-full" style={{ width: '0%' }} />
          </div>
          {tiers.length > 1 && (
            <div className="mt-3 space-y-1">
              {tiers.slice(1).map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-gray-400">
                  <span>{t.points} pts</span>
                  <span>{t.reward}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800">Rejoindre la carte fidélité</h2>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Ton prénom <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Marie"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Ton email <span className="text-red-400">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="marie@exemple.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Pour retrouver ta carte à chaque visite</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Date d'anniversaire <span className="text-gray-300">(optionnel)</span></label>
            <input
              type="date"
              value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!form.name.trim() || !form.email.trim() || loading}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Rejoindre gratuitement'
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">Aucune app à télécharger · Gratuit · Sans spam</p>
      </div>
    </div>
  );
}
