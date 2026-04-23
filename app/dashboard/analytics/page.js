'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, API } from '../../lib/api';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function getWeekLabel(daysAgo) {
  if (daysAgo === 0) return 'Cette semaine';
  if (daysAgo === 7) return 'S-1';
  return `S-${daysAgo / 7}`;
}

function BarChart({ data, maxVal, color = '#F59E0B' }) {
  const height = 100;
  const barW = 32;
  const gap = 8;
  const total = data.length;
  const svgW = total * (barW + gap) - gap;

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${height + 24}`} className="overflow-visible">
      {data.map((d, i) => {
        const barH = maxVal > 0 ? Math.max(4, (d.value / maxVal) * height) : 4;
        const x = i * (barW + gap);
        return (
          <g key={i}>
            <rect
              x={x}
              y={height - barH}
              width={barW}
              height={barH}
              rx={6}
              fill={color}
              opacity={d.highlight ? 1 : 0.4}
            />
            <text
              x={x + barW / 2}
              y={height + 16}
              textAnchor="middle"
              fontSize="9"
              fill="#9CA3AF"
            >
              {d.label}
            </text>
            {d.value > 0 && (
              <text
                x={x + barW / 2}
                y={height - barH - 4}
                textAnchor="middle"
                fontSize="9"
                fill="#6B7280"
                fontWeight="600"
              >
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const d = localStorage.getItem('merchant');
    if (!d) { router.push('/'); return; }
    const m = JSON.parse(d);
    setMerchant(m);
    Promise.all([
      authFetch(`${API}/customers/${m.id}`).then(r => r.json()),
      authFetch(`${API}/transactions/merchant/${m.id}`).then(r => r.json()),
    ]).then(([cData, tData]) => {
      setCustomers(Array.isArray(cData) ? cData : []);
      setTransactions(Array.isArray(tData) ? tData : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // --- Compute analytics ---

  // New customers per week (last 8 weeks)
  const weeklyNew = (() => {
    const weeks = Array.from({ length: 8 }, (_, i) => ({
      label: getWeekLabel(i * 7),
      value: 0,
      highlight: i === 0,
    })).reverse();

    const now = Date.now();
    customers.forEach(c => {
      const age = (now - new Date(c.created_at).getTime()) / 86400000;
      const weekIdx = Math.floor(age / 7);
      if (weekIdx < 8) {
        const arr_idx = 7 - weekIdx;
        if (weeks[arr_idx]) weeks[arr_idx].value++;
      }
    });
    return weeks;
  })();

  const weeklyMax = Math.max(...weeklyNew.map(w => w.value), 1);

  // Busiest day of week
  const dayBuckets = (() => {
    const buckets = Array.from({ length: 7 }, (_, i) => ({ label: DAYS_FR[i], value: 0, highlight: false }));
    transactions.filter(t => t.points > 0).forEach(t => {
      const day = new Date(t.created_at).getDay();
      buckets[day].value++;
    });
    const max = Math.max(...buckets.map(b => b.value));
    buckets.forEach(b => { b.highlight = b.value === max && max > 0; });
    return buckets;
  })();

  const dayMax = Math.max(...dayBuckets.map(b => b.value), 1);

  // Top 5 loyal customers
  const top5 = [...customers]
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 5);

  // Avg points per customer
  const avgPoints = customers.length > 0
    ? Math.round(customers.reduce((s, c) => s + (c.points || 0), 0) / customers.length)
    : 0;

  const totalVisits = transactions.filter(t => t.points > 0).length;
  const totalRedemptions = transactions.filter(t => t.points < 0).length;

  const busiestDay = dayBuckets.find(b => b.highlight)?.label || '—';

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-amber-50 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-xs text-amber-500 font-semibold uppercase tracking-widest">Fideloo</p>
            <h1 className="text-xl font-bold text-gray-800">Analytics</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
            <p className="text-xs text-gray-400 mb-1">Clients total</p>
            <p className="text-3xl font-black text-amber-500">{customers.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
            <p className="text-xs text-gray-400 mb-1">Moy. points / client</p>
            <p className="text-3xl font-black text-amber-500">{avgPoints}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
            <p className="text-xs text-gray-400 mb-1">Visites totales</p>
            <p className="text-3xl font-black text-green-500">{totalVisits}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
            <p className="text-xs text-gray-400 mb-1">Récompenses utilisées</p>
            <p className="text-3xl font-black text-red-400">{totalRedemptions}</p>
          </div>
        </div>

        {/* New customers per week */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6">
          <h2 className="font-bold text-gray-800 mb-5">Nouveaux clients (8 dernières semaines)</h2>
          {customers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée disponible</p>
          ) : (
            <BarChart data={weeklyNew} maxVal={weeklyMax} color="#F59E0B" />
          )}
        </div>

        {/* Busiest day of week */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800">Jour le plus actif</h2>
            {transactions.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                {busiestDay}
              </span>
            )}
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune transaction encore</p>
          ) : (
            <BarChart data={dayBuckets} maxVal={dayMax} color="#10B981" />
          )}
        </div>

        {/* Top 5 loyal customers */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Top 5 clients fidèles</h2>
          </div>
          {top5.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-400">Aucun client encore</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {top5.map((c, idx) => (
                <li key={c.id} className="px-6 py-4 flex items-center gap-4">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    idx === 0 ? 'bg-amber-400 text-white' :
                    idx === 1 ? 'bg-gray-200 text-gray-600' :
                    idx === 2 ? 'bg-orange-200 text-orange-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email}</p>
                  </div>
                  <span className="font-bold text-amber-500 flex-shrink-0">{c.points} pts</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
