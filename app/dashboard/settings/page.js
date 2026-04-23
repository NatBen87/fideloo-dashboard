'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, API } from '../../lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState(null);
  const [form, setForm] = useState({
    business_name: '',
    business_type: '',
    primary_color: '#F59E0B',
    reward_threshold: 10,
    reward_description: '',
    points_per_visit: 1,
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const merchantData = localStorage.getItem('merchant');
    if (!merchantData) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(merchantData);
    setMerchant(parsed);
    setForm({
      business_name: parsed.business_name || '',
      business_type: parsed.business_type || '',
      primary_color: parsed.primary_color || '#F59E0B',
      reward_threshold: parsed.reward_threshold ?? 10,
      reward_description: parsed.reward_description || '',
      points_per_visit: parsed.points_per_visit ?? 1,
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!merchant) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await authFetch(`${API}/merchants/${merchant.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = { ...merchant, ...data.merchant };
        localStorage.setItem('merchant', JSON.stringify(updated));
        setMerchant(updated);
        setSuccessMsg('Paramètres enregistrés avec succès.');
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde.');
      }
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setSaving(false);
    }
  }

  const colorPresets = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'];

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
            <h1 className="text-xl font-bold text-gray-800">Paramètres</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Preview card */}
        <div
          className="rounded-2xl p-6 text-white shadow-sm"
          style={{ background: form.primary_color }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">Carte fidélité</p>
          <p className="text-xl font-bold">{form.business_name || 'Mon Commerce'}</p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs opacity-70">Récompense</p>
              <p className="text-sm font-semibold">{form.reward_threshold} pts = {form.reward_description || '...'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-70">Points / visite</p>
              <p className="text-2xl font-bold">+{form.points_per_visit}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-800">Informations du commerce</h2>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Nom du commerce
              </label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                placeholder="Ex: Café de la Paix"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Type de commerce
              </label>
              <input
                type="text"
                value={form.business_type}
                onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                placeholder="Ex: Café, Boulangerie, Restaurant..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                Couleur de la carte
              </label>
              <div className="flex gap-2 flex-wrap">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, primary_color: color })}
                    className={`w-9 h-9 rounded-xl transition-transform ${form.primary_color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                    style={{ background: color }}
                  />
                ))}
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="w-9 h-9 rounded-xl border border-gray-200 cursor-pointer p-0.5"
                  title="Couleur personnalisée"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-800">Programme de fidélité</h2>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Points par visite
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.points_per_visit}
                onChange={(e) => setForm({ ...form, points_per_visit: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Seuil de récompense (points)
              </label>
              <input
                type="number"
                min="1"
                value={form.reward_threshold}
                onChange={(e) => setForm({ ...form, reward_threshold: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Description de la récompense
              </label>
              <input
                type="text"
                value={form.reward_description}
                onChange={(e) => setForm({ ...form, reward_description: e.target.value })}
                placeholder="Ex: 1 café offert"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
              />
            </div>
          </div>

          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm text-center font-medium">
              {successMsg}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Enregistrer les modifications'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
