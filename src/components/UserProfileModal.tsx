import React, { useState } from 'react';
import {
  X,
  User,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Trash2,
  LogOut,
  LogIn,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LocalAuthManager } from '../services/LocalAuthManager';
import { resolveProductImage } from '../utils/productImageResolver';

export const UserProfileModal: React.FC = () => {
  const {
    isProfileOpen,
    setIsProfileOpen,
    setIsAuthOpen,
    setIsCartOpen,
    user,
    setUser,
    wishlist,
    toggleWishlist,
    addToCart,
    formatPrice,
    showToast,
    signOutUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'wishlist'>('wishlist');

  const isGuest = !user || user.id === 'usr-guest-00' || user.name === 'Guest Patron';

  const handleSaveProfileDetails = () => {
    if (!user) return;
    LocalAuthManager.setSession(user);
    showToast('Profile updated successfully', 'success');
  };

  if (!isProfileOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0f241a] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#275943] overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:px-6 bg-[#012d1d] text-[#FAF3E0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#fed65b] shadow"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel text-base sm:text-lg font-bold text-white">
                  {user.name}
                </h2>
                {!isGuest && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-[#fed65b] border border-[#fed65b]/40 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Verified Patron</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#fed65b]">
                {!isGuest
                  ? `Royal Harvest Patron • ${user.phone || user.email || 'Active'}`
                  : 'Guest Session • Browse & send enquiries on WhatsApp'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGuest ? (
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsAuthOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#fed65b] text-[#012d1d] text-xs font-bold hover:bg-[#ffe382] transition-colors flex items-center gap-1.5 shadow cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  signOutUser();
                  setIsProfileOpen(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}

            <button
              onClick={() => setIsProfileOpen(false)}
              className="p-1.5 rounded-full hover:bg-[#1b4332] text-slate-300 hover:text-white"
              aria-label="Close profile modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Wishlist & Profile only — Delivery Addresses & Order Tracking disabled) */}
        <div className="flex border-b border-slate-200 dark:border-[#275943] bg-slate-50 dark:bg-[#11241a] px-4 overflow-x-auto no-scrollbar gap-2 sm:gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'wishlist'
                ? 'border-[#012d1d] dark:border-[#fed65b] text-[#012d1d] dark:text-[#fed65b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Wishlist ({wishlist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'profile'
                ? 'border-[#012d1d] dark:border-[#fed65b] text-[#012d1d] dark:text-[#fed65b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Details</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 text-xs">
          {/* TAB 1: Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              {wishlist.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                  No items in wishlist yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {wishlist.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 bg-slate-50 dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943] flex items-center justify-between gap-3"
                    >
                      <img
                        src={resolveProductImage(prod)}
                        alt={prod.name}
                        className="w-14 h-14 rounded-xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {prod.name}
                        </h5>
                        <p className="text-[11px] text-[#012d1d] dark:text-[#fed65b] font-bold">
                          {formatPrice(prod.basePrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => addToCart(prod)}
                          className="p-2 bg-[#012d1d] text-[#fed65b] rounded-lg"
                          title="Add to Basket"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleWishlist(prod)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-[#FAF3E0] dark:bg-[#162f22] border border-[#e8dfc8] dark:border-[#275943] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-200">
                  <MessageCircle className="w-4 h-4 text-[#1ea952] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Ready to enquire? Add items to your basket and send your complete order list on
                    WhatsApp — only your mobile number is needed.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold shrink-0 cursor-pointer"
                >
                  Open Basket
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Profile Details */}
          {activeTab === 'profile' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number:
                </label>
                <input
                  type="tel"
                  value={user.phone}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#162f22] rounded-xl border border-slate-300 dark:border-[#275943] text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div className="p-4 bg-[#FAF3E0] dark:bg-[#162f22] rounded-2xl border border-[#e8dfc8] dark:border-[#275943] space-y-2">
                <div className="font-bold text-[#012d1d] dark:text-[#fed65b] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Direct WhatsApp Ordering</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  All BAAGFRESH orders are handled personally over WhatsApp. No delivery address,
                  online payment, or checkout form is collected on this website.
                </p>
              </div>

              <button
                onClick={handleSaveProfileDetails}
                className="px-6 py-2.5 bg-[#012d1d] text-[#fed65b] font-bold rounded-xl shadow-md hover:bg-[#144230] transition-colors cursor-pointer"
              >
                Save Mobile Number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
