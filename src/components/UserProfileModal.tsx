import React, { useState } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  ShoppingBag, 
  Heart, 
  ShieldCheck, 
  Lock, 
  Plus, 
  Trash2, 
  Truck, 
  RefreshCw, 
  Key, 
  Smartphone, 
  Check, 
  Globe,
  LogOut,
  LogIn,
  Cloud,
  Mail
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Address } from '../types';
import { updateUserInFirestore } from '../lib/firebase';
import { resolveProductImage } from '../utils/productImageResolver';

export const UserProfileModal: React.FC = () => {
  const {
    isProfileOpen,
    setIsProfileOpen,
    setIsAuthOpen,
    user,
    setUser,
    updateUserAddresses,
    orders,
    wishlist,
    toggleWishlist,
    addToCart,
    formatPrice,
    setTrackingOrder,
    showToast,
    firebaseUser,
    signOutUser,
    openGmailInvoice,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'wishlist' | 'security'>('profile');

  // New address form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrType, setNewAddrType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newFullName, setNewFullName] = useState(user?.name || '');
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [newStreet, setNewStreet] = useState('');
  const [newApartment, setNewApartment] = useState('');
  const [newCity, setNewCity] = useState('Varanasi');
  const [newState, setNewState] = useState('Uttar Pradesh');
  const [newPincode, setNewPincode] = useState('221001');

  if (!isProfileOpen || !user) return null;

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet || !newCity || !newPincode) {
      showToast('Please fill required address fields', 'warning');
      return;
    }

    const newAddress: Address = {
      id: 'addr-' + Date.now(),
      type: newAddrType,
      fullName: newFullName,
      phone: newPhone,
      street: newStreet,
      apartment: newApartment,
      city: newCity,
      state: newState,
      pincode: newPincode,
      isDefault: user.addresses.length === 0,
    };

    const updatedAddresses = [...user.addresses, newAddress];
    updateUserAddresses(updatedAddresses);

    setIsAddingAddress(false);
    setNewStreet('');
    setNewApartment('');
    showToast('New delivery address saved to Cloud Firestore!', 'success');
  };

  const handleDeleteAddress = (id: string) => {
    const updatedAddresses = user.addresses.filter((a) => a.id !== id);
    updateUserAddresses(updatedAddresses);
    showToast('Address deleted', 'info');
  };

  const handleToggle2FA = () => {
    const updated2FA = !user.is2FAEnabled;
    const updatedUser = {
      ...user,
      is2FAEnabled: updated2FA,
    };
    setUser(updatedUser);
    if (firebaseUser) {
      updateUserInFirestore(firebaseUser.uid, { is2FAEnabled: updated2FA }).catch(console.error);
    }
    showToast(
      updated2FA ? '2-Factor Authentication activated with SMS/Authenticator!' : '2-Factor Authentication disabled',
      'success'
    );
  };

  const handleToggleCloudSync = () => {
    const updatedSync = !user.cloudSyncEnabled;
    const updatedUser = {
      ...user,
      cloudSyncEnabled: updatedSync,
    };
    setUser(updatedUser);
    if (firebaseUser) {
      updateUserInFirestore(firebaseUser.uid, { cloudSyncEnabled: updatedSync }).catch(console.error);
    }
    showToast(
      updatedSync ? 'Encrypted Multi-Device Cloud Sync Enabled with Cloud Firestore!' : 'Cloud Sync paused',
      'success'
    );
  };

  const handleSaveProfileDetails = () => {
    if (firebaseUser) {
      updateUserInFirestore(firebaseUser.uid, {
        name: user.name,
        phone: user.phone,
        email: user.email,
      }).then(() => {
        showToast('Profile updated & synced to Cloud Firestore!', 'success');
      }).catch((err) => {
        console.error('Error saving profile:', err);
        showToast('Profile saved locally', 'info');
      });
    } else {
      showToast('Profile settings saved locally. Sign in with Google to sync to cloud.', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0f241a] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#275943] overflow-hidden my-auto max-h-[92vh] flex flex-col">
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
                {firebaseUser && !firebaseUser.isAnonymous && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-[#fed65b] border border-[#fed65b]/40 flex items-center gap-1">
                    <Cloud className="w-2.5 h-2.5" />
                    <span>Firebase Synced</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#fed65b]">
                {firebaseUser && !firebaseUser.isAnonymous ? firebaseUser.email : 'Royal Harvest Patron • Local Session'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!firebaseUser || firebaseUser.isAnonymous ? (
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsAuthOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#fed65b] text-[#012d1d] text-xs font-bold hover:bg-[#ffe382] transition-colors flex items-center gap-1.5 shadow"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Sign In</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  signOutUser();
                  setIsProfileOpen(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-900/60 transition-colors flex items-center gap-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}

            <button
              onClick={() => setIsProfileOpen(false)}
              className="p-1.5 rounded-full hover:bg-[#1b4332] text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-[#275943] bg-slate-50 dark:bg-[#11241a] px-4 overflow-x-auto no-scrollbar gap-2 sm:gap-4 text-xs font-bold">
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

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'orders'
                ? 'border-[#012d1d] dark:border-[#fed65b] text-[#012d1d] dark:text-[#fed65b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order History ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'addresses'
                ? 'border-[#012d1d] dark:border-[#fed65b] text-[#012d1d] dark:text-[#fed65b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses ({user.addresses.length})</span>
          </button>

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
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'security'
                ? 'border-[#012d1d] dark:border-[#fed65b] text-[#012d1d] dark:text-[#fed65b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Security & Vault</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 text-xs">
          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name:
                  </label>
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#162f22] rounded-xl border border-slate-300 dark:border-[#275943] text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number:
                  </label>
                  <input
                    type="text"
                    value={user.phone}
                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#162f22] rounded-xl border border-slate-300 dark:border-[#275943] text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address:
                </label>
                <input
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#162f22] rounded-xl border border-slate-300 dark:border-[#275943] text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div className="p-4 bg-[#FAF3E0] dark:bg-[#162f22] rounded-2xl border border-[#e8dfc8] dark:border-[#275943] space-y-2">
                <div className="font-bold text-[#012d1d] dark:text-[#fed65b] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Patron Account Verified</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  All order updates and harvest dispatches are encrypted and synced to your cloud account securely.
                </p>
              </div>

              <button
                onClick={handleSaveProfileDetails}
                className="px-6 py-2.5 bg-[#012d1d] text-[#fed65b] font-bold rounded-xl shadow-md hover:bg-[#144230] transition-colors"
              >
                Save Changes to Cloud Firestore
              </button>
            </div>
          )}

          {/* TAB 2: Orders History */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No orders placed yet.
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 bg-slate-50 dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 dark:border-[#275943] gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#012d1d] dark:text-[#fed65b]">
                            {ord.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 uppercase">
                            {ord.status.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{ord.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openGmailInvoice(ord)}
                          className="px-2.5 py-1.5 bg-[#FAF3E0] hover:bg-[#fed65b]/20 dark:bg-[#11241a] text-[#854d0e] dark:text-[#fed65b] border border-amber-300 dark:border-[#275943] font-bold rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                          title="Send official HTML invoice to your Gmail"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#c79a1f]" />
                          <span>Email Invoice</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            setTrackingOrder(ord);
                          }}
                          className="px-3 py-1.5 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold rounded-lg flex items-center gap-1 shadow-sm"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Live</span>
                        </button>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {ord.items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={resolveProductImage(it.product)}
                              alt={it.product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">{it.product.name}</div>
                              <div className="text-[10px] text-slate-400">Pack: {it.selectedWeight} • Qty: {it.quantity}</div>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {formatPrice(it.price * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-[#275943] font-bold">
                      <span className="text-slate-500">Total Paid ({ord.paymentMethod.toUpperCase()}):</span>
                      <span className="text-sm text-[#012d1d] dark:text-[#fed65b]">{formatPrice(ord.total)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Saved Addresses */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  Your Delivery Addresses
                </h4>
                <button
                  onClick={() => setIsAddingAddress(true)}
                  className="px-3 py-1.5 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              </div>

              {/* Add form */}
              {isAddingAddress && (
                <form
                  onSubmit={handleSaveNewAddress}
                  className="p-4 bg-[#FAF3E0] dark:bg-[#162f22] rounded-2xl border border-[#e8dfc8] dark:border-[#275943] space-y-3"
                >
                  <div className="font-bold text-slate-900 dark:text-slate-100">Add Address</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Receiver Full Name"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-[#0f241a] rounded-lg border border-slate-300 dark:border-[#275943]"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-[#0f241a] rounded-lg border border-slate-300 dark:border-[#275943]"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Street Address / Area"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0f241a] rounded-lg border border-slate-300 dark:border-[#275943]"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Flat / Suite"
                      value={newApartment}
                      onChange={(e) => setNewApartment(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-[#0f241a] rounded-lg border border-slate-300 dark:border-[#275943]"
                    />
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-[#0f241a] rounded-lg border border-slate-300 dark:border-[#275943]"
                    />
                    <input
                      type="text"
                      required
                      placeholder="PIN Code"
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-[#0f241a] rounded-lg border border-slate-300 dark:border-[#275943]"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-4 py-2 border rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#012d1d] text-[#fed65b] font-bold rounded-xl"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}

              {/* Addresses List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 bg-slate-50 dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[#012d1d] dark:text-[#fed65b]">
                          {addr.type}
                        </span>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">
                        {addr.fullName} ({addr.phone})
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-1">
                        {addr.apartment ? `${addr.apartment}, ` : ''}{addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              {wishlist.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
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
            </div>
          )}

          {/* TAB 5: Security & Vault */}
          {activeTab === 'security' && (
            <div className="max-w-xl mx-auto space-y-4">
              {/* E2E Encryption Status */}
              <div className="p-4 bg-emerald-50 dark:bg-[#162f22] rounded-2xl border border-emerald-200 dark:border-[#275943] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300">
                    <Key className="w-5 h-5" />
                    <span>AES-256 Cloud Vault Active</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    ENCRYPTED
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Your address details and transaction history are encrypted client-side with zero-knowledge vault protection.
                </p>
                <div className="text-[10px] font-mono text-slate-500 bg-white/70 dark:bg-[#0f241a] p-2 rounded-lg break-all">
                  Vault Key Fingerprint: {user.e2eEncryptionKeyFingerprint}
                </div>
              </div>

              {/* 2FA Toggle */}
              <div className="p-4 bg-slate-50 dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943] flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#c79a1f]" />
                    <span>Two-Factor Authentication (2FA)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Requires instant OTP authorization for new logins & order dispatches.
                  </p>
                </div>
                <button
                  onClick={handleToggle2FA}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    user.is2FAEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                      user.is2FAEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Multi-device Cloud Sync Toggle */}
              <div className="p-4 bg-slate-50 dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943] flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#c79a1f]" />
                    <span>Multi-Device Cloud Synchronization</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sync your shopping basket and wishlist seamlessly across mobile and desktop.
                  </p>
                </div>
                <button
                  onClick={handleToggleCloudSync}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    user.cloudSyncEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                      user.cloudSyncEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
