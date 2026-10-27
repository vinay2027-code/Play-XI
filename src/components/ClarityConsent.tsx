import { useEffect, useState } from 'react';

const STORAGE_KEY = 'playxi-analytics-consent-v2';
const PROJECT_ID = 'z2mouyq0u2';
const ENABLED_HOSTS = new Set(['playfpl.digital', 'www.playfpl.digital']);
const CONSENT_LIFETIME_MS = 270 * 24 * 60 * 60 * 1000;

type Consent = 'allowed' | 'declined' | null;
type ClarityCommand = (...args: unknown[]) => void;

declare global {
  interface Window {
    clarity?: ClarityCommand & { q?: unknown[][] };
  }
}

function loadClarity() {
  if (document.getElementById('playxi-clarity-script')) return;
  window.clarity = window.clarity || function (...args: unknown[]) {
    (window.clarity!.q = window.clarity!.q || []).push(args);
  };
  // Advertising consent is always denied. Only analytics is optional.
  window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
  const script = document.createElement('script');
  script.id = 'playxi-clarity-script';
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${PROJECT_ID}`;
  document.head.appendChild(script);
}

export function ClarityConsent() {
  const [consent, setConsent] = useState<Consent>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const choice = JSON.parse(saved) as { value?: string; at?: number };
      if (typeof choice.at !== 'number' || Date.now() - choice.at > CONSENT_LIFETIME_MS) return null;
      return choice.value === 'allowed' || choice.value === 'declined' ? choice.value : null;
    } catch {
      return null;
    }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (consent !== 'allowed' || !ENABLED_HOSTS.has(window.location.hostname)) return;
    loadClarity();

    let active = true;
    let removeScreenListener: (() => void) | undefined;
    void import('../lib/posthogAnalytics').then(({ startPostHog, trackScreen }) => {
      if (!active) return;
      startPostHog();
      const onScreenChange = (event: Event) => {
        trackScreen((event as CustomEvent<string>).detail);
      };
      window.addEventListener('playxi-screen-change', onScreenChange);
      removeScreenListener = () => window.removeEventListener('playxi-screen-change', onScreenChange);
    });
    return () => {
      active = false;
      removeScreenListener?.();
    };
  }, [consent]);

  if (!ENABLED_HOSTS.has(window.location.hostname)) return null;

  const choose = (next: Exclude<Consent, null>) => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ value: next, at: Date.now() })); } catch { /* The choice still applies for this page. */ }
    if (next === 'declined' && consent === 'allowed') {
      window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
      void import('../lib/posthogAnalytics')
        .then(({ stopPostHog }) => stopPostHog())
        .finally(() => window.location.reload()); // Stop both trackers for this visit.
      return;
    }
    setConsent(next);
    setSettingsOpen(false);
  };

  return <>
    {(consent === null || settingsOpen) && <section role="dialog" aria-modal="false" aria-label="Analytics privacy choice" className="fixed bottom-24 left-4 right-4 z-[90] mx-auto max-w-lg rounded-2xl border border-white/15 bg-[#0b1d16] p-5 text-white shadow-2xl md:bottom-5 md:left-5 md:right-auto">
      <h2 className="text-base font-bold">Help improve Play XI?</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">With your permission, Microsoft Clarity records page interactions and PostHog counts page views and app screens. You can change this choice later. <a className="underline underline-offset-2" href="/privacy.html">Privacy details</a></p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => choose('allowed')} className="rounded-xl bg-[#c7f36b] px-4 py-2 text-sm font-bold text-[#102018]">Allow analytics</button>
        <button type="button" onClick={() => choose('declined')} className="rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-white">No thanks</button>
      </div>
    </section>}
    {consent !== null && !settingsOpen && <button type="button" onClick={() => setSettingsOpen(true)} className="fixed bottom-24 left-4 z-40 rounded-lg border border-white/15 bg-[#0b1d16] px-3 py-1.5 text-xs font-semibold text-white shadow-lg md:bottom-4" aria-label="Change analytics privacy choice">Analytics settings</button>}
  </>;
}
