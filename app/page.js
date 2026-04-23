'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API, showToast } from './lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/merchants/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Email ou mot de passe incorrect', 'error');
      } else {
        localStorage.setItem('merchant', JSON.stringify(data.merchant));
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      }
    } catch {
      showToast('Erreur de connexion au serveur', 'error');
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-black text-white">F</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Fideloo</h1>
          <p className="text-gray-500 mt-1">Connectez-vous à votre espace commerçant</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
              placeholder="vous@exemple.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || !email.trim() || !password}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Se connecter'
            )}
          </button>

          <p className="text-center text-sm text-gray-400 pt-2">
            Pas encore de compte ?{' '}
            <a href="/register" className="text-amber-600 font-semibold hover:underline">S'inscrire gratuitement</a>
          </p>
        </div>
      </div>
    </div>
  );
}
