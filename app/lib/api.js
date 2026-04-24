export const API = 'https://fideloo-backend-production.up.railway.app';

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

export function getMerchantJoinUrl(merchantId) {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/join/${merchantId}`;
}

export function showToast(message, type = 'success') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('fideloo:toast', { detail: { message, type } }));
}
