import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useExpense } from '../context/ExpenseContext.tsx';
import { DebitTerminology, CreditTerminology } from '../types/index.ts';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Settings,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Coins,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

const CURRENCIES = [
  { symbol: '₹', code: 'INR', label: 'Indian Rupee (₹)' },
  { symbol: '$', code: 'USD', label: 'US Dollar ($)' },
  { symbol: '€', code: 'EUR', label: 'Euro (€)' },
  { symbol: '£', code: 'GBP', label: 'British Pound (£)' },
  { symbol: '¥', code: 'JPY', label: 'Japanese Yen (¥)' },
  { symbol: 'د.إ', code: 'AED', label: 'UAE Dirham (د.إ)' },
  { symbol: 'C$', code: 'CAD', label: 'Canadian Dollar (C$)' },
  { symbol: 'A$', code: 'AUD', label: 'Australian Dollar (A$)' },
];

export const ProfileSettingsView: React.FC = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { uploadReceipt } = useExpense();

  // Section A: Personal Details state
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Section B: Transaction Settings state
  const [debitLabel, setDebitLabel] = useState<DebitTerminology>(user?.settings?.debitLabel || 'Debit');
  const [creditLabel, setCreditLabel] = useState<CreditTerminology>(user?.settings?.creditLabel || 'Credit');
  const [currencySymbol, setCurrencySymbol] = useState(user?.settings?.currencySymbol || '₹');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Section C: Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Photo Upload (Supports Cloudinary & local store)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setProfileError('Avatar image must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        setProfileSaving(true);
        const uploadedUrl = await uploadReceipt(base64);
        setAvatarUrl(uploadedUrl);
        await updateProfile({ avatarUrl: uploadedUrl });
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      } catch (err: any) {
        setProfileError(err.message || 'Failed to upload photo');
      } finally {
        setProfileSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Personal Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError('Full name cannot be empty');
      return;
    }

    setProfileError(null);
    setProfileSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        location: location.trim(),
        avatarUrl,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3500);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update personal details');
    } finally {
      setProfileSaving(false);
    }
  };

  // Save Transaction Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      await updateProfile({
        settings: {
          debitLabel,
          creditLabel,
          currencySymbol,
        },
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Save Password Change
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setPasswordError(null);
    setPasswordSaving(true);
    try {
      await changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3500);
    } catch (err: any) {
      setPasswordError(err.message || 'Incorrect old password or request failed');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Tab state: 'profile' | 'terminology' | 'security'
  const [activeTab, setActiveTab] = useState<'profile' | 'terminology' | 'security'>('profile');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal profile, customized transaction terminology, and security preferences.
          </p>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[50px] text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-0 bg-rose-50/70 transition self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-[50px] overflow-x-auto border-0">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[50px] text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap border-0 ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terminology')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[50px] text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap border-0 ${
            activeTab === 'terminology'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Transaction & Currency</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[50px] text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap border-0 ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* SECTION A: Personal Details Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-2xs border-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Personal Details</h2>
              <p className="text-xs text-slate-400">View and update your personal information</p>
            </div>
          </div>
          {profileSuccess && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved Successfully!
            </span>
          )}
        </div>

        {profileError && (
          <div className="flex items-center gap-2 p-3 mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Avatar Upload Preview */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`}
                alt="Profile photo"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500/30 shadow-md bg-blue-50"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-[50px] border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                Change Photo
              </button>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports Cloudinary & local storage. JPG, PNG under 8MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[50px] border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-4 py-2.5 rounded-[50px] border border-slate-200 bg-slate-50 text-sm font-medium text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 absolute right-4 top-1/2 -translate-y-1/2">
                  Account Primary
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-[50px] border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Mumbai, New Delhi, Bengaluru"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-[50px] border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-2.5 rounded-[50px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {profileSaving ? 'Saving...' : 'Save Personal Details'}
            </button>
          </div>
        </form>
      </div>
      )}

      {/* SECTION B: Transaction Settings Tab */}
      {activeTab === 'terminology' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-2xs border-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Transaction & Currency Settings</h2>
                <p className="text-xs text-slate-400">
                  Customize Debit/Credit terminology (Take/Give, Liya/Diya) and currency symbol
                </p>
              </div>
            </div>
            {settingsSuccess && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Settings Updated!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Debit Terminology Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Debit Dropdown (Money Out)
                </label>
                <select
                  value={debitLabel}
                  onChange={(e) => setDebitLabel(e.target.value as DebitTerminology)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-rose-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="Debit">Debit</option>
                  <option value="Take">Take</option>
                  <option value="Liya">Liya</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Reflected in forms, lists, and summary cards.
                </p>
              </div>

              {/* Credit Terminology Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Credit Dropdown (Money In)
                </label>
                <select
                  value={creditLabel}
                  onChange={(e) => setCreditLabel(e.target.value as CreditTerminology)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-emerald-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="Credit">Credit</option>
                  <option value="Give">Give</option>
                  <option value="Diya">Diya</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Reflected in forms, lists, and summary cards.
                </p>
              </div>

              {/* Currency Symbol Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Currency Symbol Dropdown
                </label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.symbol} value={curr.symbol}>
                      {curr.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Default: Indian Rupee (₹).
                </p>
              </div>
            </div>

            {/* Live Preview Demonstration Card */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Live Preview of your chosen terms:
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-[50px] bg-white border border-rose-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-rose-600">{debitLabel} (Out): −{currencySymbol}1,500</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-[50px] bg-white border border-emerald-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600">{creditLabel} (In): +{currencySymbol}5,000</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={settingsSaving}
                className="px-6 py-2.5 rounded-[50px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {settingsSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION C: Security Settings – Change Password Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-2xs border-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Security Settings – Change Password</h2>
                <p className="text-xs text-slate-400">
                  Verify old password and confirm new password
                </p>
              </div>
            </div>
            {passwordSuccess && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Password Changed!
              </span>
            )}
          </div>

          {passwordError && (
            <div className="flex items-center gap-2 p-3 mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Enter Old Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[50px] border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Enter New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[50px] border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-[50px] border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-6 py-2.5 rounded-[50px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {passwordSaving ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
