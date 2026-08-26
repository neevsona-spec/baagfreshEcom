import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Truck, 
  ChevronRight, 
  MapPin, 
  ArrowLeft,
  Printer,
  Sparkles,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Address, Order, PaymentMethod } from '../types';
import { PaymentGateway } from './PaymentGateway';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTax,
    cartTotal,
    appliedPromo,
    currency,
    formatPrice,
    user,
    updateUserAddresses,
    createOrder,
    setTrackingOrder,
    openGmailInvoice,
    t
  } = useApp();

  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // Address fields
  type AddressFormState = {
    fullName: string;
    phone: string;
    email: string;
    street: string;
    apartment: string;
    city: string;
    state: string;
    pincode: string;
  };

  const getSavedAddress = (): AddressFormState => {
    try {
      const saved = localStorage.getItem('baagfresh_saved_address');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved address", e);
    }
    return {
      fullName: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      street: '',
      apartment: '',
      city: '',
      state: '',
      pincode: ''
    };
  };

  const [formData, setFormData] = useState<AddressFormState>(getSavedAddress);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('custom');

  // Load saved address on mount
  React.useEffect(() => {
    const savedAddress = getSavedAddress();
    setFormData(savedAddress);
  }, []);

  const updateFormData = (field: keyof AddressFormState, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    localStorage.setItem('baagfresh_saved_address', JSON.stringify(newFormData));
  };

  // Shipping Method
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard');

  // Success order state
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [transactionInfo, setTransactionInfo] = useState<{ txnId: string; bankRef: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isCheckoutOpen) return null;

  const finalTotal = cartTotal + (deliverySpeed === 'express' ? 150 : 0);

  const handleSelectSavedAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    const newFormData = {
      fullName: addr.fullName,
      phone: addr.phone,
      email: user?.email || '',
      street: addr.street,
      apartment: addr.apartment || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    };
    setFormData(newFormData);
    localStorage.setItem('baagfresh_saved_address', JSON.stringify(newFormData));
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.street || !formData.city || !formData.pincode) {
      alert('Please fill all required delivery address fields.');
      return;
    }
    localStorage.setItem('baagfresh_saved_address', JSON.stringify(formData));
    setSubmitError(null);
    setStep('payment');
  };

  const handlePaymentSuccess = async (
    method: PaymentMethod,
    txnDetails?: { txnId: string; bankRef: string }
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    if (txnDetails) {
      setTransactionInfo(txnDetails);
    }

    const shippingAddress: Address = {
      id: selectedAddressId === 'custom' ? `addr-${Date.now()}` : selectedAddressId,
      type: 'Home',
      ...formData,
      isDefault: false,
    };

    try {
      // Save Address
      if (user) {
        // Add or Update address
        const newAddresses = user.addresses.filter(a => a.id !== shippingAddress.id);
        newAddresses.push(shippingAddress);
        await updateUserAddresses(newAddresses);
      } else {
        localStorage.setItem('baagfresh_guest_address', JSON.stringify(shippingAddress));
      }

      // CRITICAL: A customer order must NEVER be shown as “successful” unless the order has actually been saved successfully in Supabase.
      const newOrder = await createOrder({
        items: [...cart],
        subtotal: cartSubtotal,
        discount: cartDiscount,
        promoCode: appliedPromo || undefined,
        shippingFee: cartShipping + (deliverySpeed === 'express' ? 150 : 0),
        tax: cartTax,
        total: finalTotal,
        currency,
        shippingAddress,
        customerName: formData.fullName,
        customerPhone: formData.phone,
        paymentMethod: method,
        paymentStatus: method === 'cod' ? 'cod_pending' : 'paid',
      });

      setCompletedOrder(newOrder);
      setStep('success');
    } catch (err: any) {
      console.error('[Checkout] Order placement failed:', err);
      setSubmitError(err?.message || 'Could not record order in Supabase database. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0f241a] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#275943] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:px-6 bg-[#FAF3E0] dark:bg-[#162f22] border-b border-[#e8dfc8] dark:border-[#275943] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#012d1d] text-[#fed65b] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-base sm:text-lg font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                Secure Harvest Checkout
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                AES-256 Encrypted • Varanasi Certified Processing Hub
              </p>
            </div>
          </div>

          {step !== 'success' && (
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        {step !== 'success' && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-[#11241a] border-b border-slate-200 dark:border-[#275943] flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step === 'details'
                    ? 'bg-[#012d1d] text-[#fed65b]'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                1
              </span>
              <span className={step === 'details' ? 'text-[#012d1d] dark:text-[#fed65b]' : 'text-slate-400'}>
                Shipping Address
              </span>
            </div>

            <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step === 'payment'
                    ? 'bg-[#012d1d] text-[#fed65b]'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                2
              </span>
              <span className={step === 'payment' ? 'text-[#012d1d] dark:text-[#fed65b]' : 'text-slate-400'}>
                Secure Payment
              </span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          {/* STEP 1: Details */}
          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-5">
              {/* Saved Address Selector */}
              {user && user.addresses.length > 0 && !isAddingNewAddress ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Select Delivery Address:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewAddress(true)}
                      className="text-xs font-bold text-[#c79a1f] hover:underline"
                    >
                      + Add New Address
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-[#012d1d] dark:border-[#fed65b] bg-[#FAF3E0]/70 dark:bg-[#162f22] ring-2 ring-[#c79a1f]/40'
                            : 'border-slate-200 dark:border-[#275943] bg-white dark:bg-[#0f241a]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[#012d1d] dark:text-[#fed65b] mb-1">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{addr.type}</span>
                          </span>
                          {selectedAddressId === addr.id && (
                            <span className="text-[10px] bg-[#012d1d] text-[#fed65b] px-1.5 py-0.5 rounded">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {addr.fullName} ({addr.phone})
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                          {addr.apartment ? `${addr.apartment}, ` : ''}{addr.street}, {addr.city} - {addr.pincode}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2 text-xs">
                  {/* Address Form */}
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Delivery Details
                    </label>
                    {user && user.addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewAddress(false)}
                        className="text-xs font-bold text-[#c79a1f] hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => updateFormData('fullName', e.target.value)}
                      placeholder="Receiver's full name"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:ring-1 focus:ring-[#c79a1f] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:ring-1 focus:ring-[#c79a1f] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (for encrypted invoice receipt) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:ring-1 focus:ring-[#c79a1f] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Street Address / Colony *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.street}
                      onChange={(e) => updateFormData('street', e.target.value)}
                      placeholder="Street, Landmark, Area"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:ring-1 focus:ring-[#c79a1f] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      House / Flat No.
                    </label>
                    <input
                      type="text"
                      value={formData.apartment}
                      onChange={(e) => updateFormData('apartment', e.target.value)}
                      placeholder="Flat 4B, Tower 2"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:ring-1 focus:ring-[#c79a1f] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      placeholder="Varanasi"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:ring-1 focus:ring-[#c79a1f] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => updateFormData('state', e.target.value)}
                      placeholder="Uttar Pradesh"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:ring-1 focus:ring-[#c79a1f] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Postal PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => updateFormData('pincode', e.target.value)}
                      placeholder="221005"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:ring-1 focus:ring-[#c79a1f] focus:outline-none"
                    />
                  </div>
                </div>
                </div>
              )
            }
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Delivery Speed:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setDeliverySpeed('standard')}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                      deliverySpeed === 'standard'
                        ? 'border-[#012d1d] dark:border-[#fed65b] bg-[#FAF3E0]/70 dark:bg-[#162f22] ring-1 ring-[#c79a1f]'
                        : 'border-slate-200 dark:border-[#275943] bg-white dark:bg-[#0f241a]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#012d1d] dark:text-[#fed65b]" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">Standard Express</div>
                        <div className="text-[11px] text-slate-500">2-3 Business Days</div>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {cartShipping === 0 ? 'FREE' : formatPrice(cartShipping)}
                    </span>
                  </div>

                  <div
                    onClick={() => setDeliverySpeed('express')}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                      deliverySpeed === 'express'
                        ? 'border-[#012d1d] dark:border-[#fed65b] bg-[#FAF3E0]/70 dark:bg-[#162f22] ring-1 ring-[#c79a1f]'
                        : 'border-slate-200 dark:border-[#275943] bg-white dark:bg-[#0f241a]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#c79a1f]" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">Priority Next-Day Air</div>
                        <div className="text-[11px] text-slate-500">24-Hour Guaranteed</div>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      +{formatPrice(150)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Continue to Payment Button */}
              <div className="pt-3 border-t border-slate-200 dark:border-[#275943] flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Total Payable:</span>
                  <span className="text-lg font-extrabold text-[#012d1d] dark:text-[#fed65b]">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-2"
                >
                  <span>Proceed to Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment */}
          {step === 'payment' && (
            <div className="relative">
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{submitError}</span>
                </div>
              )}
              {isSubmitting && (
                <div className="absolute inset-0 z-20 bg-white/80 dark:bg-[#0f241a]/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 rounded-2xl">
                  <div className="w-10 h-10 border-3 border-[#012d1d] border-t-[#fed65b] dark:border-[#fed65b] dark:border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Saving order to Supabase database...</p>
                  <p className="text-xs text-slate-500 mt-1">Verifying encrypted transaction & inventory...</p>
                </div>
              )}
              <PaymentGateway
                amount={finalTotal}
                receiverPhone={formData.phone}
                receiverCity={formData.city}
                receiverPincode={formData.pincode}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={() => {
                  setSubmitError(null);
                  setStep('details');
                }}
              />
            </div>
          )}

          {/* STEP 3: Order Placed Success Confirmation */}
          {step === 'success' && completedOrder && (
            <div className="py-6 sm:py-8 text-center space-y-6">
              {/* Animated Checkmark */}
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border-4 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                  {t('orderSuccessTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  {t('orderSuccessDesc')}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FAF3E0] dark:bg-[#162f22] rounded-full border border-[#e8dfc8] dark:border-[#275943] text-xs font-mono font-bold text-[#012d1d] dark:text-[#fed65b]">
                  <span>Order ID: {completedOrder.orderNumber}</span>
                  {transactionInfo && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 dark:text-emerald-400">Ref: {transactionInfo.bankRef}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Order Receipt Box */}
              <div className="max-w-md mx-auto p-4 bg-slate-50 dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943] text-left text-xs space-y-2.5">
                <div className="flex justify-between font-bold border-b border-slate-200 dark:border-[#275943] pb-2">
                  <span className="text-slate-500">Shipping To:</span>
                  <span className="text-slate-900 dark:text-slate-100">{completedOrder.shippingAddress.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span>{completedOrder.shippingAddress.city}, {completedOrder.shippingAddress.pincode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Delivery:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{completedOrder.eta}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Gateway:</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-[#012d1d] text-[#fed65b] text-[11px] uppercase tracking-wider">
                    {completedOrder.paymentMethod === 'upi'
                      ? 'UPI (Instant Net)'
                      : completedOrder.paymentMethod === 'rupay'
                      ? 'RuPay PaySecure'
                      : completedOrder.paymentMethod === 'visa'
                      ? 'Visa 3D-Secure'
                      : completedOrder.paymentMethod === 'mastercard'
                      ? 'Mastercard Identity Check'
                      : 'Cash on Delivery (Doorstep)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="font-bold text-emerald-600 uppercase">
                    {completedOrder.paymentStatus === 'paid' ? 'Paid & Authorized' : 'COD Scheduled on Handover'}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-slate-200 dark:border-[#275943] text-sm text-[#012d1d] dark:text-[#fed65b]">
                  <span>Total Paid / Payable:</span>
                  <span>{formatPrice(completedOrder.total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setTrackingOrder(completedOrder);
                  }}
                  className="px-6 py-3 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>Track Live Package</span>
                </button>

                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                  }}
                  className="px-5 py-3 rounded-xl bg-[#fed65b] hover:bg-[#ffe07a] text-[#012d1d] font-bold text-xs sm:text-sm shadow-md"
                >
                  <span>{t('continueShopping')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
