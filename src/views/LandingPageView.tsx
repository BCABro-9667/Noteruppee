import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  Receipt,
  BarChart3,
  Smartphone,
  FileText,
  Send,
  HelpCircle,
  MapPin,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Printer,
  TrendingDown,
  Layers
} from 'lucide-react';

export const LandingPageView: React.FC = () => {
  const { login, register, demoLogin } = useAuth();

  // Auth Form State (Right side of Hero)
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('General Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        if (!name.trim()) {
          setAuthError('Please enter your full name');
          setAuthLoading(false);
          return;
        }
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          currencySymbol,
        });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await demoLogin();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to start demo session');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    setContactSubmitting(true);
    setTimeout(() => {
      setContactSubmitting(false);
      setContactSubmitted(true);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 800);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToAuth = () => {
    setMobileMenuOpen(false);
    const authCard = document.getElementById('hero-auth-card');
    if (authCard) {
      authCard.scrollIntoView({ behavior: 'smooth' });
      // Focus first input
      setTimeout(() => {
        const input = authCard.querySelector('input');
        if (input) input.focus();
      }, 500);
    }
  };

  const faqs = [
    {
      q: 'Is my financial data kept safe and private?',
      a: 'Yes, 100%. RupeeTrack is built with privacy-first client encryption and local-first persistence. Your ledgers, account numbers, and transaction notes are strictly isolated to your authenticated account and are never shared or sold to advertising networks.',
    },
    {
      q: 'Can I print or export formal statements of my expenses?',
      a: 'Absolutely! Every expense account has an integrated "Print Slip" feature that generates an official printable settlement slip with header details, summary statistics (Total, Expended, Remaining), and an itemized serial-numbered transaction table formatted perfectly for PDF saving and printing.',
    },
    {
      q: 'Does RupeeTrack work without an active internet connection?',
      a: 'Yes! RupeeTrack is a Progressive Web App (PWA). You can install it on your home screen or desktop. It uses client-side caching so you can record transactions offline, and changes are synced seamlessly once you reconnect.',
    },
    {
      q: 'Can I manage multiple independent expense accounts?',
      a: 'Yes. You can create separate ledgers for individual trips (e.g. Goa Trip, Manali Roadtrip), home grocery budgets, flatmate split expenses, office reimbursements, and client projects with dedicated starting balances.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* =========================================================================
          LANDING NAVBAR
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-xl transition-transform group-hover:scale-105">
              ₹
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                Rupee<span className="text-blue-600">Track</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-full">
                PWA
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('home')}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('why')}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              Why Us
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              Contact Us
            </button>
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={handleDemoAccess}
              disabled={authLoading}
              className="px-4 py-2.5 rounded-[50px] text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Explore Demo</span>
            </button>

            <button
              type="button"
              onClick={scrollToAuth}
              className="px-5 py-2.5 rounded-[50px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition active:scale-95 flex items-center gap-1.5"
            >
              <span>Sign In / Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-100 bg-white px-4 pt-2 pb-5 space-y-3">
            <button
              onClick={() => scrollToSection('home')}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('why')}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
            >
              Why Us
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
            >
              Contact Us
            </button>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full py-2.5 rounded-[50px] text-xs font-bold text-slate-800 bg-slate-100 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Instant Demo Mode</span>
              </button>
              <button
                type="button"
                onClick={scrollToAuth}
                className="w-full py-2.5 rounded-[50px] text-xs font-bold text-white bg-blue-600 flex items-center justify-center gap-1.5"
              >
                <span>Sign In or Register</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          1. HOME SECTION (Hero with Pitch on Left, Login/Register on Right)
         ========================================================================= */}
      <section id="home" className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 overflow-hidden">
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Value Proposition & Hero Info */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[50px] bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>The Modern Indian Expense Ledger & Statement Generator</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12]">
                Track every <span className="text-blue-600 underline decoration-blue-200 decoration-wavy decoration-2">single Rupee</span> with total clarity.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl leading-relaxed">
                Effortlessly manage multiple expense accounts for household budgets, group roadtrips,
                and business ledgers. Record <span className="font-bold text-slate-800">Liya</span> (Income)
                and <span className="font-bold text-slate-800">Diya</span> (Expense) transactions,
                generate official printable slips, and analyze spending habits anywhere—even offline.
              </p>

              {/* Feature Highlights List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Multi-Account Segregation</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Instant Printable PDF Slips</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>100% Offline-First PWA</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Zero Ads • 100% Private</span>
                </div>
              </div>

              {/* Quick Trust Badges */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-700">Sub-Second Entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-700">Mobile & Desktop PWA</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700">Client-Side Isolation</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Login and Register Form */}
            <div className="lg:col-span-5" id="hero-auth-card">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-900/10 border border-slate-200">
                {/* Card Header & 1-Click Demo Shortcut */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {mode === 'login' ? 'Welcome Back' : 'Create Free Account'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {mode === 'login' ? 'Sign in to access your ledgers' : 'Start tracking your expenses in seconds'}
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
                    ₹
                  </div>
                </div>

                {/* Instant Demo Banner */}
                <div className="mb-5 p-3 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-blue-950 truncate">Want a test drive?</p>
                      <p className="text-[11px] text-blue-700/90 truncate">Access pre-filled demo ledgers</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDemoAccess}
                    disabled={authLoading}
                    className="px-3.5 py-1.5 rounded-[50px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    1-Click Demo
                  </button>
                </div>

                {/* Login / Register Toggle Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-xl mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setAuthError(null);
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                      mode === 'login'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setAuthError(null);
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                      mode === 'register'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {/* Error Banner */}
                {authError && (
                  <div className="flex items-center gap-2 p-3 mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Vikram Verma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                          Phone (Optional)
                        </label>
                        <input
                          type="tel"
                          placeholder="+91..."
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                          Currency
                        </label>
                        <select
                          value={currencySymbol}
                          onChange={(e) => setCurrencySymbol(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                        >
                          <option value="₹">₹ (INR)</option>
                          <option value="$">$ (USD)</option>
                          <option value="€">€ (EUR)</option>
                          <option value="£">£ (GBP)</option>
                          <option value="د.إ">د.إ (AED)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-2 h-12 rounded-[50px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{authLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Account' : 'Create Free Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Encrypted local session • Zero data tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. SERVICES SECTION (What RupeeTrack provides)
         ========================================================================= */}
      <section id="services" className="py-16 sm:py-24 bg-slate-50/60 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[50px] bg-blue-100/70 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>Our Services & Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Everything You Need to Master Your Money
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base font-medium">
              Carefully engineered features designed around daily Indian cash flows, group expense
              splits, receipts, and professional financial slips.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Service 1: Multi-Account Management */}
            <div className="bg-white p-7 rounded-3xl shadow-sm hover:shadow-md transition border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-5">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Multi-Account Expense Ledgers
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Create isolated budgets for family expenses, Goa trips, kitchen groceries, office reimbursements,
                  or personal projects. Never mix unrelated funds again.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 gap-1">
                <span>Separate budget limits</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Service 2: Dual Liya & Diya Accounting */}
            <div className="bg-white p-7 rounded-3xl shadow-sm hover:shadow-md transition border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-5">
                  <TrendingDown className="w-6 h-6 rotate-180" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Liya & Diya Dual Ledger
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Speak the natural language of cashflow. Record money received or budgeted (<span className="font-semibold text-emerald-700">Liya</span>)
                  and money spent or disbursed (<span className="font-semibold text-rose-700">Diya</span>) with auto-computed remaining balance.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 gap-1">
                <span>Instant real-time math</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Service 3: Official Printable Slips */}
            <div className="bg-white p-7 rounded-3xl shadow-sm hover:shadow-md transition border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-5">
                  <Printer className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Printable Settlement Slips
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Need to settle with a roommate, client, or spouse? Generate a clean, official A4 printable slip
                  with serial numbers, timestamps, notes, and a clean tabular layout in 1 click.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 gap-1">
                <span>PDF export & direct print</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Service 4: Visual Analytics & Breakdown */}
            <div className="bg-white p-7 rounded-3xl shadow-sm hover:shadow-md transition border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold mb-5">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Visual Expense Analytics
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Uncover trends across food, travel, utilities, and entertainment. Visualize expenditure rates,
                  largest single debits, and remaining buffer at a single glance.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 gap-1">
                <span>Category charts & insights</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Service 5: Offline-First PWA */}
            <div className="bg-white p-7 rounded-3xl shadow-sm hover:shadow-md transition border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-5">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Progressive Web App (PWA)
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Install straight to your Android, iPhone, tablet, or Mac without downloading huge app store files.
                  Works flawlessly in low-connectivity areas with offline sync.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 gap-1">
                <span>Zero store bloat • Instant launch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Service 6: Receipt & Bill Proofs */}
            <div className="bg-white p-7 rounded-3xl shadow-sm hover:shadow-md transition border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-5">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Receipts & Payment Proofs
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Attach UPI transaction screenshots, invoice photos, and bill copies directly to any entry.
                  View them in full-screen zoom whenever you need proof of payment.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 gap-1">
                <span>Auditable invoice storage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. WHY US SECTION (Why Choose RupeeTrack)
         ========================================================================= */}
      <section id="why" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[50px] bg-blue-100/70 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Why Choose Us</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Why RupeeTrack Beats Complex Sheets & Generic Apps
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base font-medium">
              We eliminated the frustration of spreadsheets and intrusive loan-pushing bank apps.
              Here is how RupeeTrack is built differently.
            </p>
          </div>

          {/* Comparison Table Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* The Other Guys */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                  ✕
                </div>
                <h3 className="text-lg font-bold text-slate-800">Spreadsheets & Generic Budget Apps</h3>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-600 pt-2">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Clunky spreadsheet grids that are painful to edit on a mobile phone keyboard.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Constant spam notifications pushing high-interest personal loans and credit cards.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Fails to load without internet when you are in a basement market or mountain trip.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>No formatted printable slips for settling expenses with friends or flatmates.</span>
                </li>
              </ul>
            </div>

            {/* RupeeTrack */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-white">The RupeeTrack Experience</h3>
              </div>
              <ul className="space-y-3.5 text-sm text-blue-100 pt-2">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                  <span>Sub-second 1-tap entry designed natively for thumb navigation and fast typing.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                  <span>100% ad-free and loan-free. We never monetize or sell your personal data.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                  <span>Offline-first PWA architecture that records entries anywhere, anytime.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                  <span>Official printable slips with A4 PDF export and itemized transaction tables.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 4 Pillars Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100 text-center">
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-blue-600">₹10M+</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">Expenses Tracked</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Across diverse personal budgets</p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-blue-600">100%</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">Offline Capable</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Full local persistence</p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-blue-600">0</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">Intrusive Ads</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Pure financial focus</p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-black text-blue-600">&lt; 1s</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">Entry Speed</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Instant ledger recalculation</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. CONTACT US SECTION (Inquiries, Support & FAQs)
         ========================================================================= */}
      <section id="contact" className="py-16 sm:py-24 bg-slate-50/60 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[50px] bg-blue-100/70 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Us</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Have Questions? We Are Here to Help
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base font-medium">
              Reach out to our team with feedback, feature suggestions, or questions regarding account setup.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Contact Details & FAQs */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Get in Touch Directly</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Whether you have an idea for a new ledger feature or need assistance with data exports,
                  we are always excited to hear from you.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Email Inquiries</p>
                      <a href="mailto:support@rupeetrack.app" className="text-sm font-bold text-slate-900 hover:text-blue-600">
                        support@rupeetrack.app
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Support Hours</p>
                      <p className="text-sm font-bold text-slate-900">Monday – Saturday, 9am - 7pm IST</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Headquarters</p>
                      <p className="text-sm font-bold text-slate-900">Bangalore & New Delhi, India</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick FAQs */}
              <div className="pt-2">
                <h4 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>Frequently Asked Questions</span>
                </h4>
                <div className="space-y-2.5">
                  {faqs.map((faq, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                          className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-600 transition"
                        >
                          <span>{faq.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-50">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Send Us a Direct Message</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium">
                  Fill in your details below and we will respond to your email.
                </p>

                {contactSubmitted ? (
                  <div className="p-8 text-center bg-blue-50/70 border border-blue-100 rounded-2xl space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Message Delivered Successfully!</h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Thank you for contacting RupeeTrack. A member of our support engineering team will review
                      your message and get back to you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setContactSubmitted(false)}
                      className="mt-3 px-5 py-2 rounded-[50px] bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                          Your Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Ananya Sen"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Topic / Subject
                      </label>
                      <select
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Feature Suggestion">Feature Suggestion / Request</option>
                        <option value="Print / Slip Assistance">Print Slip & Statement Assistance</option>
                        <option value="PWA Installation Help">PWA Installation & Offline Sync</option>
                        <option value="Bug Report">Technical Bug Report</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Your Message <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Tell us what's on your mind, how we can help, or feature ideas you'd love to see..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={contactSubmitting}
                      className="w-full sm:w-auto px-8 h-12 rounded-[50px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {contactSubmitting ? (
                        <span>Sending Message...</span>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LANDING FOOTER
         ========================================================================= */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
              ₹
            </div>
            <span className="text-base font-black text-slate-900 tracking-tight">
              Rupee<span className="text-blue-600">Track</span>
            </span>
            <span className="text-xs text-slate-400 ml-2">
              © {new Date().getFullYear()} RupeeTrack. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-slate-500">
            <button onClick={() => scrollToSection('home')} className="hover:text-blue-600 transition">
              Home
            </button>
            <button onClick={() => scrollToSection('services')} className="hover:text-blue-600 transition">
              Services
            </button>
            <button onClick={() => scrollToSection('why')} className="hover:text-blue-600 transition">
              Why Us
            </button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-blue-600 transition">
              Contact Us
            </button>
            <button onClick={scrollToAuth} className="text-blue-600 font-bold hover:underline">
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
