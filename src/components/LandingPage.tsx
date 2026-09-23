import React, { useState } from 'react';
import {
  Zap,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Cpu,
  BarChart3,
  Award,
  CheckCircle2,
  Lock,
  Smartphone,
  ChevronRight,
  Users,
  Sparkles,
} from 'lucide-react';
import { ActiveUser } from '../types/fpl';

interface LandingPageProps {
  onLoginSuccess: (user: ActiveUser) => void;
  currentUser: ActiveUser;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginSuccess,
  currentUser,
}) => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [emailInput, setEmailInput] = useState('alex.sterling@tacticalfpl.io');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  
  // Phone state
  const [countryCode, setCountryCode] = useState('+44');
  const [phoneInput, setPhoneInput] = useState('7911 123456');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(['5', '9', '2', '4', '8', '1']);
  const [timer, setTimer] = useState(45);

  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        ...currentUser,
        email: emailInput || currentUser.email,
      });
    }, 500);
  };

  const handlePhoneSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpSent(true);
  };

  const handlePhoneVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        ...currentUser,
        phone: `${countryCode} ${phoneInput}`,
      });
    }, 500);
  };

  const handleOneClickDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(currentUser);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#051424] text-white flex flex-col selection:bg-[#00FF87] selection:text-[#051424]">
      {/* 1. Navigation */}
      <header className="h-18 border-b border-white/8 bg-[#051424]/90 backdrop-blur-md sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#00FF87] flex items-center justify-center text-[#051424]">
            <Zap className="w-5 h-5 fill-[#051424]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight">
              PLAY<span className="text-[#00FF87]">XI</span>
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30 font-bold">
              v2.4 TAC
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Tactical Engine</a>
          <a href="#optimizer" className="hover:text-white transition-colors">Monte Carlo Model</a>
          <a href="#pricing" className="hover:text-white transition-colors">Leaderboard</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOneClickDemo}
            className="px-4 py-2 rounded-lg bg-[#00FF87] hover:bg-[#00e478] text-[#051424] font-extrabold text-xs transition-all shadow-lg shadow-[#00FF87]/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Launch Cockpit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Hero + Auth Module Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left: Value Proposition */}
        <div className="lg:w-7/12 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse"></span>
            OFFICIAL OPERATIONAL ENGINE • 2024/25 SEASON
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-sans tracking-tight leading-[1.08]">
            The Algorithmic Edge for <span className="text-[#00FF87]">Serious FPL Tacticians.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
            Stop relying on intuition. Simulate 10,000 game paths, optimize squad shape, evaluate xGI vectors, and execute surgical transfers with top 1% operational precision.
          </p>

          {/* Quick Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#0d1c2d] border border-white/8">
              <div className="text-slate-400 text-[10px] uppercase">Simulation Depth</div>
              <div className="text-base font-bold text-white mt-0.5">10,000 Runs</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0d1c2d] border border-white/8">
              <div className="text-slate-400 text-[10px] uppercase">Template Outperformance</div>
              <div className="text-base font-bold text-[#00FF87] mt-0.5">+14.6 xPts / Mo</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0d1c2d] border border-white/8 col-span-2 sm:col-span-1">
              <div className="text-slate-400 text-[10px] uppercase">Global OR Rank</div>
              <div className="text-base font-bold text-[#38BDF8] mt-0.5">Top 1.4% Proven</div>
            </div>
          </div>
        </div>

        {/* Right: Login & Authentication Card */}
        <div className="lg:w-5/12 w-full max-w-md">
          <div className="rounded-2xl bg-[#0d1c2d] border border-white/12 shadow-2xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-xl">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00FF87] via-[#38BDF8] to-[#00FF87]"></div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                <span>TACTICAL ACCESS PORTAL</span>
                <span className="text-[#00FF87] font-semibold">ENCRYPTED</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white font-sans">
                Sign In to PLAYXI
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Access your starting XI cockpit, transfer solver &amp; live FDR matrix.
              </p>
            </div>

            {/* Auth Method Tabs: EMAIL vs PHONE */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#122131] border border-white/8 mb-6">
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={`flex items-center justify-center gap-2 py-2 rounded text-xs font-semibold transition-all cursor-pointer ${
                  authMethod === 'email'
                    ? 'bg-[#00FF87] text-[#051424] shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Address</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('phone')}
                className={`flex items-center justify-center gap-2 py-2 rounded text-xs font-semibold transition-all cursor-pointer ${
                  authMethod === 'phone'
                    ? 'bg-[#00FF87] text-[#051424] shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone Number</span>
              </button>
            </div>

            {/* Tab 1: Email Login Form */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 font-semibold mb-1">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="manager@premierleague.com"
                      className="w-full bg-[#162638] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-slate-300 font-semibold">PASSWORD / MASTER KEY</span>
                    <a href="#" className="text-[#00FF87] hover:underline text-[10px]">
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#162638] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87] font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-[#00FF87] hover:bg-[#00e478] text-[#051424] font-extrabold text-xs transition-all shadow-lg shadow-[#00FF87]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isLoading ? 'AUTHENTICATING...' : 'ENTER TACTICAL COCKPIT'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* Tab 2: Phone Login Form */}
            {authMethod === 'phone' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handlePhoneSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-300 font-semibold mb-1">
                        MOBILE PHONE NUMBER
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="w-24 bg-[#162638] border border-white/10 rounded-lg px-2 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#00FF87] cursor-pointer shrink-0"
                        >
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+61">🇦🇺 +61</option>
                          <option value="+353">🇮🇪 +353</option>
                          <option value="+47">🇳🇴 +47</option>
                        </select>
                        <div className="relative flex-1">
                          <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="7911 123456"
                            className="w-full bg-[#162638] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87] font-mono"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        We will send a 6-digit verification code via SMS.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-lg bg-[#00FF87] hover:bg-[#00e478] text-[#051424] font-extrabold text-xs transition-all shadow-lg shadow-[#00FF87]/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>SEND 6-DIGIT CODE</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePhoneVerify} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                        <span className="text-slate-300 font-semibold">ENTER SMS CODE</span>
                        <span className="text-[#00FF87] font-semibold">{countryCode} {phoneInput}</span>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {otpCode.map((digit, i) => (
                          <input
                            key={i}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                              const newOtp = [...otpCode];
                              newOtp[i] = e.target.value;
                              setOtpCode(newOtp);
                            }}
                            className="h-10 text-center font-mono font-bold text-sm bg-[#162638] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00FF87]"
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                        <span>Expires in 00:{timer < 10 ? `0${timer}` : timer}</span>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[#00FF87] hover:underline"
                        >
                          Change Number
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-lg bg-[#00FF87] hover:bg-[#00e478] text-[#051424] font-extrabold text-xs transition-all shadow-lg shadow-[#00FF87]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>{isLoading ? 'VERIFYING CODE...' : 'VERIFY & ENTER COCKPIT'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Instant Demo Access (Frictionless Testing) */}
            <div className="mt-5 pt-4 border-t border-white/8">
              <button
                type="button"
                onClick={handleOneClickDemo}
                className="w-full py-2.5 px-3 rounded-lg bg-[#162638] hover:bg-[#1e344e] text-slate-200 hover:text-white border border-white/10 text-xs font-mono font-semibold flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 text-left">
                  <div className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse"></div>
                  <div>
                    <div className="text-white text-[11px] font-bold font-sans">
                      One-Click Demo Account
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Alex Sterling (Top 1.4% OR)
                    </div>
                  </div>
                </div>
                <span className="text-[#00FF87] group-hover:translate-x-0.5 transition-transform text-xs">
                  Instant Access →
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer Bar */}
      <footer className="border-t border-white/8 py-6 px-6 sm:px-12 text-center text-xs text-slate-400 font-mono">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>PLAYXI v2.4 TAC • Premier League &amp; Fantasy Premier League Tactical Intelligence</div>
          <div className="flex items-center gap-6">
            <span>Server Cluster: EU-WEST-1</span>
            <span>Opta AI Grounding</span>
            <span>Privacy &amp; Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
