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
  User,
  FileText,
  AlertCircle,
  Info,
  Paperclip,
  Hash,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resolveProductImage } from '../utils/productImageResolver';
import {
  buildWhatsAppClickToChatUrl,
  formatExactInr,
  formatWhatsAppCartEnquiryMessage,
  isValidCustomerName,
  isValidCustomerMobile,
  FREE_DELIVERY_THRESHOLD_INR,
} from '../lib/whatsappTemplates';

const WHATSAPP_NAME_STORAGE_KEY = 'baagfresh_whatsapp_customer_name';
const WHATSAPP_MOBILE_STORAGE_KEY = 'baagfresh_whatsapp_customer_mobile';
const WHATSAPP_UTR_STORAGE_KEY = 'baagfresh_whatsapp_payment_utr';
const UPI_QR_IMAGE_SRC = '/assets/aistudio/WhatsApp_Image_2026-11-20_at_2.13.25_PM_8b2cc70d.jpeg';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartCount,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTotal,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    updateQuantity,
    removeFromCart,
    clearCart,
    currency,
    formatPrice,
    setIsCheckoutOpen,
    storeSettings,
    user,
    t,
  } = useApp();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ success?: boolean; text?: string } | null>(null);
  const [customerName, setCustomerName] = useState<string>(() => {
    try {
      return sessionStorage.getItem(WHATSAPP_NAME_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [customerMobile, setCustomerMobile] = useState<string>(() => {
    try {
      return sessionStorage.getItem(WHATSAPP_MOBILE_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [paymentUtr, setPaymentUtr] = useState<string>(() => {
    try {
      return sessionStorage.getItem(WHATSAPP_UTR_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [manualScreenshotNote, setManualScreenshotNote] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCartOpen) {
      setHasOpenedWhatsApp(false);
      setManualScreenshotNote(null);
      setNameError(null);
      setMobileError(null);
      return;
    }
    try {
      const savedName = sessionStorage.getItem(WHATSAPP_NAME_STORAGE_KEY);
      if (savedName) {
        setCustomerName(savedName);
      } else if (
        !customerName &&
        user?.name &&
        user.id !== 'usr-guest-00' &&
        user.name !== 'Guest Patron'
      ) {
        setCustomerName(user.name);
      }

      const savedMobile = sessionStorage.getItem(WHATSAPP_MOBILE_STORAGE_KEY);
      if (savedMobile) {
        setCustomerMobile(savedMobile);
      } else if (!customerMobile && user?.phone && user.id !== 'usr-guest-00') {
        setCustomerMobile(user.phone);
      }

      const savedUtr = sessionStorage.getItem(WHATSAPP_UTR_STORAGE_KEY);
      if (savedUtr !== null) {
        setPaymentUtr(savedUtr);
      }
    } catch {
      // Ignore storage access errors
    }
  }, [isCartOpen, user?.name, user?.phone, user?.id]);

  if (!isCartOpen) return null;

  const adminWhatsAppNumber =
    storeSettings.whatsappNumber || storeSettings.supportPhone || '+91 87076 71319';
  const netProductSubtotal = Math.max(0, cartSubtotal - cartDiscount);
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD_INR - netProductSubtotal);

  const displayMoney = (amount: number) =>
    currency === 'INR' ? formatExactInr(amount) : formatPrice(amount);

  const handleNameChange = (value: string) => {
    setCustomerName(value);
    setNameError(null);
    setHasOpenedWhatsApp(false);
    try {
      sessionStorage.setItem(WHATSAPP_NAME_STORAGE_KEY, value);
    } catch {
      // Ignore storage access errors
    }
  };

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

  const handleUtrChange = (value: string) => {
    setPaymentUtr(value);
    try {
      sessionStorage.setItem(WHATSAPP_UTR_STORAGE_KEY, value);
    } catch {
      // Ignore storage access errors
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPaymentScreenshot(file);
  };

  const handleRemoveScreenshot = () => {
    setPaymentScreenshot(null);
    if (screenshotInputRef.current) {
      screenshotInputRef.current.value = '';
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

  const nameValid = isValidCustomerName(customerName);
  const mobileValid = isValidCustomerMobile(customerMobile);
  const canSendWhatsApp = cart.length > 0 && nameValid && mobileValid;

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
    deliveryCharge: cartShipping,
    grandTotal: cartTotal,
    customerName: customerName.trim(),
    customerMobile: customerMobile.trim(),
    paymentUtr: paymentUtr.trim() || undefined,
    paymentScreenshotName: paymentScreenshot?.name || undefined,
  });

  const whatsappUrl = buildWhatsAppClickToChatUrl(adminWhatsAppNumber, whatsappMessage);

  const resetOptionalPaymentFields = () => {
    setPaymentUtr('');
    setPaymentScreenshot(null);
    if (screenshotInputRef.current) {
      screenshotInputRef.current.value = '';
    }
    try {
      sessionStorage.removeItem(WHATSAPP_UTR_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  const openWhatsAppFallbackLink = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendWhatsAppClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (cart.length === 0) {
      e.preventDefault();
      return;
    }
    if (!nameValid) {
      e.preventDefault();
      setNameError('Please enter your name (at least 2 characters).');
      nameInputRef.current?.focus();
      return;
    }
    if (!mobileValid) {
      e.preventDefault();
      setMobileError('Please enter a valid 10-digit WhatsApp mobile number.');
      mobileInputRef.current?.focus();
      return;
    }
    setNameError(null);
    setMobileError(null);

    const attachedFile = paymentScreenshot;

    // If a screenshot is selected and the device/browser supports native file sharing (e.g. mobile WhatsApp share),
    // share both the order text and screenshot file together.
    if (
      attachedFile &&
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function'
    ) {
      try {
        const shareData: ShareData = {
          title: 'BAAGFRESH WhatsApp Order',
          text: whatsappMessage,
          files: [attachedFile],
        };
        if (navigator.canShare(shareData)) {
          e.preventDefault();
          try {
            await navigator.share(shareData);
            clearCart();
            resetOptionalPaymentFields();
            setPromoMessage(null);
            setManualScreenshotNote(null);
            setHasOpenedWhatsApp(true);
            return;
          } catch (shareErr: any) {
            // If user cancelled the native share sheet, do not clear cart
            if (shareErr?.name === 'AbortError') {
              return;
            }
            // Otherwise fall back to direct WhatsApp link with manual attachment guidance
            openWhatsAppFallbackLink(whatsappUrl);
            window.setTimeout(() => {
              clearCart();
              resetOptionalPaymentFields();
              setPromoMessage(null);
              setManualScreenshotNote(attachedFile.name);
              setHasOpenedWhatsApp(true);
            }, 150);
            return;
          }
        }
      } catch {
        // Proceed with standard direct WhatsApp link below
      }
    }

    // Standard direct WhatsApp chat launch: allow the browser to open the prepared WhatsApp chat first,
    // then automatically reset the cart so the customer can start a new order.
    const manualFileName = attachedFile?.name || null;
    window.setTimeout(() => {
      clearCart();
      resetOptionalPaymentFields();
      setPromoMessage(null);
      setManualScreenshotNote(manualFileName);
      setHasOpenedWhatsApp(true);
    }, 150);
  };

  const handleOpenFullOrderSummary = () => {
    try {
      sessionStorage.setItem(WHATSAPP_NAME_STORAGE_KEY, customerName);
      sessionStorage.setItem(WHATSAPP_MOBILE_STORAGE_KEY, customerMobile);
      sessionStorage.setItem(WHATSAPP_UTR_STORAGE_KEY, paymentUtr);
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
          <div className="p-4 sm:p-5 bg-[#FAF3E0] dark:bg-[#162f22] border-b border-[#e8dfc8] dark:border-[#275943] flex items-center justify-between shrink-0">
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

          {/* Delivery Policy Strip */}
          <div className="bg-[#012d1d] text-[#FAF3E0] px-4 py-2.5 text-xs flex items-center justify-between gap-2 shrink-0">
            <span className="flex items-center gap-1.5 font-semibold">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
              <span>
                {cart.length === 0
                  ? 'FREE Delivery on ₹2,000+ • Flat ₹199 below'
                  : remainingForFreeDelivery > 0
                  ? `Add ${displayMoney(remainingForFreeDelivery)} more for FREE Delivery`
                  : 'FREE Delivery Unlocked (₹2,000+ Order)'}
              </span>
            </span>
            <span className="text-[11px] text-[#fed65b] font-bold shrink-0">
              GST Inclusive
            </span>
          </div>

          {/* Scrollable Content: Cart Items + Order Summary + Scan to Pay QR + Customer & Optional Payment Inputs */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                {hasOpenedWhatsApp && (
                  <div className="w-full p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 text-left text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div className="space-y-1">
                      <div className="font-bold">
                        WhatsApp Opened — Please Press &ldquo;Send&rdquo; in WhatsApp
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Your order enquiry is not confirmed or sent until you manually press{' '}
                        <strong>Send</strong> in WhatsApp. Your basket has been cleared so you can
                        start adding items for a new order anytime.
                      </p>
                      {manualScreenshotNote && (
                        <p className="text-[11px] leading-relaxed font-semibold text-amber-950 dark:text-amber-100">
                          Please manually attach your payment screenshot ({manualScreenshotNote})
                          inside the WhatsApp chat if you wish to share it.
                        </p>
                      )}
                    </div>
                  </div>
                )}
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
                  {hasOpenedWhatsApp ? 'Start a New Order' : t('startShopping')}
                </button>
              </div>
            ) : (
              <div>
                {/* Cart Items List */}
                <div className="p-4 sm:p-5 space-y-3">
                  {cart.map((item) => (
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
                  ))}
                </div>

                {/* Order Summary, Original UPI QR Code, Payment Instructions & Customer Details */}
                <div className="p-4 sm:p-5 bg-[#FAF3E0]/80 dark:bg-[#11241a] border-t border-[#e8dfc8] dark:border-[#275943] space-y-3.5">
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

                  {/* GST-Inclusive Price & Delivery Charge Summary */}
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-[#275943]">
                    <div className="flex justify-between">
                      <span>Product Subtotal (GST Inclusive):</span>
                      <span className="font-semibold tabular-nums">{displayMoney(cartSubtotal)}</span>
                    </div>
                    {cartDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                        <span>Discount:</span>
                        <span className="tabular-nums">-{displayMoney(cartDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Charge:</span>
                      <span className="font-semibold tabular-nums">
                        {cartShipping === 0 ? (
                          <strong className="text-emerald-700 dark:text-emerald-400">FREE</strong>
                        ) : (
                          displayMoney(cartShipping)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-[#012d1d] dark:text-[#fed65b] pt-1.5 border-t border-slate-200 dark:border-[#275943]">
                      <span>Grand Total:</span>
                      <span className="text-base tabular-nums">{displayMoney(cartTotal)}</span>
                    </div>
                    <p className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 pt-0.5">
                      All Product Prices Are Inclusive of Applicable GST.
                    </p>
                  </div>

                  {/* Scan to Pay: Original UPI QR Code directly below Grand Total */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f241a] border border-slate-200 dark:border-[#275943] text-center space-y-2.5">
                    <div>
                      <h4 className="font-cinzel text-xs font-bold text-[#012d1d] dark:text-[#fed65b]">
                        Scan to Pay
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        Pay the order amount using this QR code.
                      </p>
                      <p className="text-xs font-extrabold text-[#012d1d] dark:text-[#fed65b] mt-1 tabular-nums">
                        Amount Payable: {displayMoney(cartTotal)}
                      </p>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-200 inline-block max-w-[210px] w-full mx-auto">
                      <img
                        src={UPI_QR_IMAGE_SRC}
                        alt="BAAGFRESH UPI QR Code — Scan to Pay"
                        className="w-full h-auto object-contain mx-auto"
                      />
                    </div>

                    {/* Small Payment Instructions Note */}
                    <div className="text-left pt-2 border-t border-slate-200 dark:border-[#275943] space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <div className="font-bold text-[#012d1d] dark:text-[#fed65b]">
                        Payment Instructions
                      </div>
                      <p>
                        After placing your order, you will receive a WhatsApp message from us. Once
                        your payment is received and verified, we will personally confirm your
                        payment and order through WhatsApp. Delivery updates will also be shared on
                        WhatsApp.
                      </p>
                      <p>
                        You can also place your order first and discuss payment with us directly on
                        WhatsApp.
                      </p>
                    </div>
                  </div>

                  {/* Customer Details (ONLY Customer Name & WhatsApp Mobile Number required) */}
                  <div className="pt-2 border-t border-slate-200 dark:border-[#275943] space-y-2.5">
                    <div className="space-y-1">
                      <label
                        htmlFor="cart-customer-name"
                        className="block text-xs font-bold text-[#012d1d] dark:text-[#FAF3E0]"
                      >
                        Customer Name <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          ref={nameInputRef}
                          id="cart-customer-name"
                          type="text"
                          autoComplete="name"
                          required
                          value={customerName}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="Enter your full name"
                          className={`w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white dark:bg-[#0f241a] text-slate-900 dark:text-slate-100 rounded-xl border focus:outline-none focus:ring-2 ${
                            nameError
                              ? 'border-red-500 focus:ring-red-400/40'
                              : 'border-slate-300 dark:border-[#275943] focus:ring-[#25D366]/50 focus:border-[#25D366]'
                          }`}
                        />
                      </div>
                      {nameError && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{nameError}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="cart-customer-mobile"
                        className="block text-xs font-bold text-[#012d1d] dark:text-[#FAF3E0]"
                      >
                        WhatsApp Mobile Number <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          ref={mobileInputRef}
                          id="cart-customer-mobile"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          required
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

                    {/* Optional Payment Details (Neither field is compulsory) */}
                    <div className="pt-2 border-t border-slate-200 dark:border-[#275943] space-y-2">
                      <div className="space-y-1">
                        <label
                          htmlFor="cart-payment-utr"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          Payment UTR Number (Optional)
                        </label>
                        <div className="relative">
                          <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            id="cart-payment-utr"
                            type="text"
                            value={paymentUtr}
                            onChange={(e) => handleUtrChange(e.target.value)}
                            placeholder="Enter UTR number if already paid"
                            className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-[#0f241a] text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:outline-none focus:ring-1 focus:ring-[#c79a1f]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="cart-payment-screenshot"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          Payment Screenshot (Optional)
                        </label>
                        <input
                          ref={screenshotInputRef}
                          id="cart-payment-screenshot"
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          className="hidden"
                        />
                        {paymentScreenshot ? (
                          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#0f241a] border border-slate-300 dark:border-[#275943] text-xs">
                            <span className="flex items-center gap-1.5 truncate text-slate-800 dark:text-slate-200 font-medium">
                              <Paperclip className="w-3.5 h-3.5 text-[#1ea952] shrink-0" />
                              <span className="truncate">{paymentScreenshot.name}</span>
                            </span>
                            <button
                              type="button"
                              onClick={handleRemoveScreenshot}
                              className="text-slate-400 hover:text-red-500 shrink-0"
                              aria-label="Remove payment screenshot"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => screenshotInputRef.current?.click()}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f241a] hover:bg-slate-50 dark:hover:bg-[#162f22] text-slate-700 dark:text-slate-200 border border-dashed border-slate-300 dark:border-[#275943] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                            <span>Attach Payment Screenshot (Optional)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer Actions when Cart Has Items */}
          {cart.length > 0 && (
            <div className="p-4 sm:px-5 bg-[#FAF3E0] dark:bg-[#0f241a] border-t border-[#e8dfc8] dark:border-[#275943] space-y-2 shrink-0">
              {/* Primary CTA: Send Order on WhatsApp */}
              <a
                id="cart-send-whatsapp-btn"
                href={canSendWhatsApp ? whatsappUrl : '#'}
                target={canSendWhatsApp ? '_blank' : undefined}
                rel={canSendWhatsApp ? 'noopener noreferrer' : undefined}
                onClick={handleSendWhatsAppClick}
                className="w-full py-3.5 px-4 bg-[#1ea952] hover:bg-[#178f44] text-white font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] border border-emerald-300/30 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Send Order on WhatsApp</span>
              </a>

              <p className="text-[10px] text-center text-slate-600 dark:text-slate-400 leading-relaxed">
                Opens WhatsApp with your pre-filled order list. Review and press{' '}
                <strong>Send</strong> in WhatsApp — our team will personally confirm your order.
              </p>

              {/* Secondary Button to Inspect Full Tabular Order Summary */}
              <button
                type="button"
                onClick={handleOpenFullOrderSummary}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#162f22] hover:bg-slate-100 dark:hover:bg-[#1c392a] text-[#012d1d] dark:text-[#fed65b] text-xs font-bold border border-slate-300 dark:border-[#275943] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
