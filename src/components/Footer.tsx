import React from 'react';
import { 
  ShieldCheck, 
  MessageCircle, 
  RotateCcw, 
  Award, 
  MapPin, 
  Phone, 
  Mail
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/products';
import { BaagfreshLogo } from './BaagfreshLogo';

export const Footer: React.FC = () => {
  const { setSelectedCategory, setIsCartOpen, setIsProfileOpen, setIsAdminOpen, setIsWholesaleOpen, storeSettings, isAdminAuthenticated, isAdminUser } = useApp();

  return (
    <footer className="bg-[#012417] text-[#FAF3E0] border-t border-[#1b4332] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* Trust Value Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-10 border-b border-[#1b4332]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#163a2c] text-[#fed65b] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-cinzel text-xs sm:text-sm font-bold text-white">
                Grade-1 Royal Quality
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Handpicked jumbo kernels & GI-tagged whole spices.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#163a2c] text-[#25D366] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-cinzel text-xs sm:text-sm font-bold text-white">
                Direct WhatsApp Ordering
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Send your complete GST-calculated order list directly to our desk on WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#163a2c] text-[#fed65b] flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-cinzel text-xs sm:text-sm font-bold text-white">
                Freshness Guaranteed
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Nitrogen-flushed multi-layer freshness seal.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#163a2c] text-[#fed65b] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-cinzel text-xs sm:text-sm font-bold text-white">
                Personal Confirmation
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Our team personally discusses, confirms, and coordinates every order on WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center">
              <BaagfreshLogo size="md" textColor="text-[#fed65b]" showTagline={true} />
            </div>

            <p className="text-slate-400 leading-relaxed max-w-sm">
              Rooted in the timeless heritage of Varanasi, Baagfresh curates rare harvests of California almonds, Kashmiri saffron, Malabar green cardamoms, and royal gifting hampers for true connoisseurs.
            </p>

            <div className="space-y-2 text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#fed65b]" />
                <span>{storeSettings.hubAddress || 'Central Processing Hub, Pisach Mochan, Varanasi, UP 221001'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#fed65b]" />
                <span>Customer Care: {storeSettings.supportPhone || '+91 87076 71319'} (9 AM - 8 PM IST)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#fed65b]" />
                <span>Order &amp; Wholesale: contact only for B2B - baagfresh@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Harvest Categories */}
          <div className="space-y-3">
            <h4 className="font-cinzel font-bold text-sm text-[#fed65b] uppercase tracking-wider">
              Harvest Vault
            </h4>
            <ul className="space-y-2 text-slate-400">
              {CATEGORIES.slice(1).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-[#fed65b] transition-colors"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="font-cinzel font-bold text-sm text-[#fed65b] uppercase tracking-wider">
              Patron Services
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="hover:text-[#fed65b] transition-colors"
                >
                  WhatsApp Order Basket
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="hover:text-[#fed65b] transition-colors"
                >
                  Saved Wishlist
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsWholesaleOpen(true)}
                  className="hover:text-[#fed65b] transition-colors"
                >
                  Corporate & Wedding Bulk Orders
                </button>
              </li>
              <li>
                <button
                  id="footer-admin-btn"
                  onClick={() => setIsAdminOpen(true)}
                  className={
                    isAdminAuthenticated || isAdminUser
                      ? 'text-[#fed65b]/90 hover:text-[#fed65b] transition-colors font-semibold flex items-center gap-1 cursor-pointer'
                      : 'text-slate-400 hover:text-[#fed65b] transition-colors text-xs flex items-center gap-1 cursor-pointer'
                  }
                >
                  <span>{isAdminAuthenticated || isAdminUser ? 'Admin Control Center' : 'Owner Sign-In'}</span>
                  {isAdminAuthenticated && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">Verified</span>
                  )}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & WhatsApp Order Desk */}
        <div className="pt-8 border-t border-[#1b4332] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © 2018 Maan Trading Company. All rights reserved. Handcrafted with reverence in Varanasi.
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2.5 py-1 bg-[#12281d] rounded border border-[#275943] text-[#fed65b] font-bold flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>WhatsApp Order Desk: {storeSettings.whatsappNumber || storeSettings.supportPhone || '+91 87076 71319'}</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
