'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, API, showToast, getMerchantJoinUrl } from '../../lib/api';

const COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'];
const STEPS = ['Couleur', 'Récompenses', 'QR Code'];

export default function OnboardingPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState(null);
  const [step, setStep] = useState(0);
  const [color, setColor] = useState('#F59E0B');
  const [threshold, setThreshold] = useState(10);
  const [description, setDescription] = useState('');
  const [pointsPerVisit, setPointsPerVisit] = useState(1);
  const [saving, setSaving] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem('merchant');
    if (!d) { router.push('/'); return; }
    const m = JSON.parse(d);
    setMerchant(m);
    if (m.onboarding_complete) { router.push('/dashboard'); return; }
    setColor(m.primary_color || '#F59E0B');
    setJoinUrl(getMerchantJoinUrl(m.id));
  }, []);

  async function saveAndNext() {
    if (!merchant) return;
    setSaving(true);
    try {
      const body = step < 2
        ? { primary_color: color, reward_threshold: threshold, reward_description: description, points_per_visit: pointsPerVisit }
        : { primary_color: color, reward_threshold: threshold, reward_description: description, points_per_visit: pointsPerVisit, onboarding_complete: true };

      const res = await authFetch(`${API}/merchants/${merchant.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = { ...merchant, ...data.merchant };
        localStorage.setItem('merchant', JSON.stringify(updated));
        setMerchant(updated);
        if (step < 2) {
          setStep(s => s + 1);
        } else {
          router.push('/dashboard');
        }
      } else {
        showToast(data.error || 'Erreur de sauvegarde', 'error');
      }
    } catch {
      showToast('Erreur de connexion', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    showToast('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  }

  const qrUrl = joinUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}&ecc=M&format=png`
    : null;

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-black text-white">F</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Bienvenue sur Fideloo !</h1>
          <p className="text-gray-500 text-sm mt-1">Configurons votre carte fidélité en 3 étapes</p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1.5 rounded-full transition-colors ${i <= step ? 'bg-amber-400' : 'bg-amber-100'}`} />
              <span className={`text-xs font-medium transition-colors ${i === step ? 'text-amber-600' : i < step ? 'text-amber-400' : 'text-gray-400'}`}>
                {s}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Choisissez la couleur de votre carte</h2>
                <p className="text-sm text-gray-400">C'est la couleur que verront vos clients sur leur carte fidélité.</p>
              </div>

              {/* Preview */}
              <div className="rounded-2xl p-5 text-white transition-all" style={{ background: color }}>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">Carte fidélité</p>
                <p className="text-lg font-bold">{merchant?.business_name || 'Mon Commerce'}</p>
                <div className="mt-3 text-sm opacity-80">Votre client · 0 pts</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Couleur</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-xl transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ background: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Configurez vos récompenses</h2>
                <p className="text-sm text-gray-400">Définissez combien de points valent une récompense.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Points par visite</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={pointsPerVisit}
                  onChange={e => setPointsPerVisit(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Points pour une récompense</label>
                <input
                  type="number"
                  min="1"
                  value={threshold}
                  onChange={e => setThreshold(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Description de la récompense</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: 1 café offert, 10% de réduction..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                Après <strong>{threshold} points</strong> ({threshold / pointsPerVisit} visites), vos clients recevront : <strong>{description || '...'}</strong>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Votre QR code est prêt !</h2>
                <p className="text-sm text-gray-400">Imprimez-le ou partagez le lien avec vos clients.</p>
              </div>

              {qrUrl && (
                <div className="flex justify-center">
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-inner inline-block">
                    <img src={qrUrl} alt="QR Code" width={200} height={200} className="rounded-lg" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={joinUrl}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 truncate focus:outline-none"
                />
                <button
                  onClick={copyUrl}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}
                >
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>

              {qrUrl && (
                <a
                  href={qrUrl}
                  download={`fideloo-qr-${merchant?.business_name || 'carte'}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Télécharger le QR Code
                </a>
              )}
            </div>
          )}

          <button
            onClick={saveAndNext}
            disabled={saving}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-6"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : step < 2 ? (
              <>Continuer <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></>
            ) : (
              'Aller au tableau de bord →'
            )}
          </button>

          {step < 2 && (
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3 py-1 transition-colors"
            >
              Passer pour l'instant
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
