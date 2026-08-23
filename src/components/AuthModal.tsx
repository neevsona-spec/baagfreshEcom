import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Loader2,
  Phone,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LocalAuthManager } from '../services/LocalAuthManager';

export const AuthModal: React.FC = () => {
  const { 
    isAuthOpen, 
    setIsAuthOpen, 
    user, 
    setUser,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isGuest = !user || user.id === 'usr-guest-00' || user.name === 'Guest Patron' || !user.email;

  const handleCustomerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContact = emailOrPhone.trim();
    const cleanName = name.trim();
    const cleanPass = password.trim();

    if (!cleanContact) {
      setError('Please enter your email address or mobile number.');
      return;
    }

    if (mode === 'signup' && !cleanName) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const result = LocalAuthManager.register({
          name: cleanName,
          emailOrPhone: cleanContact,
          password: cleanPass
        });

        if (!result.success || !result.user) {
          setError(result.message || 'Could not create account. Please try again.');
          return;
        }

        setUser(result.user);
        showToast(`Welcome to BAAGFRESH, ${result.user.name}!`, 'success');
        setIsAuthOpen(false);
      } else {
        const result = LocalAuthManager.login({
          emailOrPhone: cleanContact,
          password: cleanPass
        });

        if (!result.success || !result.user) {
          setError(result.message || 'Could not sign in. Please check your credentials.');
          return;
        }

        setUser(result.user);
        showToast(`Welcome back, ${result.user.name}!`, 'success');
        setIsAuthOpen(false);
      }
    } catch (err: any) {
      console.error('Customer Auth Notice:', err);
      setError(err?.message || 'Unable to complete sign-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    LocalAuthManager.clearSession();
    setUser(null);
    showToast('Signed out successfully', 'info');
    setIsAuthOpen(false);
  };

  if (!isAuthOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#0f241a] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#275943] overflow-hidden my-auto max-h-[94vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Modal Top Banner */}
        <div className="p-5 sm:p-6 bg-[#012d1d] text-[#FAF3E0] relative border-b border-[#1b4332] shrink-0">
          <button
            onClick={() => setIsAuthOpen(false)}
            className="absolute top-4 right-4 p-2 text-[#fed65b] hover:bg-white/10 rounded-full transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Close"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 id="auth-modal-title" className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide pr-8">
            {!isGuest
              ? 'Your Patron Account' 
              : mode === 'signup' 
                ? 'Create Customer Account' 
                : 'Sign In to BAAGFRESH'}
          </h3>
          <p className="text-xs text-slate-300 mt-1 font-sans">
            {!isGuest
              ? 'Manage your orders, saved delivery addresses, and royal benefits.'
              : mode === 'signup'
                ? 'Instant account setup for simple ordering, tracking, and rewards.'
                : 'Enter your Mobile or Email to access your order history.'}
          </p>

          {/* Clean Segmented Tab Switcher */}
          {isGuest && (
            <div className="flex bg-[#032014] p-1 rounded-xl mt-4 border border-[#1b4332]">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-[#fed65b] text-[#012d1d] shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#fed65b] text-[#012d1d] shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* If already signed in */}
          {!isGuest && user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-[#153424] border border-emerald-200 dark:border-emerald-800 flex items-center gap-4">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#fed65b] shadow"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {user.name}
                    </h4>
                    <span className="inline-flex p-0.5 rounded-full bg-emerald-600 text-white">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email || user.phone || 'Royal Member'}
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium">
                    Active Session • Member since {user.memberSince || '2024'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-bold border border-red-200 dark:border-red-800 transition-colors cursor-pointer active:scale-[0.99]"
              >
                <LogOut className="w-4 h-4" />
                <span>{loading ? 'Signing out...' : 'Sign Out of Account'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Status and Error Alerts */}
              {error && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2 animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium leading-relaxed">{error}</span>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                  <span className="leading-relaxed">{successMessage}</span>
                </div>
              )}

              {/* Direct Customer Sign In / Sign Up Form (No Firebase barrier) */}
              <form onSubmit={handleCustomerAuth} className="space-y-3.5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Neev Sona"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#153123] border border-slate-200 dark:border-[#2c5f48] focus:border-[#012d1d] dark:focus:border-[#fed65b] focus:outline-none text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Mobile Number or Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="e.g. 9876543210 or yourname@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#153123] border border-slate-200 dark:border-[#2c5f48] focus:border-[#012d1d] dark:focus:border-[#fed65b] focus:outline-none text-slate-800 dark:text-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    No OTP verification required. Instant sign-in.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      PIN / Password <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Set an optional 4-digit PIN or password"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#153123] border border-slate-200 dark:border-[#2c5f48] focus:border-[#012d1d] dark:focus:border-[#fed65b] focus:outline-none text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 min-h-[44px] bg-[#012d1d] hover:bg-[#13402e] text-[#fed65b] text-xs font-bold rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#fed65b]" />
                  ) : (
                    <>
                      <span>{mode === 'signup' ? 'Create Account & Continue' : 'Instant Sign In'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>


              {/* Mode switch */}
              <div className="flex items-center justify-between text-xs pt-1">
                {mode === 'signin' ? (
                  <>
                    <span className="text-slate-500 dark:text-slate-400">New customer?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="font-bold text-[#012d1d] dark:text-[#fed65b] hover:underline cursor-pointer"
                    >
                      Create an Account
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-slate-500 dark:text-slate-400">Already registered?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="font-bold text-[#012d1d] dark:text-[#fed65b] hover:underline cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Clean Security Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-[#1a382a] shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fast & Private Guest / Patron Access</span>
          </div>
        </div>
      </div>
    </div>
  );
};
