import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Tag, 
  ShieldCheck, 
  Truck, 
  Sparkles,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resolveProductImage } from '../utils/productImageResolver';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartCount,
    cartSubtotal,
    cartDiscount,
    cartShipping,
    cartTax,
    cartTotal,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    updateQuantity,
    removeFromCart,
    formatPrice,
    setIsCheckoutOpen,
    t
  } = useApp();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ success?: boolean; text?: string } | null>(null);

  if (!isCartOpen) return null;

  const freeShippingThreshold = 999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeShippingProgress = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100);

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

  const handleProceedToCheckout = () => {
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

          {/* Free Shipping Meter */}
          <div className="bg-[#012d1d] text-[#FAF3E0] px-4 py-3 text-xs">
            {remainingForFreeShipping > 0 ? (
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#fed65b]" />
                    <span>Add <strong>{formatPrice(remainingForFreeShipping)}</strong> for FREE Delivery</span>
                  </span>
                  <span className="text-[#fed65b] font-bold">{Math.round(freeShippingProgress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#fed65b] transition-all duration-500 rounded-full"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#fed65b] font-bold">
                <Check className="w-4 h-4 text-[#fed65b]" />
                <span>Congratulations! Your order qualifies for FREE Express Delivery.</span>
              </div>
            )}
          </div>

          {/* Body: Cart Items or Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
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
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-[#FAF3E0] dark:bg-[#0f241a] text-[#012d1d] dark:text-[#fed65b] font-bold px-1.5 py-0.5 rounded border border-[#e8dfc8] dark:border-[#275943]">
                          {item.selectedWeight}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatPrice(item.price)} each
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Item Subtotal */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-slate-300 dark:border-[#275943] rounded-lg bg-white dark:bg-[#0f241a] overflow-hidden text-xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162f22]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-slate-800 dark:text-slate-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162f22]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-sm font-extrabold text-[#012d1d] dark:text-[#fed65b]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-[#FAF3E0]/70 dark:bg-[#11241a] border-t border-[#e8dfc8] dark:border-[#275943] space-y-3">
              {/* Promo Code Form */}
              <div className="space-y-1.5">
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Coupon Active: <strong>{appliedPromo}</strong></span>
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
                        placeholder="Promo Code (e.g. WELCOME10)"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-[#0f241a] text-slate-800 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-[#275943] focus:outline-none focus:ring-1 focus:ring-[#c79a1f] uppercase"
                      />
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] text-xs font-bold rounded-xl shrink-0"
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

              {/* Price Calculation Summary */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-[#275943]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatPrice(cartSubtotal)}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount:</span>
                    <span>-{formatPrice(cartDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges:</span>
                  <span className="font-semibold">
                    {cartShipping === 0 ? <strong className="text-emerald-600 dark:text-emerald-400">FREE</strong> : formatPrice(cartShipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#012d1d] dark:text-[#fed65b] pt-1.5 border-t border-slate-200 dark:border-[#275943]">
                  <span>Total Payable:</span>
                  <span className="text-base">{formatPrice(cartTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] border border-[#fed65b]/40"
              >
                <span>{t('checkout')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-bit Encrypted Vault</span>
                </span>
                <span>•</span>
                <span>UPI / Cards / COD</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
