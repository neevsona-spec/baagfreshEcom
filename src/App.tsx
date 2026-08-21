import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HeroSlider } from './components/HeroSlider';
import { CategoryRoundels } from './components/CategoryRoundels';
import { ShopCatalog } from './components/ShopCatalog';
import { ProductQuickView } from './components/ProductQuickView';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { UserProfileModal } from './components/UserProfileModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AuthModal } from './components/AuthModal';
import { WholesaleModal } from './components/WholesaleModal';
import { AdminPanel } from './components/AdminPanel';
import { GmailHubModal } from './components/GmailHubModal';
import { GeminiChatbot } from './components/GeminiChatbot';
import { Footer } from './components/Footer';
import { 
  Sparkles, 
  Gift, 
  ShieldCheck, 
  Award, 
  Truck, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ArrowRight 
} from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { toast, hideToast } = useApp();

  if (!toast) return null;

  const getToastIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce-subtle">
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-[#275943] max-w-sm">
        {getToastIcon()}
        <span className="text-xs font-semibold flex-1">{toast.message}</span>
        <button
          onClick={hideToast}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const HeritageStorySection: React.FC = () => {
  const { setSelectedCategory } = useApp();

  return (
    <section className="py-12 sm:py-16 bg-[#FAF3E0] dark:bg-[#07130d] border-y border-[#e8dfc8] dark:border-[#1b4332] transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Visual Showcase */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#162f22]">
              <img
                src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80"
                alt="FSSAI 100% Natural Products - Varanasi Spice and Dry Fruit Heritage"
                className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating Top Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3.5 py-1.5 rounded-full bg-[#012d1d]/85 text-[#fed65b] border border-[#fed65b]/40 text-xs font-bold font-cinzel tracking-wider backdrop-blur-md shadow-lg flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#fed65b]" />
                  FSSAI 100% Natural Products
                </span>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="text-xs font-bold text-[#fed65b] uppercase tracking-widest">
                  Est. Varanasi, India
                </span>
                <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white">
                  The Ancient Ghats of Sacred Flavors
                </h3>
              </div>
            </div>

            {/* Floating Seal */}
            <div className="absolute -bottom-5 -right-3 sm:-right-5 bg-[#012d1d] text-[#FAF3E0] p-4 rounded-2xl shadow-xl border border-[#fed65b]/40 max-w-[210px] text-center hidden sm:block">
              <Award className="w-6 h-6 text-[#fed65b] mx-auto mb-1" />
              <div className="font-cinzel font-bold text-xs text-[#fed65b]">
                FSSAI Certified
              </div>
              <div className="text-[10px] text-slate-300 font-semibold mt-0.5">
                100% Natural Products
              </div>
            </div>
          </div>

          {/* Narrative Copy */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#012d1d] text-[#fed65b] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Authentic Artisan Lineage</span>
            </div>

            <h2 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold text-[#012d1d] dark:text-[#FAF3E0] leading-tight">
              Preserving Royal Purity From Orchard To Your Doorstep
            </h2>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              At BAAGFRESH, our dry fruits, exotic nuts, and whole spices are ethically procured from single-origin growers across the fertile valley slopes of Kashmir, Kerala’s lush spice hills, and California’s finest sunny orchards.
            </p>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Each lot is inspected for moisture equilibrium, nitrogen-flushed to lock in natural essential oils, and packed in eco-friendly reusable amber tins and royal wooden trunks in our Varanasi facility.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-white dark:bg-[#12281d] rounded-2xl border border-slate-200 dark:border-[#275943]">
                <div className="font-cinzel font-bold text-lg text-[#012d1d] dark:text-[#fed65b]">
                  0%
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                  Chemical Preservatives or Additives
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-[#12281d] rounded-2xl border border-slate-200 dark:border-[#275943]">
                <div className="font-cinzel font-bold text-lg text-[#012d1d] dark:text-[#fed65b]">
                  100%
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                  Direct Farmer Profit Sharing
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCategory('gifting');
                document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all"
            >
              <Gift className="w-4 h-4" />
              <span>Explore Royal Festive Hampers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const AppContent: React.FC = () => {
  const { 
    isGmailHubOpen, 
    setIsGmailHubOpen, 
    gmailHubInitialOrder, 
    gmailHubInitialInquiry 
  } = useApp();

  return (
    <div className="min-h-screen bg-white dark:bg-[#07130d] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#012d1d] selection:text-[#fed65b] transition-colors duration-300">
      {/* Sticky Luxury Header */}
      <Header />

      {/* Main Content Flow */}
      <main>
        {/* Dynamic Promotional Hero Slider */}
        <HeroSlider />

        {/* Category Roundel Quick-Jump */}
        <CategoryRoundels />

        {/* Full Shop Catalog with Filters, Grid, and Pack Options */}
        <ShopCatalog />

        {/* Heritage Story & Artisan Assurance Section */}
        <HeritageStorySection />
      </main>

      {/* Luxury Footer */}
      <Footer />

      {/* Interactive Modals and Slide-out Drawers */}
      <ProductQuickView />
      <CartDrawer />
      <CheckoutModal />
      <OrderTrackingModal />
      <UserProfileModal />
      <NotificationsModal />
      <AuthModal />
      <WholesaleModal />
      <AdminPanel />
      <GmailHubModal
        isOpen={isGmailHubOpen}
        onClose={() => setIsGmailHubOpen(false)}
        initialOrder={gmailHubInitialOrder}
        initialInquiry={gmailHubInitialInquiry}
      />

      {/* Royal Gemini AI Concierge & Chatbot */}
      <GeminiChatbot />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
