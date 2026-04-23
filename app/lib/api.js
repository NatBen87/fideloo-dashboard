export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function getMerchantJoinUrl(merchantId) {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/join/${merchantId}`;
}

export async function authFetch(url, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('merchant');
      localStorage.removeItem('token');
      window.location.href = '/';
    }
  }
  return res;
}

export function showToast(message, type = 'success') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('fideloo:toast', { detail: { message, type } }));
}
