export function BrandMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
    >
      <rect width="40" height="40" rx="12" fill="#C7F36B" />
      <path d="M20 5.5 32.5 10v9.3c0 7.1-4.7 11.8-12.5 16.2C12.2 31.1 7.5 26.4 7.5 19.3V10L20 5.5Z" fill="#102018" />
      <path d="M13 14h14v12H13zM20 14v12" stroke="#C7F36B" strokeWidth="1.4" />
      <circle cx="20" cy="20" r="3.2" stroke="#C7F36B" strokeWidth="1.3" />
      <circle cx="20" cy="20" r=".9" fill="#C7F36B" />
    </svg>
  );
}

export function BrandLockup({ size = 40, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark size={size} />
      <span className={`font-black tracking-tight ${dark ? 'text-[#102018]' : 'text-white'}`}>
        PLAY<span className="text-[#C7F36B]">XI</span>
      </span>
    </span>
  );
}
