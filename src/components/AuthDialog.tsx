import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle, Mail, ShieldCheck, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type Props = {
  open: boolean;
  user: User | null;
  callbackError: string;
  onClose: () => void;
  onSignedOut: () => void;
};

export function AuthDialog({ open, user, callbackError, onClose, onSignedOut }: Props) {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (callbackError) setError(callbackError);
  }, [callbackError]);

  if (!open) return null;

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setError('Sign-in is not configured yet. Your local team planner is still available.');
      return;
    }
    setBusy(true);
    setError('');
    const cleanEmail = email.trim();
    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signInError) setError(signInError.message);
      else setSentTo(cleanEmail);
    } catch {
      setError('Could not send the sign-in link. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    if (!supabase) {
      setError('Sign-in is not configured yet. Your local team planner is still available.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (signInError) {
        setError(/provider.*not enabled|unsupported provider/i.test(signInError.message)
          ? 'Google sign-in is not enabled in Supabase yet. Finish the Google provider setup, then try again.'
          : signInError.message);
      }
    } catch {
      setError('Could not start Google sign-in. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    setError('');
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) setError(signOutError.message);
      else {
        onSignedOut();
        setEmail('');
        setSentTo('');
      }
    } catch {
      setError('Could not sign out. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" data-clarity-mask className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1d16] p-5 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-[#c7f36b]/10 text-[#c7f36b]"><ShieldCheck className="h-5 w-5" /></div><h2 id="auth-dialog-title" className="text-xl font-black text-white">Save your Play XI</h2><p className="mt-1 text-sm leading-6 text-slate-400">Sign in to keep your FPL Team ID and Gameweek plans synced across devices.</p></div>
        <button type="button" onClick={onClose} aria-label="Close sign-in dialog" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
      </div>

      {user ? <div className="mt-6 rounded-2xl border border-[#c7f36b]/20 bg-[#c7f36b]/[.06] p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white"><CheckCircle2 className="h-4 w-4 text-[#c7f36b]" /> Signed in</div>
        <p className="mt-1 break-all text-sm text-slate-300">{user.email}</p>
        <button type="button" disabled={busy} onClick={() => void signOut()} className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-50">{busy ? 'Signing out…' : 'Sign out'}</button>
      </div> : sentTo ? <div role="status" className="mt-6 rounded-2xl border border-[#c7f36b]/20 bg-[#c7f36b]/[.06] p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white"><CheckCircle2 className="h-4 w-4 text-[#c7f36b]" /> Check your email</div>
        <p className="mt-1 break-all text-sm text-slate-300">We sent a secure sign-in link to {sentTo}. Open it on this device to finish signing in.</p>
        <button type="button" onClick={() => setSentTo('')} className="mt-3 text-xs font-bold text-[#d9ffa1] hover:underline">Use a different email</button>
      </div> : <>
        <button type="button" disabled={busy} onClick={() => void signInWithGoogle()} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <GoogleMark />}
          Continue with Google
        </button>
        <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500"><span className="h-px flex-1 bg-white/10" />or continue with email<span className="h-px flex-1 bg-white/10" /></div>
        <form onSubmit={(event) => void sendLink(event)}>
        <label htmlFor="playxi-auth-email" className="mb-1.5 block text-xs font-bold text-slate-300">Email address</label>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#07150f] px-3 focus-within:border-[#c7f36b]/50">
          <Mail className="h-4 w-4 shrink-0 text-slate-500" />
          <input id="playxi-auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
        </div>
        {!isSupabaseConfigured && !error && <p className="mt-3 text-xs leading-5 text-slate-500">Cloud sign-in is being connected. You can still explore the planner without an account.</p>}
        <button type="submit" disabled={busy} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c7f36b] px-4 text-sm font-black text-[#102018] transition hover:bg-[#d7ff84] disabled:cursor-wait disabled:opacity-60">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <>Email me a sign-in link <ArrowRight className="h-4 w-4" /></>}</button>
        <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">No password needed. Play XI uses your public FPL Team ID and never asks for your FPL password.</p>
        </form>
      </>}
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-900 bg-rose-950/30 px-3 py-2 text-xs leading-5 text-rose-200">{error}</p>}
    </section>
  </div>;
}

function GoogleMark() {
  return <span aria-hidden="true" className="text-xl font-black leading-none text-[#4285f4]">G</span>;
}
