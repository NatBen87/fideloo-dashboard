'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, API, showToast, getMerchantJoinUrl } from '../lib/api';

const MILESTONES = [10, 50, 100, 250, 500];

function Confetti({ onEnd }) {
  const COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316'];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 1.5,
    size: 7 + Math.random() * 9,
    circle: Math.random() > 0.5,
  }));
  useEffect(() => { const t = setTimeout(onEnd, 4000); return () => clearTimeout(t); }, [onEnd]);
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute top-0 animate-confetti"
          style={{ left: `${p.x}%`, width: p.size, height: p.size, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, borderRadius: p.circle ? '50%' : '2px' }}
        />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 animate-pulse">
      <div className="h-3 bg-amber-100 rounded w-24 mb-3" />
      <div className="h-8 bg-amber-100 rounded w-16" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <li className="px-6 py-4 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full" />
        <div className="space-y-1.5">
          <div className="h-3 bg-amber-100 rounded w-28" />
          <div className="h-2.5 bg-amber-50 rounded w-36" />
        </div>
      </div>
      <div className="h-4 bg-amber-100 rounded w-12" />
    </li>
  );
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function thisMonthBirthday(birthday) {
  if (!birthday) return false;
  return new Date(birthday).getUTCMonth() === new Date().getMonth();
}

export default function DashboardPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinUrl, setJoinUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [milestoneCount, setMilestoneCount] = useState(0);
  const [showNotify, setShowNotify] = useState(false);
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '' });
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    const merchantData = localStorage.getItem('merchant');
    if (!merchantData) { router.push('/'); return; }
    const parsed = JSON.parse(merchantData);
    setMerchant(parsed);
    setJoinUrl(getMerchantJoinUrl(parsed.id));
    fetchCustomers(parsed.id);
  }, []);

  const fetchCustomers = useCallback(async (merchantId) => {
    try {
      const res = await authFetch(`${API}/customers/${merchantId}`);
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data) ? data : [];
        setCustomers(list);
        const lastShown = Number(sessionStorage.getItem('fideloo_milestone') || '0');
        const newMilestone = MILESTONES.find(m => list.length >= m && m > lastShown);
        if (newMilestone) {
          setMilestoneCount(list.length);
          setShowConfetti(true);
          sessionStorage.setItem('fideloo_milestone', String(newMilestone));
        }
      } else {
        showToast('Impossible de charger les clients.', 'error');
      }
    } catch {
      showToast('Erreur de connexion au serveur.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  async function copyJoinUrl() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    showToast('Lien copié dans le presse-papiers !');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    localStorage.removeItem('merchant');
    localStorage.removeItem('token');
    router.push('/');
  }

  async function handleNotify(e) {
    e.preventDefault();
    if (!notifyForm.title.trim() || !notifyForm.message.trim()) return;
    setNotifying(true);
    try {
      const res = await authFetch(`${API}/merchants/${merchant.id}/notify`, {
        method: 'POST',
        body: JSON.stringify(notifyForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Notification envoyée à ${data.recipients} client${data.recipients !== 1 ? 's' : ''} !`);
        setShowNotify(false);
        setNotifyForm({ title: '', message: '' });
      } else {
        showToast(data.message || "Erreur lors de l'envoi", 'error');
      }
    } catch {
      showToast('Erreur de connexion', 'error');
    } finally {
      setNotifying(false);
    }
  }

  const totalPoints = customers.reduce((s, c) => s + (c.points || 0), 0);
  const birthdayCustomers = customers.filter(c => thisMonthBirthday(c.birthday));
  const atRiskCount = customers.filter(c => { const d = daysSince(c.last_visit); return d !== null && d > 30; }).length;

  const filtered = customers.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  const qrUrl = joinUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}&ecc=M&format=png`
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50">
        <header className="bg-white shadow-sm border-b border-amber-100">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-2.5 bg-amber-100 rounded w-14 animate-pulse" />
              <div className="h-5 bg-amber-100 rounded w-40 animate-pulse" />
            </div>
            <div className="h-9 w-28 bg-amber-100 rounded-xl animate-pulse" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4"><SkeletonCard /><SkeletonCard /></div>
          <div className="grid grid-cols-2 gap-4"><SkeletonCard /><SkeletonCard /></div>
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100"><div className="h-4 bg-amber-100 rounded w-24 animate-pulse" /></div>
            <ul>{[1, 2, 3].map(i => <SkeletonRow key={i} />)}</ul>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {showConfetti && (
        <>
          <Confetti onEnd={() => setShowConfetti(false)} />
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full z-50 relative">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Félicitations !</h2>
              <p className="text-gray-500 mb-6">
                Vous avez atteint <strong className="text-amber-600">{milestoneCount} clients</strong> fidèles !
              </p>
              <button onClick={() => setShowConfetti(false)} className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors">
                Super !
              </button>
            </div>
          </div>
        </>
      )}

      {showNotify && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-800 text-lg">Notifier les clients</h2>
              <button onClick={() => setShowNotify(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleNotify} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Titre</label>
                <input
                  type="text"
                  value={notifyForm.title}
                  onChange={e => setNotifyForm({ ...notifyForm, title: e.target.value })}
                  placeholder="Ex: Offre spéciale ce week-end !"
                  maxLength={100}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Message</label>
                <textarea
                  value={notifyForm.message}
                  onChange={e => setNotifyForm({ ...notifyForm, message: e.target.value })}
                  placeholder="Ex: Double points toute la journée de demain !"
                  maxLength={500}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                />
              </div>
              <p className="text-xs text-gray-400">Visible par vos clients lors de leur prochaine visite sur leur carte.</p>
              <button
                type="submit"
                disabled={notifying || !notifyForm.title.trim() || !notifyForm.message.trim()}
                className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {notifying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Envoyer la notification
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-500 font-semibold uppercase tracking-widest">Fideloo</p>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">{merchant?.business_name || 'Mon Commerce'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotify(true)} title="Notifier les clients" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-amber-50 text-amber-500 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {birthdayCustomers.length > 0 && (
          <div className="bg-pink-50 border border-pink-200 rounded-2xl px-5 py-3 flex items-center gap-3">
            <span className="text-xl flex-shrink-0">🎂</span>
            <p className="text-sm text-pink-800 font-medium">
              {birthdayCustomers.length} client{birthdayCustomers.length > 1 ? 's ont' : ' a'} leur anniversaire ce mois-ci :&nbsp;
              {birthdayCustomers.slice(0, 3).map(c => c.name).join(', ')}{birthdayCustomers.length > 3 ? '...' : ''}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
            <p className="text-xs text-gray-500 mb-1 font-medium">Clients fidèles</p>
            <p className="text-4xl font-black text-amber-500">{customers.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
            <p className="text-xs text-gray-500 mb-1 font-medium">Points distribués</p>
            <p className="text-4xl font-black text-amber-500">{totalPoints}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => router.push('/dashboard/scan')} className="bg-amber-400 hover:bg-amber-500 text-white rounded-2xl p-5 shadow-sm text-left transition-colors group">
            <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-white/40 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5V16M4 6h4V4m0 2v2M4 6v2m0-2H2m18 0h-4V4m4 2v2m0-2h2" />
              </svg>
            </div>
            <p className="font-bold text-lg">Scanner</p>
            <p className="text-white/80 text-sm">Ajouter des points</p>
          </button>
          <button onClick={() => router.push('/dashboard/settings')} className="bg-white hover:bg-gray-50 text-gray-700 rounded-2xl p-5 shadow-sm border border-amber-100 text-left transition-colors group">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-bold text-lg">Paramètres</p>
            <p className="text-gray-400 text-sm">Carte fidélité</p>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => router.push('/dashboard/transactions')} className="bg-white hover:bg-gray-50 text-gray-700 rounded-2xl px-5 py-4 shadow-sm border border-amber-100 flex items-center gap-3 transition-colors group">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors flex-shrink-0">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div><p className="font-bold text-gray-800 text-sm">Historique</p><p className="text-gray-400 text-xs">Transactions</p></div>
          </button>
          <button onClick={() => router.push('/dashboard/analytics')} className="bg-white hover:bg-gray-50 text-gray-700 rounded-2xl px-5 py-4 shadow-sm border border-amber-100 flex items-center gap-3 transition-colors group">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors flex-shrink-0">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div><p className="font-bold text-gray-800 text-sm">Analytics</p><p className="text-gray-400 text-xs">Statistiques</p></div>
          </button>
        </div>

        {joinUrl && (
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">
                {customers.length === 0 ? '👋 Démarrez en partageant votre QR code' : 'Partager ma carte fidélité'}
              </h2>
              {customers.length === 0 && (
                <p className="text-sm text-gray-400 mt-0.5">Vos clients scannent ce QR pour rejoindre votre programme</p>
              )}
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
              {qrUrl && (
                <div className={`flex-shrink-0 bg-white border border-gray-100 rounded-2xl p-3 shadow-inner ${customers.length === 0 ? 'ring-2 ring-amber-300 ring-offset-2' : ''}`}>
                  <img src={qrUrl} alt="QR Code" width={customers.length === 0 ? 180 : 160} height={customers.length === 0 ? 180 : 160} className="rounded-lg" />
                </div>
              )}
              <div className="flex-1 space-y-3 w-full">
                {customers.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 font-medium">
                    Partagez ce QR code avec vos clients pour commencer à fidéliser !
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Lien d'inscription</p>
                  <div className="flex items-center gap-2">
                    <input readOnly value={joinUrl} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 truncate focus:outline-none" />
                    <button onClick={copyJoinUrl} className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}>
                      {copied ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                </div>
                {qrUrl && (
                  <a href={qrUrl} download={`fideloo-qr-${merchant?.business_name || 'carte'}.png`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-amber-400 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Télécharger le QR Code
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Mes clients</h2>
              <div className="flex items-center gap-2">
                {atRiskCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">{atRiskCount} à risque</span>
                )}
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">{customers.length} au total</span>
              </div>
            </div>
            {customers.length > 0 && (
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              {customers.length === 0 ? (
                <>
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">Aucun client encore</p>
                  <p className="text-gray-400 text-sm mt-1">Partagez votre QR code ci-dessus pour commencer</p>
                </>
              ) : (
                <p className="text-gray-400 text-sm">Aucun résultat pour cette recherche</p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filtered.map(customer => {
                const days = daysSince(customer.last_visit);
                const isAtRisk = days !== null && days > 30;
                const hasBirthday = thisMonthBirthday(customer.birthday);
                return (
                  <li key={customer.id} className="px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-amber-50/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                        {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-gray-800 truncate">{customer.name || 'Client anonyme'}</p>
                          {hasBirthday && <span title="Anniversaire ce mois-ci">🎂</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-gray-400 truncate">{customer.email || ''}</p>
                          {days !== null && (
                            <span className={`text-xs font-medium flex-shrink-0 ${isAtRisk ? 'text-red-500' : 'text-gray-400'}`}>
                              · {days === 0 ? "Auj." : `${days}j`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-bold text-amber-500 text-sm">{customer.points || 0} pts</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
