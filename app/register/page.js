'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '../lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    business_name: '',
    business_type: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    if (!form.email.trim() || !form.password || !form.business_name.trim()) {
      showToast('Merci de remplir tous les champs obligatoires', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erreur lors de la création du compte', 'error');
      } else {
        localStorage.setItem('merchant', JSON.stringify(data.merchant));
        localStorage.setItem('token', data.token);
        router.push('/dashboard/onboarding');
      }
    } catch {
      showToast('Erreur de connexion au serveur', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-black text-white">F</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Créer un compte</h1>
          <p className="text-gray-500 mt-1">Rejoignez Fideloo gratuitement</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Nom du commerce <span className="text-red-400">*</span>
            </label>
            <input
              name="business_name"
              value={form.business_name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
              placeholder="Ex: Boulangerie Martin"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type de commerce</label>
            <select
              name="business_type"
              value={form.business_type}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition bg-white"
            >
              <option value="">Sélectionner...</option>
              <option value="restaurant">Restaurant</option>
              <option value="boulangerie">Boulangerie / Pâtisserie</option>
              <option value="cafe">Café / Bar</option>
              <option value="coiffeur">Coiffeur / Beauté</option>
              <option value="boutique">Boutique</option>
              <option value="sport">Sport / Fitness</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
              placeholder="vous@exemple.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Mot de passe <span className="text-red-400">*</span>
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
              placeholder="Minimum 6 caractères"
              autoComplete="new-password"
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={loading || !form.email.trim() || !form.password || !form.business_name.trim()}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Créer mon compte gratuitement'
            )}
          </button>

          <p className="text-center text-sm text-gray-400 pt-2">
            Déjà un compte ?{' '}
            <a href="/" className="text-amber-600 font-semibold hover:underline">Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  );
}
