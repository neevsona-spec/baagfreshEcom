import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  MessageCircle,
  Phone,
  FileText,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resolveProductImage } from '../utils/productImageResolver';
import {
  buildWhatsAppClickToChatUrl,
  formatExactInr,
  formatWhatsAppCartEnquiryMessage,
  isValidCustomerMobile,
} from '../lib/whatsappTemplates';

const WHATSAPP_MOBILE_STORAGE_KEY = 'baagfresh_whatsapp_customer_mobile';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartCount,
    cartSubtotal,
    cartDiscount,
    cartTax,
    cartTotal,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    updateQuantity,
    removeFromCart,
    currency,
    formatPrice,
    setIsCheckoutOpen,
    storeSettings,
    user,
    t,
  } = useApp();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ success?: boolean; text?: string } | null>(null);
  const [customerMobile, setCustomerMobile] = useState<string>(() => {
    try {
      return sessionStorage.getItem(WHATSAPP_MOBILE_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCartOpen) {
      setHasOpenedWhatsApp(false);
      return;
    }
    try {
      const saved = sessionStorage.getItem(WHATSAPP_MOBILE_STORAGE_KEY);
      if (saved) {
        setCustomerMobile(saved);
      } else if (!customerMobile && user?.phone && user.id !== 'usr-guest-00') {
        setCustomerMobile(user.phone);
      }
    } catch {
      // Ignore storage access errors
    }
  }, [isCartOpen, user?.phone, user?.id]);

  if (!isCartOpen) return null;

  const gstRatePercent =
    typeof storeSettings.taxRatePercent === 'number' ? storeSettings.taxRatePercent : 5;
  const adminWhatsAppNumber =
    storeSettings.whatsappNumber || storeSettings.supportPhone || '+91 87076 71319';

  const displayMoney = (amount: number) =>
    currency === 'INR' ? formatExactInr(amount) : formatPrice(amount);

  const handleMobileChange = (value: string) => {
    setCustomerMobile(value);
    setMobileError(null);
    setHasOpenedWhatsApp(false);
    try {
      sessionStorage.setItem(WHATSAPP_MOBILE_STORAGE_KEY, value);
    } catch {
      // Ignore storage access errors
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    if (res.success) {
      setPromoMessage({ success: true, text: res.message });
      setPromoInput('');
    } else {
      setPromoMessage({ success: false, text: res.message });
    }
  };

  const mobileValid = isValidCustomerMobile(customerMobile);

  const whatsappMessage = formatWhatsAppCartEnquiryMessage({
    items: cart.map((item) => ({
      name: item.product.name,
      weight: item.selectedWeight,
      quantity: item.quantity,
      price: item.price,
    })),
    subtotal: cartSubtotal,
    discount: cartDiscount,
    promoCode: appliedPromo || undefined,
    gstRatePercent,
    gstAmount: cartTax,
    grandTotal: cartTotal,
    customerMobile: customerMobile.trim(),
  });

  const whatsappUrl = buildWhatsAppClickToChatUrl(adminWhatsAppNumber, whatsappMessage);

  const handleSendWhatsAppClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!mobileValid) {
      e.preventDefault();
      setMobileError('Please enter a valid 10-digit mobile number to send your order on WhatsApp.');
      mobileInputRef.current?.focus();
      return;
    }
    setMobileError(null);
    setHasOpenedWhatsApp(true);
  };

  const handleOpenFullOrderSummary = () => {
    try {
      sessionStorage.setItem(WHATSAPP_MOBILE_STORAGE_KEY, customerMobile);
    } catch {
      // Ignore storage errors
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen max-w-md bg-white dark:bg-[#0f241a] shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-[#275943]">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#FAF3E0] dark:bg-[#162f22] border-b border-[#e8dfc8] dark:border-[#275943] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#012d1d] dark:text-[#fed65b]" />
              <h2 className="font-cinzel text-lg font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                Harvest Basket ({cartCount})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#0c1c14] transition-colors"
              aria-label="Close basket"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* WhatsApp Direct Enquiry Strip */}
          <div className="bg-[#012d1d] text-[#FAF3E0] px-4 py-2.5 text-xs flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-semibold">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
              <span>Direct WhatsApp Order Enquiry</span>
            </span>
            <span className="text-[11px] text-[#fed65b] font-bold shrink-0">
              GST {gstRatePercent}% Included Below
            </span>
          </div>

          {/* Body: Cart Items or Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-[#FAF3E0] dark:bg-[#162f22] flex items-center justify-center text-3xl">
                  🧺
                </div>
                <h3 className="font-cinzel text-lg font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                  {t('emptyCartTitle')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  {t('emptyCartDesc')}
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] text-xs font-bold rounded-full shadow-md transition-all"
                >
                  {t('startShopping')}
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 bg-slate-50 dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943]/60 shadow-sm"
                >
                  {/* Thumbnail */}
                  <img
                    src={resolveProductImage(item.product)}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-[#275943] shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  {/* Item Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-500 p-0.5 transition-colors"
                          title="Remove item"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-[#FAF3E0] dark:bg-[#0f241a] text-[#012d1d] dark:text-[#fed65b] font-bold px-1.5 py-0.5 rounded border border-[#e8dfc8] dark:border-[#275943]">
                          {item.selectedWeight}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Unit: {displayMoney(item.price)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Item Total */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-slate-300 dark:border-[#275943] rounded-lg bg-white dark:bg-[#0f241a] overflow-hidden text-xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162f22]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162f22]"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="block text-[9px] uppercase tracking-wider text-slate-400">
                          Item Total
                        </span>
                        <span className="text-sm font-extrabold text-[#012d1d] dark:text-[#fed65b] tabular-nums">
                          {displayMoney(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer: Promo, GST Summary, Customer Mobile & Send on WhatsApp */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-[#FAF3E0]/80 dark:bg-[#11241a] border-t border-[#e8dfc8] dark:border-[#275943] space-y-3">
              {/* Promo Code Form */}
              <div className="space-y-1">
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                      <Tag className="w-3.5 h-3.5" />
                      <span>
                        Coupon Active: <strong>{appliedPromo}</strong>
                      </span>
                    </div>
                    <button
                      onClick={removePromoCode}
                      className="text-red-600 dark:text-red-400 hover:underline text-[11px] font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Promo Code (e.g. BAAGFRESH10)"
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#0f241a] text-slate-800 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:outline-none focus:ring-1 focus:ring-[#c79a1f] uppercase"
                      />
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] text-xs font-bold rounded-xl shrink-0"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {promoMessage && (
                  <p
                    className={`text-[11px] ${
                      promoMessage.success
                        ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {promoMessage.text}
                  </p>
                )}
              </div>

              {/* Price & Indian GST Calculation Summary */}
              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-[#275943]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold tabular-nums">{displayMoney(cartSubtotal)}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>Discount:</span>
                    <span className="tabular-nums">-{displayMoney(cartDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST ({gstRatePercent}% Indian GST):</span>
                  <span className="font-semibold tabular-nums">{displayMoney(cartTax)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#012d1d] dark:text-[#fed65b] pt-1.5 border-t border-slate-200 dark:border-[#275943]">
                  <span>Grand Total:</span>
                  <span className="text-base tabular-nums">{displayMoney(cartTotal)}</span>
                </div>
              </div>

              {/* Customer Mobile Number (ONLY required customer detail) */}
              <div className="pt-2 border-t border-slate-200 dark:border-[#275943] space-y-1.5">
                <label
                  htmlFor="cart-customer-mobile"
                  className="block text-xs font-bold text-[#012d1d] dark:text-[#FAF3E0]"
                >
                  Your Mobile Number <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    ref={mobileInputRef}
                    id="cart-customer-mobile"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={customerMobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white dark:bg-[#0f241a] text-slate-900 dark:text-slate-100 rounded-xl border focus:outline-none focus:ring-2 ${
                      mobileError
                        ? 'border-red-500 focus:ring-red-400/40'
                        : 'border-slate-300 dark:border-[#275943] focus:ring-[#25D366]/50 focus:border-[#25D366]'
                    }`}
                  />
                </div>
                {mobileError && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{mobileError}</span>
                  </p>
                )}
              </div>

              {/* Primary CTA: Send Order on WhatsApp */}
              <a
                id="cart-send-whatsapp-btn"
                href={mobileValid ? whatsappUrl : '#'}
                target={mobileValid ? '_blank' : undefined}
                rel={mobileValid ? 'noopener noreferrer' : undefined}
                onClick={handleSendWhatsAppClick}
                className="w-full py-3.5 px-4 bg-[#1ea952] hover:bg-[#178f44] text-white font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] border border-emerald-300/30 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Send Order on WhatsApp</span>
              </a>

              {/* Manual Send Reminder */}
              {hasOpenedWhatsApp ? (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    WhatsApp opened with your order list. Please review and press{' '}
                    <strong>Send</strong> in WhatsApp. Your enquiry is not submitted until you send
                    the message.
                  </span>
                </div>
              ) : (
                <p className="text-[10px] text-center text-slate-600 dark:text-slate-400 leading-relaxed">
                  Opens WhatsApp with your pre-filled order list. Review and press{' '}
                  <strong>Send</strong> in WhatsApp — our team will personally confirm your order.
                </p>
              )}

              {/* Secondary Button to Inspect Full Tabular Order Summary */}
              <button
                type="button"
                onClick={handleOpenFullOrderSummary}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#0f241a] hover:bg-slate-100 dark:hover:bg-[#162f22] text-[#012d1d] dark:text-[#fed65b] text-xs font-bold border border-slate-300 dark:border-[#275943] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Review Complete Order List</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
