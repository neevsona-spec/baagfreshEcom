import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Phone,
  User,
  MessageCircle,
  AlertCircle,
  Info,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
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

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
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
    storeSettings,
    user,
    showToast,
  } = useApp();

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
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ success: boolean; text: string } | null>(
    null
  );
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCheckoutOpen) {
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
  }, [isCheckoutOpen, user?.name, user?.phone, user?.id]);

  if (!isCheckoutOpen) return null;

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
      // Ignore storage errors
    }
  };

  const handleMobileChange = (value: string) => {
    setCustomerMobile(value);
    setMobileError(null);
    setHasOpenedWhatsApp(false);
    try {
      sessionStorage.setItem(WHATSAPP_MOBILE_STORAGE_KEY, value);
    } catch {
      // Ignore storage errors
    }
  };

  const handleUtrChange = (value: string) => {
    setPaymentUtr(value);
    try {
      sessionStorage.setItem(WHATSAPP_UTR_STORAGE_KEY, value);
    } catch {
      // Ignore storage errors
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
    setPromoFeedback({ success: res.success, text: res.message });
    if (res.success) {
      setPromoInput('');
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
    customerName: customerName.trim() || '[Enter Customer Name]',
    customerMobile: customerMobile.trim() || '[Enter WhatsApp Mobile Number]',
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
      setNameError('Please enter your name (at least 2 characters) before opening WhatsApp.');
      nameInputRef.current?.focus();
      return;
    }
    if (!mobileValid) {
      e.preventDefault();
      setMobileError('Please enter a valid 10-digit WhatsApp mobile number before opening WhatsApp.');
      mobileInputRef.current?.focus();
      return;
    }
    setNameError(null);
    setMobileError(null);

    const attachedFile = paymentScreenshot;

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
            setPromoFeedback(null);
            setManualScreenshotNote(null);
            setHasOpenedWhatsApp(true);
            return;
          } catch (shareErr: any) {
            if (shareErr?.name === 'AbortError') {
              return;
            }
            openWhatsAppFallbackLink(whatsappUrl);
            window.setTimeout(() => {
              clearCart();
              resetOptionalPaymentFields();
              setPromoFeedback(null);
              setManualScreenshotNote(attachedFile.name);
              setHasOpenedWhatsApp(true);
            }, 150);
            return;
          }
        }
      } catch {
        // Proceed with direct WhatsApp link below
      }
    }

    // Allow the browser to open the WhatsApp chat tab with the prepared message first,
    // then automatically reset the cart so the customer can start a new order.
    const manualFileName = attachedFile?.name || null;
    window.setTimeout(() => {
      clearCart();
      resetOptionalPaymentFields();
      setPromoFeedback(null);
      setManualScreenshotNote(manualFileName);
      setHasOpenedWhatsApp(true);
    }, 150);
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopiedPreview(true);
      showToast('WhatsApp order list copied to clipboard.', 'info');
      setTimeout(() => setCopiedPreview(false), 2000);
    } catch {
      showToast('Could not copy message automatically.', 'warning');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0f241a] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#275943] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:px-6 bg-[#012d1d] text-[#FAF3E0] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-base sm:text-lg font-bold text-[#fed65b]">
                WhatsApp Order Summary
              </h2>
              <p className="text-[11px] text-slate-300">
                Review your order list &amp; send your enquiry directly on WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1.5 rounded-full hover:bg-[#1b4332] text-slate-300 hover:text-white transition-colors"
            aria-label="Close order summary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {cart.length === 0 ? (
            <div className="py-10 text-center space-y-4">
              {hasOpenedWhatsApp && (
                <div className="max-w-lg mx-auto p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-left flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1">
                    <div className="font-bold">
                      WhatsApp Chat Opened — Please Press &ldquo;Send&rdquo; in WhatsApp
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      Your order enquiry is not confirmed or sent until you manually press{' '}
                      <strong>Send</strong> inside WhatsApp. Your basket has been automatically
                      cleared so you can start adding products for a new order anytime.
                    </p>
                    {manualScreenshotNote && (
                      <p className="text-[11px] font-semibold leading-relaxed text-amber-950 dark:text-amber-100">
                        Please manually attach your payment screenshot ({manualScreenshotNote})
                        inside the WhatsApp chat if you wish to share it.
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="w-16 h-16 rounded-full bg-[#FAF3E0] dark:bg-[#162f22] flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8 text-[#012d1d] dark:text-[#fed65b]" />
              </div>
              <h3 className="font-cinzel text-lg font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                {hasOpenedWhatsApp ? 'Ready for a New Order' : 'Your Order List is Empty'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Add products from the BAAGFRESH catalog to automatically prepare your GST-inclusive
                WhatsApp order list.
              </p>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="px-6 py-2.5 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] text-xs font-bold rounded-full shadow-md transition-all"
              >
                {hasOpenedWhatsApp ? 'Start a New Order' : 'Browse Products'}
              </button>
            </div>
          ) : (
            <>
              {/* Complete Order List Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#275943] overflow-hidden bg-white dark:bg-[#11241a]">
                <div className="px-4 py-3 bg-[#FAF3E0] dark:bg-[#162f22] border-b border-[#e8dfc8] dark:border-[#275943] flex items-center justify-between">
                  <h3 className="font-cinzel text-sm font-bold text-[#012d1d] dark:text-[#fed65b] flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Complete Order List ({cartCount} {cartCount === 1 ? 'Item' : 'Items'})</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    BAAGFRESH Official Catalogue Prices
                  </span>
                </div>

                {/* Desktop Table Header */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2 bg-slate-50 dark:bg-[#0d1e15] border-b border-slate-200 dark:border-[#275943] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <div className="col-span-5">Product Name</div>
                  <div className="col-span-2 text-right">Unit Price (GST Incl.)</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-3 text-right">Item Total</div>
                </div>

                {/* Order Items */}
                <div className="divide-y divide-slate-200 dark:divide-[#275943]">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 sm:px-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      {/* Product Name + Pack Weight */}
                      <div className="sm:col-span-5 flex items-center gap-3 min-w-0">
                        <img
                          src={resolveProductImage(item.product)}
                          alt={item.product.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-[#275943] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.product.name}
                          </div>
                          <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FAF3E0] dark:bg-[#162f22] text-[#012d1d] dark:text-[#fed65b] border border-[#e8dfc8] dark:border-[#275943]">
                            {item.selectedWeight}
                          </span>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-2 flex sm:block items-center justify-between text-xs">
                        <span className="sm:hidden text-slate-500 dark:text-slate-400">Unit Price:</span>
                        <span className="sm:block sm:text-right font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                          {displayMoney(item.price)}
                        </span>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2 flex sm:justify-center items-center justify-between">
                        <span className="sm:hidden text-xs text-slate-500 dark:text-slate-400">
                          Quantity:
                        </span>
                        <div className="flex items-center border border-slate-300 dark:border-[#275943] rounded-lg bg-slate-50 dark:bg-[#0f241a] overflow-hidden text-xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#162f22]"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#162f22]"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-2">
                        <span className="sm:hidden text-xs text-slate-500 dark:text-slate-400">
                          Item Total:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[#012d1d] dark:text-[#fed65b] tabular-nums">
                            {displayMoney(item.price * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Remove item"
                            aria-label={`Remove ${item.product.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Grid: GST-Inclusive Totals + Scan to Pay QR & Customer/Optional Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Left: GST-Inclusive Subtotal, Delivery Charge, Grand Total + Original UPI QR Code + Payment Instructions */}
                <div className="p-4 rounded-2xl bg-[#FAF3E0]/70 dark:bg-[#162f22] border border-[#e8dfc8] dark:border-[#275943] space-y-3">
                  <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#012d1d] dark:text-[#fed65b]">
                    Order Summary &amp; Delivery
                  </h4>

                  {/* Optional Promo Code */}
                  <div>
                    {appliedPromo ? (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                          <Tag className="w-3.5 h-3.5" />
                          Promo: {appliedPromo}
                        </span>
                        <button
                          type="button"
                          onClick={removePromoCode}
                          className="text-red-600 dark:text-red-400 font-bold text-[11px] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyPromo} className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder="Promo Code (Optional)"
                          className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#0f241a] text-slate-800 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:outline-none focus:ring-1 focus:ring-[#c79a1f] uppercase"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] text-xs font-bold rounded-xl shrink-0"
                        >
                          Apply
                        </button>
                      </form>
                    )}
                    {promoFeedback && (
                      <p
                        className={`mt-1 text-[11px] ${
                          promoFeedback.success
                            ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {promoFeedback.text}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-[#275943]">
                    <div className="flex justify-between">
                      <span>Product Subtotal (GST Inclusive)</span>
                      <span className="font-bold tabular-nums">{displayMoney(cartSubtotal)}</span>
                    </div>

                    {cartDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                        <span>Discount ({appliedPromo})</span>
                        <span className="tabular-nums">-{displayMoney(cartDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>
                        Delivery Charge
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                          {remainingForFreeDelivery > 0
                            ? `Flat ₹199 below ₹2,000 (Add ${displayMoney(remainingForFreeDelivery)} for FREE)`
                            : 'FREE Delivery on orders ₹2,000 & above'}
                        </span>
                      </span>
                      <span className="font-bold tabular-nums">
                        {cartShipping === 0 ? (
                          <span className="text-emerald-700 dark:text-emerald-400">FREE (₹0)</span>
                        ) : (
                          displayMoney(cartShipping)
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline text-sm font-black text-[#012d1d] dark:text-[#fed65b] pt-2 border-t border-slate-300 dark:border-[#275943]">
                      <span>Grand Total</span>
                      <span className="text-lg tabular-nums">{displayMoney(cartTotal)}</span>
                    </div>

                    <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 pt-1">
                      All Product Prices Are Inclusive of Applicable GST.
                    </p>
                  </div>

                  {/* Scan to Pay: Original UPI QR Code directly below Grand Total */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f241a] border border-slate-200 dark:border-[#275943] text-center space-y-2.5">
                    <div>
                      <h5 className="font-cinzel text-xs font-bold text-[#012d1d] dark:text-[#fed65b]">
                        Scan to Pay
                      </h5>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        Pay the order amount using this QR code.
                      </p>
                      <p className="text-xs font-extrabold text-[#012d1d] dark:text-[#fed65b] mt-1 tabular-nums">
                        Amount Payable: {displayMoney(cartTotal)}
                      </p>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-200 inline-block max-w-[220px] w-full mx-auto">
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
                </div>

                {/* Right: Customer Name, WhatsApp Mobile Number, Optional UTR & Screenshot & Send Button */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11241a] border border-slate-200 dark:border-[#275943] flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#012d1d] dark:text-[#fed65b]">
                      Customer Details
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Only your name and WhatsApp mobile number are required. No delivery address,
                      PIN code, or email is collected on this website.
                    </p>

                    <div className="pt-0.5">
                      <label
                        htmlFor="summary-customer-name"
                        className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1"
                      >
                        Customer Name <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          ref={nameInputRef}
                          id="summary-customer-name"
                          type="text"
                          autoComplete="name"
                          required
                          value={customerName}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="Enter your full name"
                          className={`w-full pl-9 pr-3 py-2.5 text-sm font-bold bg-white dark:bg-[#0f241a] text-slate-900 dark:text-slate-100 rounded-xl border focus:outline-none focus:ring-2 ${
                            nameError
                              ? 'border-red-500 focus:ring-red-400/40'
                              : 'border-slate-300 dark:border-[#275943] focus:ring-[#25D366]/50 focus:border-[#25D366]'
                          }`}
                        />
                      </div>
                      {nameError && (
                        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{nameError}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="summary-customer-mobile"
                        className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1"
                      >
                        WhatsApp Mobile Number <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          ref={mobileInputRef}
                          id="summary-customer-mobile"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          required
                          value={customerMobile}
                          onChange={(e) => handleMobileChange(e.target.value)}
                          placeholder="+91 98765 43210"
                          className={`w-full pl-9 pr-3 py-2.5 text-sm font-bold bg-white dark:bg-[#0f241a] text-slate-900 dark:text-slate-100 rounded-xl border focus:outline-none focus:ring-2 ${
                            mobileError
                              ? 'border-red-500 focus:ring-red-400/40'
                              : 'border-slate-300 dark:border-[#275943] focus:ring-[#25D366]/50 focus:border-[#25D366]'
                          }`}
                        />
                      </div>
                      {mobileError && (
                        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{mobileError}</span>
                        </p>
                      )}
                    </div>

                    {/* Optional Payment Details near WhatsApp Order Button */}
                    <div className="pt-2.5 border-t border-slate-200 dark:border-[#275943] space-y-2.5">
                      <div>
                        <label
                          htmlFor="summary-payment-utr"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          Payment UTR Number (Optional)
                        </label>
                        <div className="relative">
                          <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            id="summary-payment-utr"
                            type="text"
                            value={paymentUtr}
                            onChange={(e) => handleUtrChange(e.target.value)}
                            placeholder="Enter UTR number after payment"
                            className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white dark:bg-[#0f241a] text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:outline-none focus:ring-1 focus:ring-[#c79a1f]"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="summary-payment-screenshot"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          Payment Screenshot (Optional)
                        </label>
                        <input
                          ref={screenshotInputRef}
                          id="summary-payment-screenshot"
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
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f241a] hover:bg-slate-100 dark:hover:bg-[#162f22] text-slate-700 dark:text-slate-200 border border-dashed border-slate-300 dark:border-[#275943] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                            <span>Select Payment Screenshot (Optional)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Single Clear Primary CTA */}
                  <div className="space-y-2.5">
                    <a
                      id="summary-send-whatsapp-btn"
                      href={canSendWhatsApp ? whatsappUrl : '#'}
                      target={canSendWhatsApp ? '_blank' : undefined}
                      rel={canSendWhatsApp ? 'noopener noreferrer' : undefined}
                      onClick={handleSendWhatsAppClick}
                      className="w-full py-3.5 px-4 bg-[#1ea952] hover:bg-[#178f44] text-white font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] border border-emerald-300/30 cursor-pointer"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Send Order on WhatsApp</span>
                    </a>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed text-center">
                      Clicking opens a direct WhatsApp chat with BAAGFRESH ({adminWhatsAppNumber}).
                      Review your message and press <strong>Send</strong> in WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Collapsible Pre-filled WhatsApp Message Preview */}
              <div className="rounded-2xl border border-slate-200 dark:border-[#275943] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowMessagePreview((v) => !v)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#162f22] hover:bg-slate-100 dark:hover:bg-[#1c392a] flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <span>Preview Pre-Filled WhatsApp Message</span>
                  {showMessagePreview ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showMessagePreview && (
                  <div className="p-4 bg-white dark:bg-[#0c1c14] space-y-2.5 border-t border-slate-200 dark:border-[#275943]">
                    <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#11241a] p-3 rounded-xl border border-slate-200 dark:border-[#275943] max-h-60 overflow-y-auto">
                      {whatsappMessage}
                    </pre>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] text-[11px] font-bold cursor-pointer"
                      >
                        {copiedPreview ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Order List</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
