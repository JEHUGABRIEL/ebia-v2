export default function EbiaLogo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ebia-logo-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8601A" />
          <stop offset="1" stopColor="#C9930A" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#ebia-logo-g)" />
      {/* E letterform */}
      <rect x="8" y="9" width="18" height="4" rx="2" fill="white" />
      <rect x="8" y="18" width="13" height="4" rx="2" fill="white" />
      <rect x="8" y="27" width="18" height="4" rx="2" fill="white" />
      {/* Sound waves */}
      <path d="M 24 18 Q 29 20 24 22" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 27 15 Q 35 20 27 25" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
