'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function JoinPage() {
  const { merchantId } = useParams();
  const [merchant, setMerchant] = useState(null);
  const [step, setStep] = useState('loading');
  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    fetchMerchant();
  }, []);

  async function fetchMerchant() {
    try {
      const res = await fetch(`http://localhost:3000/merchants/${merchantId}`);
      const data = await res.json();
      if (res.ok) {
        setMerchant(data);
        setStep('join');
      } else {
        setStep('error');
      }
    } catch (err) {
      setStep('error');
    }
  }

  async function handleJoin() {
    if (!form.name.trim() || !form.email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchantId,
          name: form.name,
          email: form.email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomer(data);
        setStep('success');
      } else if (res.status === 400 && data.customer) {
        // Already registered — backend returns existing customer in the 400 body
        setCustomer(data.customer);
        setStep('success');
      } else {
        alert(data.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      alert('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="font-bold text-gray-800 text-lg">Commerce introuvable</p>
          <p className="text-gray-400 text-sm mt-2">Ce lien de carte fidélité n'est pas valide.</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-8 text-center">
            <div
              className="rounded-2xl p-6 mb-6 text-white"
              style={{ background: merchant?.primary_color || '#F59E0B' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">Carte fidélité</p>
              <p className="text-xl font-bold">{merchant?.business_name}</p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-70">Client</p>
                  <p className="font-semibold">{customer?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-70">Points</p>
                  <p className="text-3xl font-bold">{customer?.points || 0}</p>
                </div>
              </div>
            </div>

            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2">Bienvenue {customer?.name} !</h2>
            <p className="text-gray-400 text-sm mb-6">
              Tu es maintenant inscrit à la carte fidélité de <strong>{merchant?.business_name}</strong>.
              Présente cette page à chaque visite pour gagner des points !
            </p>

            <div className="bg-amber-50 rounded-2xl p-4">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Récompense</p>
              <p className="text-sm text-amber-800">
                <strong>{merchant?.reward_threshold || 10} points</strong> = {merchant?.reward_description || '1 récompense offerte'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: merchant?.primary_color || '#F59E0B' }}
          >
            {merchant?.business_name?.charAt(0) || '?'}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{merchant?.business_name}</h1>
          <p className="text-gray-400 text-sm mt-1">Carte de fidélité</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400">Récompense</p>
            <p className="text-sm font-semibold text-gray-800">
              {merchant?.reward_threshold || 10} points = {merchant?.reward_description || '1 récompense offerte'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800">Rejoindre la carte fidélité</h2>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Ton prénom</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Marie"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Ton email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="marie@exemple.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Pour retrouver ta carte à chaque visite</p>
          </div>

          <button
            onClick={handleJoin}
            disabled={!form.name.trim() || !form.email.trim() || loading}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Rejoindre gratuitement"
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Aucune app à télécharger · Gratuit · Sans spam
        </p>
      </div>
    </div>
  );
}