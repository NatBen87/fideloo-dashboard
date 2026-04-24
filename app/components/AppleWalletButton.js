'use client';

export default function AppleWalletButton({ href }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2.5 w-full bg-black hover:bg-gray-900 text-white font-semibold py-3.5 px-5 rounded-2xl transition-colors"
    >
      {/* Apple Wallet card icon */}
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <rect x="2" y="5" width="20" height="14" rx="2" fill="white" stroke="none" />
        <rect x="2" y="9" width="20" height="3" fill="black" stroke="none" />
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="1.5" fill="none" />
        <circle cx="16.5" cy="15" r="1.5" fill="#F59E0B" stroke="none" />
        <circle cx="18.5" cy="15" r="1.5" fill="#F59E0B" stroke="none" fillOpacity="0.6" />
      </svg>
      <span className="text-sm tracking-wide">Ajouter à Apple Wallet</span>
    </a>
  );
}
