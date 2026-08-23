import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Sparkles, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Cloud,
  LogOut,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signInAsGuest,
  sendPasswordResetLink,
  logOut,
  ADMIN_EMAILS
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

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'guest'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleOpenInNewTab = () => {
    try {
      window.open(window.location.href, '_blank');
      showToast('Opened in dedicated window for direct Google authentication.', 'info');
    } catch {
      window.location.reload();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setError(null);
    authLogger.startSession('Password Reset Request');
    try {
      await sendPasswordResetLink(email);
      setSuccessMessage(`Password recovery link dispatched to ${email}. Please check your inbox.`);
      showToast('Password reset link sent to your email', 'success');
      authLogger.endSession('success', `Password reset dispatched to ${email}`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      authLogger.logError(err, 'Password Reset');
      authLogger.endSession('failed');
      setSuccessMessage(`If ${email} is registered, a password reset link has been dispatched.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
        showToast(`Welcome Administrator (${userEmail})! Admin controls unlocked.`, 'success');
      } else {
        setUser((prev) => ({
          ...prev,
          id: fbUser.uid,
          name: fbUser.displayName || prev.name,
          email: userEmail || prev.email,
          avatar: fbUser.photoURL || prev.avatar
        }));
        authLogger.logSessionHydration(userEmail, 'customer', true);
        showToast('Welcome to BAAGFRESH! Signed in with Google.', 'success');
      }

      authLogger.endSession('success', `Authenticated as ${userEmail}`);
      setIsAuthOpen(false);
    } catch (err: any) {
      console.warn('Google Sign In Notice:', err);
      authLogger.logError(err, 'Google Credential Verification');
      authLogger.endSession('failed');
      
      const errMsg = err?.message || 'Failed to complete Google verification.';
      setError(errMsg);
      showToast('Google Sign-In notice: popup may be blocked by browser.', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    authLogger.startSession(mode === 'signup' ? 'Email Registration' : 'Email Sign-In');

    try {
      let fbUser;
      if (mode === 'signup') {
        fbUser = await signUpWithEmail(email, password, name || 'Royal Patron');
        showToast('Account created successfully in Firebase!', 'success');
      } else {
        fbUser = await signInWithEmail(email, password);
        showToast('Welcome back to BAAGFRESH!', 'success');
      }

      const userEmail = (fbUser?.email || '').toLowerCase().trim();
      const isWhitelisted = Boolean(userEmail && ADMIN_EMAILS.includes(userEmail));
      authLogger.logPrivilegeCheck(userEmail, isWhitelisted, false);

      if (isWhitelisted) {
        setIsAdminAuthenticated(true);
      }

      authLogger.logSessionHydration(userEmail, isWhitelisted ? 'superadmin' : 'customer', true);
      authLogger.endSession('success', `User ${userEmail} authenticated via email`);
      setIsAuthOpen(false);
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      authLogger.logError(err, 'Email Authentication');
      authLogger.endSession('failed');

      let msg = err?.message || 'Authentication failed.';
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please verify your credentials or create a new account.';
      } else if (err?.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError(null);
    authLogger.startSession('Anonymous Guest Sign-In');

    try {
      await signInAsGuest();
      authLogger.logSessionHydration('guest-anonymous', 'guest', false);
      authLogger.endSession('success', 'Guest signed in anonymously');
      showToast('Signed in as Guest Patron. Orders will be saved to your session!', 'info');
      setIsAuthOpen(false);
    } catch (err: any) {
      console.error('Guest Auth Error:', err);
      authLogger.logError(err, 'Anonymous Guest Login');
      authLogger.endSession('failed');
      setError(err?.message || 'Failed to initialize guest session.');
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0f241a] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#275943] overflow-hidden my-auto">
        {/* Modal Top Banner */}
        <div className="p-6 bg-[#012d1d] text-[#FAF3E0] relative border-b border-[#1b4332]">
          <button
            onClick={() => setIsAuthOpen(false)}
            className="absolute top-4 right-4 p-2 text-[#fed65b] hover:bg-white/10 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#fed65b]/20 text-[#fed65b] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 border border-[#fed65b]/30">
              <Cloud className="w-3 h-3" />
              <span>Firebase Cloud Auth</span>
            </span>
          </div>

          <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide">
            {firebaseUser && !firebaseUser.isAnonymous 
              ? 'Your Royal Account' 
              : mode === 'signup' 
                ? 'Join Royal Patronage' 
                : 'Welcome to BAAGFRESH'}
          </h3>
          <p className="text-xs text-slate-300 mt-1 font-sans">
            {firebaseUser && !firebaseUser.isAnonymous
              ? 'Manage your synchronized orders, addresses, and wishlist in Cloud Firestore.'
              : 'Sign in to access your saved addresses, live tracking, and member-exclusive harvests.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* If already signed in with Google or Email */}
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
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                    <Database className="w-3 h-3" />
                    <span>Firestore Synced</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#122b1e] rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-1.5 border border-slate-200 dark:border-[#275943]">
                <div className="flex justify-between">
                  <span className="text-slate-400">UID:</span>
                  <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300">{firebaseUser.uid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Auth Method:</span>
                  <span className="font-medium capitalize text-slate-800 dark:text-slate-200">
                    {firebaseUser.providerData[0]?.providerId === 'google.com' ? 'Google Account' : 'Password Auth'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-bold border border-red-200 dark:border-red-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{loading ? 'Signing out...' : 'Sign Out of Account'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Status and Error Alerts */}
              {error && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium">{error}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="text-[11px] font-bold text-[#012d1d] dark:text-[#fed65b] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in New Window</span>
                    </button>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300">
                      Standard Patron Auth
                    </span>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {mode === 'forgot' ? (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="patron@baagfresh.in"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#153123] border border-slate-200 dark:border-[#2c5f48] focus:border-[#012d1d] dark:focus:border-[#fed65b] focus:outline-none text-slate-800 dark:text-white"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#012d1d] hover:bg-[#13402e] text-[#fed65b] text-xs font-bold rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all mt-2"
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
                    className="w-full text-center py-2 text-xs font-semibold text-[#012d1d] dark:text-[#fed65b] hover:underline"
                  >
                    Back to Sign In
                  </button>
                </form>
              ) : (
                <>
                  {/* Primary Google Sign-in Button */}
                  <div className="space-y-2">
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white dark:bg-[#183a2a] hover:bg-slate-50 dark:hover:bg-[#1f4a36] text-slate-800 dark:text-white text-xs sm:text-sm font-bold border border-slate-300 dark:border-[#2f664e] shadow-sm hover:shadow transition-all group active:scale-[0.99] cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-[#012d1d] dark:text-[#fed65b]" />
                          <span>Verifying Credentials with Google...</span>
                        </>
                      ) : (
                        <>
                          {/* Official Google SVG Icon */}
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
                          <span>Continue with Google</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <button
                        type="button"
                        onClick={handleOpenInNewTab}
                        className="hover:underline flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open in Dedicated Tab</span>
                      </button>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Secure OAuth 2.0</span>
                      </span>
                    </div>
                  </div>

                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-slate-200 dark:border-[#275943] w-full" />
                    <span className="bg-white dark:bg-[#0f241a] px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider absolute">
                      Or with email
                    </span>
                  </div>

                  {/* Email Form */}
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
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Maharani Ananya"
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
                          placeholder="patron@baagfresh.in"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#153123] border border-slate-200 dark:border-[#2c5f48] focus:border-[#012d1d] dark:focus:border-[#fed65b] focus:outline-none text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Password
                        </label>
                        {mode === 'signin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setMode('forgot');
                              setError(null);
                              setSuccessMessage(null);
                            }}
                            className="text-[10px] font-semibold text-[#012d1d] dark:text-[#fed65b] hover:underline"
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
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#153123] border border-slate-200 dark:border-[#2c5f48] focus:border-[#012d1d] dark:focus:border-[#fed65b] focus:outline-none text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-[#012d1d] hover:bg-[#13402e] text-[#fed65b] text-xs font-bold rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all mt-2"
                    >
                      <span>{loading ? 'Please wait...' : mode === 'signup' ? 'Create Account & Encrypt Vault' : 'Sign In'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* Mode switch */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    {mode === 'signin' ? (
                      <>
                        <span className="text-slate-500 dark:text-slate-400">Don't have an account?</span>
                        <button
                          onClick={() => setMode('signup')}
                          className="font-bold text-[#012d1d] dark:text-[#fed65b] hover:underline"
                        >
                          Create Account
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-500 dark:text-slate-400">Already registered?</span>
                        <button
                          onClick={() => setMode('signin')}
                          className="font-bold text-[#012d1d] dark:text-[#fed65b] hover:underline"
                        >
                          Sign In here
                        </button>
                      </>
                    )}
                  </div>

                  {/* Guest / Demo Option */}
                  <div className="pt-2 border-t border-slate-100 dark:border-[#1e4433]">
                    <button
                      type="button"
                      onClick={handleGuestSignIn}
                      disabled={loading}
                      className="w-full py-2 text-center text-xs text-slate-500 dark:text-slate-400 hover:text-[#012d1d] dark:hover:text-[#fed65b] transition-colors font-medium"
                    >
                      Explore as Guest Patron (Anonymous Auth) →
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Security & Firestore Badge */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secured with Firebase Auth & Cloud Firestore Rules</span>
          </div>
        </div>
      </div>
    </div>
  );
};
