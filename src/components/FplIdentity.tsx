import { useState } from 'react';

const IMAGE_ROOT = 'https://resources.premierleague.com/premierleague';

export function PlayerPortrait({ photo, name, size = 'md' }: { photo?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false);
  const photoId = photo?.match(/^(\d+)\.jpg$/)?.[1];
  const dimensions = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-9 w-9' : 'h-12 w-12';
  const imageSize = '250x250';

  return <span className={`relative inline-flex ${dimensions} shrink-0 items-end justify-center overflow-hidden rounded-full border border-white/10 bg-[#193044]`}>
    {photoId && !failed ? <img src={`${IMAGE_ROOT}/photos/players/${imageSize}/p${photoId}.png`} alt={`${name} portrait`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover object-top" /> : <span aria-hidden="true" className="pb-1 text-xs font-bold text-slate-300">{name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>}
  </span>;
}

export function TeamBadge({ code, name, size = 20 }: { code?: number | null; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  return <span className="inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
    {code && !failed ? <img src={`${IMAGE_ROOT}/badges/70/t${code}.png`} alt={`${name} crest`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-contain" /> : <span aria-hidden="true" className="flex h-full w-full items-center justify-center rounded-full bg-white/[.08] text-[8px] font-bold text-slate-300">{name.slice(0, 3).toUpperCase()}</span>}
  </span>;
}
