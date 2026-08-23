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
  ExternalLink,
  Loader2,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  sendPasswordResetLink,
  logOut,
  ADMIN_EMAILS,
  syncUserProfile
} from '../lib/firebase';
import { authLogger } from '../utils/authLogger';

export const AuthModal: React.FC = () => {
  const { 
    isAuthOpen, 
    setIsAuthOpen, 
    user, 
    setUser,
    showToast,
    firebaseUser,
    setIsAdminAuthenticated 
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Client-side email validation helper
  const isValidEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleOpenInNewTab = () => {
    try {
      window.open(window.location.href, '_blank');
      showToast('Opened in dedicated window.', 'info');
    } catch {
      window.location.reload();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    authLogger.startSession('Password Reset Request');

    try {
      await sendPasswordResetLink(cleanEmail);
      setSuccessMessage(`Password recovery link dispatched to ${cleanEmail}. Please check your inbox.`);
      showToast('Password reset link sent to your email', 'success');
      authLogger.endSession('success', `Password reset dispatched to ${cleanEmail}`);
    } catch (err: any) {
      console.error('Password reset notice:', err);
      authLogger.logError(err, 'Password Reset');
      authLogger.endSession('failed');

      if (err?.code === 'auth/user-not-found') {
        setError('No account found with this email. Please check your spelling or register a new account.');
      } else if (err?.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setSuccessMessage(`If an account exists for ${cleanEmail}, a password recovery link has been dispatched.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    authLogger.startSession('Google Popup Sign-In');

    try {
      const fbUser = await signInWithGoogle();
      const userEmail = (fbUser?.email || '').toLowerCase().trim();
      
      const isWhitelisted = Boolean(userEmail && ADMIN_EMAILS.includes(userEmail));
      authLogger.logPrivilegeCheck(userEmail, isWhitelisted, false);

      if (isWhitelisted) {
        setIsAdminAuthenticated(true);
        setUser((prev) => ({
          ...prev,
          id: fbUser.uid,
          name: fbUser.displayName || 'Master Administrator',
          email: userEmail,
          avatar: fbUser.photoURL || prev.avatar,
          memberSince: 'Founding Administrator'
        }));
        authLogger.logSessionHydration(userEmail, 'superadmin', true);
        showToast(`Welcome Administrator (${userEmail})!`, 'success');
      } else {
        const synced = await syncUserProfile(fbUser);
        setUser(synced);
        authLogger.logSessionHydration(userEmail, 'customer', true);
        showToast('Welcome to BAAGFRESH! Signed in with Google.', 'success');
      }

      authLogger.endSession('success', `Authenticated as ${userEmail}`);
      setIsAuthOpen(false);
    } catch (err: any) {
      console.warn('Google Sign In Notice:', err);
      authLogger.logError(err, 'Google Credential Verification');
      authLogger.endSession('failed');
      
      let errMsg = 'Google Sign-in could not be completed. Please try with your email and password below.';
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.toLowerCase().includes('closed')) {
        errMsg = 'Authentication window was closed. Please try again or create an account with email below.';
      } else if (err?.code === 'auth/popup-blocked' || err?.message?.toLowerCase().includes('blocked')) {
        errMsg = 'Pop-up blocked by browser. Please use email registration below or allow popups.';
      } else if (err?.code === 'auth/cancelled-popup-request') {
        errMsg = 'Sign-in attempt was superseded. Please try again.';
      } else if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain') || err?.message?.includes('pending authorization')) {
        errMsg = 'Google authentication for this domain is processing. You can quickly register or sign in with your email and password below.';
        if (mode === 'signin') {
          // Keep on signin or signup for email
        }
      } else if (err?.code === 'auth/network-request-failed') {
        errMsg = 'Network connection issue. Please check your internet connection and try again.';
      } else if (err?.message) {
        errMsg = err.message;
      }

      setError(errMsg);
      showToast(errMsg, 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password;
    const cleanName = name.trim();

    if (!cleanEmail || !cleanPass) {
      setError('Please fill in your email address and password.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (cleanPass.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (mode === 'signup' && confirmPassword && cleanPass !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    setError(null);
    authLogger.startSession(mode === 'signup' ? 'Email Registration' : 'Email Sign-In');

    try {
      let fbUser;
      if (mode === 'signup') {
        fbUser = await signUpWithEmail(cleanEmail, cleanPass, cleanName || 'Royal Patron');
        showToast('Account created successfully! Welcome to BAAGFRESH.', 'success');
      } else {
        fbUser = await signInWithEmail(cleanEmail, cleanPass);
        showToast('Welcome back to BAAGFRESH!', 'success');
      }

      const userEmail = (fbUser?.email || '').toLowerCase().trim();
      const isWhitelisted = Boolean(userEmail && ADMIN_EMAILS.includes(userEmail));
      authLogger.logPrivilegeCheck(userEmail, isWhitelisted, false);

      if (isWhitelisted) {
        setIsAdminAuthenticated(true);
      }

      // Proactively hydrate user state
      const userProfile = await syncUserProfile(fbUser);
      setUser(userProfile);

      authLogger.logSessionHydration(userEmail, isWhitelisted ? 'superadmin' : 'customer', true);
      authLogger.endSession('success', `User ${userEmail} authenticated via email`);
      setIsAuthOpen(false);
    } catch (err: any) {
      console.error('Email Auth Notice:', err);
      authLogger.logError(err, 'Email Authentication');
      authLogger.endSession('failed');

      let msg = 'Authentication failed. Please check your details and try again.';
      if (
        err?.code === 'auth/user-not-found' || 
        err?.code === 'auth/wrong-password' || 
        err?.code === 'auth/invalid-credential'
      ) {
        msg = 'Invalid email or password. Please verify your credentials or create a new account.';
      } else if (err?.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please switch to Sign In or reset your password.';
        setMode('signin');
      } else if (err?.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err?.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters with a combination of letters and numbers.';
      } else if (err?.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please wait a moment and try again.';
      } else if (err?.code === 'auth/network-request-failed') {
        msg = 'Network connection issue. Please check your internet connection and try again.';
      } else if (err?.message) {
        msg = err.message;
      }

      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    authLogger.startSession('Account Sign-Out');

    try {
      await logOut();
      authLogger.endSession('success', 'User signed out successfully');
      showToast('Signed out of BAAGFRESH account', 'info');
      setIsAuthOpen(false);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      authLogger.logError(err, 'Sign Out');
      authLogger.endSession('failed');
      showToast('Error signing out', 'error');
    } finally {
      setLoading(false);
    }
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
            {firebaseUser && !firebaseUser.isAnonymous 
              ? 'Your Account' 
              : mode === 'signup' 
                ? 'Create New Account' 
                : mode === 'forgot'
                  ? 'Reset Password'
                  : 'Welcome to BAAGFRESH'}
          </h3>
          <p className="text-xs text-slate-300 mt-1 font-sans">
            {firebaseUser && !firebaseUser.isAnonymous
              ? 'Manage your orders, saved addresses, and member benefits.'
              : mode === 'signup'
                ? 'Register with Google or your email for exclusive harvests, fast checkout, and order tracking.'
                : 'Sign in to access your orders, live tracking, and saved addresses.'}
          </p>

          {/* Clean Segmented Tab Switcher for Sign In / Sign Up */}
          {(!firebaseUser || firebaseUser.isAnonymous) && mode !== 'forgot' && (
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

        {/* Content Body with smooth responsive scroll */}
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* If already signed in */}
          {firebaseUser && !firebaseUser.isAnonymous ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-[#153424] border border-emerald-200 dark:border-emerald-800 flex items-center gap-4">
                <img
                  src={user?.avatar || firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={user?.name || 'User Avatar'}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#fed65b] shadow"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {user?.name || firebaseUser.displayName || 'Royal Patron'}
                    </h4>
                    <span className="inline-flex p-0.5 rounded-full bg-emerald-600 text-white">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {firebaseUser.email}
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium">
                    Verified Account
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

              {mode === 'forgot' ? (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#153123] border border-slate-200 dark:border-[#2c5f48] focus:border-[#012d1d] dark:focus:border-[#fed65b] focus:outline-none text-slate-800 dark:text-white"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 min-h-[44px] bg-[#012d1d] hover:bg-[#13402e] text-[#fed65b] text-xs font-bold rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#fed65b]" />
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full text-center py-2 text-xs font-semibold text-[#012d1d] dark:text-[#fed65b] hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </form>
              ) : (
                <>
                  {/* Google Sign-in Button */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 min-h-[44px] rounded-2xl bg-white dark:bg-[#183a2a] hover:bg-slate-50 dark:hover:bg-[#1f4a36] text-slate-800 dark:text-white text-xs sm:text-sm font-bold border border-slate-300 dark:border-[#2f664e] shadow-sm hover:shadow transition-all group active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-[#012d1d] dark:text-[#fed65b]" />
                          <span>Connecting with Google...</span>
                        </>
                      ) : (
                        <>
                          {/* Google Icon */}
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            />
                          </svg>
                          <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative flex items-center justify-center my-2 sm:my-3">
                    <div className="border-t border-slate-200 dark:border-[#275943] w-full" />
                    <span className="bg-white dark:bg-[#0f241a] px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider absolute">
                      {mode === 'signup' ? 'Or register with email' : 'Or sign in with email'}
                    </span>
                  </div>

                  {/* Email & Password Form */}
                  <form onSubmit={handleEmailAuth} className="space-y-3">
                    {mode === 'signup' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#153123] border border-slate-200 dark:border-[#2c5f48] focus:border-[#012d1d] dark:focus:border-[#fed65b] focus:outline-none text-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#153123] border border-slate-200 dark:border-[#2c5f48] focus:border-[#012d1d] dark:focus:border-[#fed65b] focus:outline-none text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Password {mode === 'signup' && <span className="text-slate-400 font-normal">(min 6 characters)</span>}
                        </label>
                        {mode === 'signin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setMode('forgot');
                              setError(null);
                              setSuccessMessage(null);
                            }}
                            className="text-[10px] font-semibold text-[#012d1d] dark:text-[#fed65b] hover:underline cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          minLength={6}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#153123] border border-slate-200 dark:border-[#2c5f48] focus:border-[#012d1d] dark:focus:border-[#fed65b] focus:outline-none text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    {mode === 'signup' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            minLength={6}
                            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#153123] border focus:outline-none text-slate-800 dark:text-white ${
                              confirmPassword && password && confirmPassword === password
                                ? 'border-emerald-500 focus:border-emerald-500'
                                : 'border-slate-200 dark:border-[#2c5f48] focus:border-[#012d1d] dark:focus:border-[#fed65b]'
                            }`}
                          />
                        </div>
                        {confirmPassword && password && confirmPassword === password && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1">
                            <Check className="w-3 h-3" />
                            <span>Passwords match</span>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 min-h-[44px] bg-[#012d1d] hover:bg-[#13402e] text-[#fed65b] text-xs font-bold rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#fed65b]" />
                      ) : (
                        <>
                          <span>{mode === 'signup' ? 'Complete Registration' : 'Sign In'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Mode switch helper text */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    {mode === 'signin' ? (
                      <>
                        <span className="text-slate-500 dark:text-slate-400">New to BAAGFRESH?</span>
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
            </>
          )}

          {/* Clean Security Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-[#1a382a] shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit Encrypted & Secure Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};

