import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { ADMIN_EMAILS } from '../lib/firebase';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Strict AdminRoute Guard:
 * Strictly enforces Firebase Authentication with Admin Role privileges for the Admin Portal.
 * Non-admins are isolated and cannot view admin controls.
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children, fallback }) => {
  const { 
    isAdminAuthenticated, 
    isAdminUser, 
    authLoading,
    setIsAdminOpen,
    showToast 
  } = useApp();

  const isVerifiedAdmin = Boolean(
    isAdminAuthenticated || 
    isAdminUser
  );

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#012d1d] dark:text-[#fed65b] animate-spin" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Verifying Firebase Admin Privileges...
        </p>
      </div>
    );
  }

  if (!isVerifiedAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-[#0f241a] rounded-3xl shadow-2xl border border-red-200 dark:border-red-900/50 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="font-cinzel text-lg font-bold text-slate-900 dark:text-white">
            Admin Access Restricted
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Firebase Authentication is strictly reserved for the BAAGFRESH Management Console. Please sign in with an authorized administrator account.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Authorized Admin Emails: {ADMIN_EMAILS[0]}</span>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => setIsAdminOpen(false)}
            className="w-full py-2.5 px-4 bg-[#012d1d] hover:bg-[#13402e] text-[#fed65b] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Store</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
