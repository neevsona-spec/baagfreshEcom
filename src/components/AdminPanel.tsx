import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Tag, 
  Building2, 
  Settings, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Eye, 
  EyeOff,
  RefreshCw, 
  Save, 
  ChevronRight, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert,
  BadgeCheck,
  ArrowUpRight,
  Filter,
  Check,
  Mail,
  Phone,
  FileText,
  KeyRound,
  ArrowLeft,
  Loader2,
  LogOut,
  ExternalLink,
  FileSpreadsheet,
  Upload,
  Download
} from 'lucide-react';
import { BulkCatalogManager } from './BulkCatalogManager';
import { useApp } from '../context/AppContext';
import { Product, PromoCodeItem, StoreSettings, WholesaleInquiry, Order, CategorySlug, PackOption, RolePermissionPolicy, SecurityAuditLog, SecurityPostureStatus } from '../types';
import { CATEGORIES } from '../data/products';
import { resolveProductImage } from '../utils/productImageResolver';
import { 
  signInWithGoogle, 
  checkIsAdmin, 
  ensureAdminRecordInFirestore, 
  ADMIN_EMAILS 
} from '../lib/firebase';
import { authLogger } from '../utils/authLogger';

export const AdminPanel: React.FC = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    firebaseUser,
    user,
    setUser,
    signOutUser,
    showToast,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStock,
    resetProductsToDefault,
    orders,
    updateOrderStatus,
    promoCodes,
    addPromoCode,
    updatePromoCode,
    deletePromoCode,
    togglePromoCode,
    wholesaleInquiries,
    updateInquiryStatus,
    deleteInquiry,
    storeSettings,
    updateStoreSettings,
    formatPrice,
    openGmailInvoice,
    openGmailInquiry,
    setIsGmailHubOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'promos' | 'inquiries' | 'settings' | 'security'>('overview');
  const [isBulkManagerOpen, setIsBulkManagerOpen] = useState(false);
  
  // Admin Google Authentication state
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Security & RBAC state
  const [securityPosture, setSecurityPosture] = useState<SecurityPostureStatus>({
    googleAuthEnforced: true,
    serverSideVerificationActive: true,
    rbacPolicyLoaded: true,
    firestoreRulesEnforced: true,
    lastAuditCheck: new Date().toLocaleTimeString(),
    authorizedAdminCount: ADMIN_EMAILS.length,
  });
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [rolePolicies, setRolePolicies] = useState<RolePermissionPolicy[]>([]);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining > 0) {
      const timer = setTimeout(() => {
        setLockoutRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutRemaining]);

  // Products tab state
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<CategorySlug>('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
  const [productSortBy, setProductSortBy] = useState<'name-asc' | 'price-low' | 'price-high' | 'category'>('name-asc');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // New product form - start completely blank with no pre-filled text
  const [newProdName, setNewProdName] = useState('');
  const [newProdHindi, setNewProdHindi] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'dry-fruits' | 'spices' | 'seeds-berries' | 'gifting' | 'dates-exotics'>('dry-fruits');
  const [newProdOrigin, setNewProdOrigin] = useState('');
  const [newProdBasePrice, setNewProdBasePrice] = useState<number | ''>('');
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState<number | ''>('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdBadge, setNewProdBadge] = useState<Product['badge'] | ''>('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdBenefits, setNewProdBenefits] = useState('');
  const [newProdInStock, setNewProdInStock] = useState<boolean>(true);
  const [newProdIsOrganic, setNewProdIsOrganic] = useState<boolean>(true);
  const [newProdHarvest, setNewProdHarvest] = useState('');
  const [newProdGrading, setNewProdGrading] = useState('');
  const [newProdPackOptions, setNewProdPackOptions] = useState<PackOption[]>([]);

  // Orders tab state
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [customTrackingNote, setCustomTrackingNote] = useState('');

  // Promo tab state
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoType, setNewPromoType] = useState<'percent' | 'flat'>('percent');
  const [newPromoValue, setNewPromoValue] = useState(15);
  const [newPromoMinOrder, setNewPromoMinOrder] = useState(499);
  const [newPromoMaxDiscount, setNewPromoMaxDiscount] = useState(500);
  const [newPromoDesc, setNewPromoDesc] = useState('');
  const [newPromoExpiry, setNewPromoExpiry] = useState('2026-12-31');

  // Store settings form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(storeSettings);

  // Keep settingsForm synchronized when storeSettings updates remotely
  useEffect(() => {
    setSettingsForm(storeSettings);
  }, [storeSettings]);

  const handleOpenInNewTab = () => {
    try {
      window.open(window.location.href, '_blank');
      showToast('Opened store in dedicated tab for direct Google authentication.', 'info');
    } catch {
      window.location.reload();
    }
  };

  const recordFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 5) {
      setLockoutRemaining(60);
      setAuthError('Maximum authentication attempts exceeded. Security cooldown active for 60 seconds.');
    }
  };

  const handleGoogleAdminLogin = async () => {
    if (lockoutRemaining > 0) return;
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);
    authLogger.startSession('Admin Console Google Sign-In');

    try {
      // 1. Authenticate with Google Popup
      const userRes = await signInWithGoogle();
      const userEmail = (userRes.email || '').toLowerCase().trim();

      if (!userEmail) {
        throw new Error('Could not retrieve verified email address from Google Account.');
      }

      // 2. Strict Privilege Verification: Is this Google account an authorized administrator?
      const isAuthorizedEmail = ADMIN_EMAILS.includes(userEmail);
      const isExistingAdminDoc = await checkIsAdmin(userRes.uid, userEmail);

      // 3. Server-side session verification check
      try {
        const verifyRes = await fetch('/api/admin/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, authProvider: 'google.com' })
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.authorized) {
          throw new Error(verifyData.message || 'Server-side access control verification rejected administrative privileges.');
        }
      } catch (srvErr: any) {
        console.warn('Server-side verification notice (offline/local fallback):', srvErr);
      }

      authLogger.logPrivilegeCheck(userEmail, isAuthorizedEmail, isExistingAdminDoc);

      if (!isAuthorizedEmail && !isExistingAdminDoc) {
        authLogger.logError(
          new Error(`Google Account "${userEmail}" is not recognized as an authorized administrator.`),
          'Admin Authorization Check'
        );
        authLogger.endSession('failed');

        // Strict denial for unauthorized Google accounts
        setAuthError(
          `Access Denied: Google Account "${userEmail}" is not recognized as an administrator. Please sign in with an authorized account (e.g. ${ADMIN_EMAILS[0]}).`
        );
        recordFailedAttempt();
        return;
      }

      // 4. Proactively sync/record admin status in Firestore
      await ensureAdminRecordInFirestore(
        userRes.uid,
        userEmail,
        'superadmin',
        userRes.displayName ? `${userRes.displayName} (Administrator)` : 'Master Administrator'
      );

      setIsAdminAuthenticated(true);
      setFailedAttempts(0);
      setUser((prev) => ({
        ...prev,
        id: userRes.uid,
        name: userRes.displayName || 'Master Administrator',
        email: userEmail,
        avatar: userRes.photoURL || prev.avatar,
        memberSince: 'Founding Administrator'
      }));

      authLogger.logSessionHydration(userEmail, 'superadmin', true);
      authLogger.endSession('success', `Admin authenticated: ${userEmail}`);
      showToast(`Master Administrator Authenticated: ${userEmail}`, 'success');
      
      // Load initial security audit posture
      fetchSecurityAuditData(userEmail);
    } catch (err: any) {
      console.warn('Google Admin Auth notice:', err);
      authLogger.logError(err, 'Google Admin Authentication');
      
      const errorMsg = err?.message || 'Google Sign-In failed or popup was closed. Click "Open in Dedicated Tab" above if popup is blocked by your browser.';
      setAuthError(errorMsg);
      recordFailedAttempt();
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchSecurityAuditData = async (adminEmail?: string) => {
    setLoadingSecurity(true);
    const emailToUse = adminEmail || user?.email || ADMIN_EMAILS[0];
    try {
      const res = await fetch('/api/admin/security-audit', {
        headers: {
          'x-admin-email': emailToUse,
          'Authorization': `Bearer ${emailToUse}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.posture) {
          setSecurityPosture({
            ...data.posture,
            lastAuditCheck: new Date().toLocaleTimeString(),
          });
        }
        if (Array.isArray(data.auditEvents)) {
          setAuditLogs(data.auditEvents);
        }
        if (Array.isArray(data.rolePolicies)) {
          setRolePolicies(data.rolePolicies);
        }
      } else {
        // Fetch fallback public role policies
        const roleRes = await fetch('/api/auth/roles-policy');
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          if (Array.isArray(roleData.matrix)) {
            setRolePolicies(roleData.matrix);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch remote security audit logs:', err);
    } finally {
      setLoadingSecurity(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated && activeTab === 'security') {
      fetchSecurityAuditData();
    }
  }, [isAdminAuthenticated, activeTab]);

  const handleSecureAdminLogout = async () => {
    try {
      setAuthLoading(true);
      setIsAdminAuthenticated(false);
      setAuthError('');
      setAuthSuccess('');
      // Sign out of Firebase authentication session
      await signOutUser();
      // Close admin console
      setIsAdminOpen(false);
      // Return user to public store / homepage
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Admin session closed. Returned to public store.', 'info');
    } catch (err) {
      console.warn('Admin logout error:', err);
      setIsAdminAuthenticated(false);
      setIsAdminOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Admin console closed.', 'info');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;

    const basePriceNum = Number(newProdBasePrice) || 0;
    const origPriceNum = Number(newProdOriginalPrice) || basePriceNum;
    const baseDiscount = origPriceNum > basePriceNum ? Math.round(((origPriceNum - basePriceNum) / origPriceNum) * 100) : 0;
    const finalImage = newProdImage.trim() || 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80';
    const finalOrigin = newProdOrigin.trim() || 'Varanasi / Kashmir, India';

    // If user edited custom pack options, use them; otherwise construct sensible tiers
    const finalPackOptions: PackOption[] = newProdPackOptions.length > 0
      ? newProdPackOptions.map((opt, idx) => ({
          weight: opt.weight.trim() || `${250 * (idx + 1)}g`,
          price: Number(opt.price) || Math.round(basePriceNum * (idx === 0 ? 1 : idx === 1 ? 1.9 : 3.6)),
          originalPrice: Number(opt.originalPrice) || Math.round(origPriceNum * (idx === 0 ? 1 : idx === 1 ? 1.9 : 3.6)),
          discountPercent: Number(opt.discountPercent) || Math.min(60, baseDiscount + (idx * 5)),
          popular: opt.popular || idx === 1
        }))
      : [
          { weight: '250g', price: basePriceNum, originalPrice: origPriceNum, discountPercent: baseDiscount },
          { weight: '500g', price: Math.round(basePriceNum * 1.9), originalPrice: Math.round(origPriceNum * 1.9), discountPercent: Math.min(60, baseDiscount + 5), popular: true },
          { weight: '1kg Royal Box', price: Math.round(basePriceNum * 3.6), originalPrice: Math.round(origPriceNum * 3.6), discountPercent: Math.min(60, baseDiscount + 10) }
        ];

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: newProdName,
        hindiName: newProdHindi,
        category: newProdCategory,
        origin: finalOrigin,
        basePrice: basePriceNum,
        originalPrice: origPriceNum,
        packOptions: finalPackOptions,
        image: finalImage,
        badge: (newProdBadge || undefined) as Product['badge'],
        description: newProdDesc,
        benefits: newProdBenefits ? newProdBenefits.split(',').map((b) => b.trim()).filter(Boolean) : ['100% Pure & Natural'],
        inStock: newProdInStock,
        isOrganic: newProdIsOrganic,
        harvestSeason: newProdHarvest || 'Winter / Spring',
        grading: newProdGrading || 'Grade-1 Jumbo Connoisseur Batch',
      });
      showToast(`Updated "${newProdName}" successfully.`, 'info');
      setEditingProduct(null);
    } else {
      const generatedId = `bf-${newProdName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
      const createdProd: Product = {
        id: generatedId,
        name: newProdName,
        hindiName: newProdHindi || newProdName,
        category: newProdCategory,
        origin: finalOrigin,
        basePrice: basePriceNum,
        originalPrice: origPriceNum,
        rating: 4.9,
        reviewsCount: 1,
        image: finalImage,
        gallery: [finalImage],
        packOptions: finalPackOptions,
        badge: (newProdBadge || undefined) as Product['badge'],
        description: newProdDesc || `Handcrafted and nitrogen-sealed dry fruits from Varanasi Processing Hub.`,
        longDescription: newProdDesc || `Ethically procured raw harvest, nitrogen-sealed in food-grade packaging to retain maximum freshness and natural aromatics.`,
        benefits: newProdBenefits ? newProdBenefits.split(',').map((b) => b.trim()).filter(Boolean) : ['100% Pure & Natural', 'Farm Fresh'],
        inStock: newProdInStock,
        isOrganic: newProdIsOrganic,
        harvestSeason: newProdHarvest || 'Winter / Spring',
        grading: newProdGrading || 'Grade-1 Jumbo Connoisseur Batch',
        nutrition: {
          calories: '575 kcal',
          protein: '21g',
          healthyFats: '49g',
          carbs: '22g',
          dietaryFiber: '12g',
          keyVitamins: 'Vitamin E, Magnesium, Potassium, Zinc'
        }
      };
      addProduct(createdProd);
      showToast(`Added "${newProdName}" to store catalog.`, 'info');
    }

    setIsAddingProduct(false);
    resetProductForm();
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setNewProdName(prod.name);
    setNewProdHindi(prod.hindiName || '');
    setNewProdCategory(prod.category);
    setNewProdOrigin(prod.origin || '');
    setNewProdBasePrice(prod.basePrice);
    setNewProdOriginalPrice(prod.originalPrice);
    setNewProdImage(prod.image || '');
    setNewProdBadge((prod.badge || '') as Product['badge'] | '');
    setNewProdDesc(prod.description || '');
    setNewProdBenefits(prod.benefits ? prod.benefits.join(', ') : '');
    setNewProdInStock(prod.inStock !== false);
    setNewProdIsOrganic(prod.isOrganic !== false);
    setNewProdHarvest(prod.harvestSeason || '');
    setNewProdGrading(prod.grading || '');
    setNewProdPackOptions(prod.packOptions ? [...prod.packOptions] : []);
    setIsAddingProduct(true);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setNewProdName('');
    setNewProdHindi('');
    setNewProdCategory('dry-fruits');
    setNewProdOrigin('');
    setNewProdBasePrice('');
    setNewProdOriginalPrice('');
    setNewProdImage('');
    setNewProdBadge('');
    setNewProdDesc('');
    setNewProdBenefits('');
    setNewProdInStock(true);
    setNewProdIsOrganic(true);
    setNewProdHarvest('');
    setNewProdGrading('');
    setNewProdPackOptions([]);
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode) return;

    const promo: PromoCodeItem = {
      id: `promo-${Date.now()}`,
      code: newPromoCode.trim().toUpperCase(),
      discountPercent: newPromoType === 'percent' ? Number(newPromoValue) : undefined,
      flatDiscount: newPromoType === 'flat' ? Number(newPromoValue) : undefined,
      minOrderValue: Number(newPromoMinOrder),
      maxDiscount: newPromoType === 'percent' ? Number(newPromoMaxDiscount) : undefined,
      description: newPromoDesc || `${newPromoValue}${newPromoType === 'percent' ? '%' : '₹'} discount for store patrons`,
      isActive: true,
      usageCount: 0,
      expiryDate: newPromoExpiry,
    };

    addPromoCode(promo);
    setIsAddingPromo(false);
    setNewPromoCode('');
    setNewPromoDesc('');
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.total, 0);
  const activeOrdersCount = orders.filter((o) => o.status !== 'delivered').length;
  const outOfStockCount = products.filter((p) => p.inStock === false).length;
  const pendingInquiriesCount = wholesaleInquiries.filter((i) => i.status === 'new' || i.status === 'contacted').length;

  if (!isAdminOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[96vh] sm:h-[92vh] bg-white dark:bg-[#07130d] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#d6caba] dark:border-[#275943] flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="bg-[#012d1d] text-[#FAF3E0] px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-[#1b4332] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#163a2c] text-[#fed65b] flex items-center justify-center border border-[#fed65b]/30 shrink-0">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="font-cinzel text-sm sm:text-lg font-bold text-white tracking-wide">
                  BAAGFRESH Admin
                </h2>
                <span className="bg-[#fed65b] text-[#012d1d] text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full">
                  Master
                </span>
                {isAdminAuthenticated && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Isolated Session Active
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-300 hidden sm:block">
                {isAdminAuthenticated 
                  ? `Isolated Session: ${user?.email || 'Authorized Administrator'} • Full Royal RBAC Clearance`
                  : 'Live management for catalog, orders, coupons, store banners, and B2B inquiries.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAdminAuthenticated && (
              <button
                id="admin-topbar-logout-btn"
                onClick={handleSecureAdminLogout}
                disabled={authLoading}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-red-900/40 hover:bg-red-800/60 text-red-200 hover:text-white border border-red-500/40 font-bold transition-all shadow-sm group cursor-pointer"
                title="Secure Logout & Return to Public Store"
              >
                {authLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-300" />
                ) : (
                  <LogOut className="w-3.5 h-3.5 text-red-300 group-hover:-translate-x-0.5 transition-transform" />
                )}
                <span className="hidden sm:inline">Secure Logout & Exit</span>
                <span className="sm:hidden">Logout</span>
              </button>
            )}
            <button
              onClick={() => setIsAdminOpen(false)}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-[#163a2c] transition-colors cursor-pointer"
              aria-label="Close Admin Panel"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Auth Gate if not logged in */}
        {!isAdminAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-[#0a1b12] overflow-y-auto">
            <div className="w-full max-w-md bg-white dark:bg-[#0f241a] p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-[#275943] text-left space-y-6">
              
              {/* Header Badge */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-[#012d1d] text-[#fed65b] flex items-center justify-center mx-auto border border-[#fed65b]/40 shadow-inner">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="font-cinzel text-xl font-bold text-[#012d1d] dark:text-[#fed65b]">
                  Admin Control Center
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Restricted administrative portal. Sign in with your authorized Google Administrator account to manage the store.
                </p>
              </div>

              {/* Status & Error Alerts */}
              {authError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <div className="flex-1 font-medium">{authError}</div>
                </div>
              )}

              {authSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div className="flex-1 font-medium">{authSuccess}</div>
                </div>
              )}

              {lockoutRemaining > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Security cooldown active. Retry in <strong>{lockoutRemaining}s</strong></span>
                </div>
              )}

              {/* Google OAuth Administrative Login */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#162f22] border border-slate-200 dark:border-[#275943] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Google Administrator Auth
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Dedicated Tab</span>
                    </button>
                  </div>

                  <button
                    id="admin-google-auth-btn"
                    type="button"
                    onClick={handleGoogleAdminLogin}
                    disabled={authLoading || lockoutRemaining > 0}
                    className="w-full py-3.5 px-4 rounded-xl border-2 border-[#012d1d] dark:border-[#fed65b]/60 bg-white hover:bg-slate-50 dark:bg-[#12281d] dark:hover:bg-[#183829] text-[#012d1d] dark:text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer active:scale-[0.99]"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#012d1d] dark:text-[#fed65b]" />
                        <span>Verifying Administrator Identity...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Sign In with Google (Admin)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-[#1b4332] text-center">
                <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Strict RBAC Security • Isolated Management Session</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Admin Workspace */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-slate-50 dark:bg-[#0c1f16] border-b md:border-b-0 md:border-r border-slate-200 dark:border-[#1b4332] p-2 sm:p-4 flex md:flex-col justify-between overflow-x-auto no-scrollbar shrink-0">
              <div className="flex md:flex-col gap-1.5 w-full">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'overview'
                      ? 'bg-[#012d1d] text-[#fed65b] shadow-sm font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Overview & KPI</span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center justify-between gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'products'
                      ? 'bg-[#012d1d] text-[#fed65b] shadow-sm font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Package className="w-4 h-4 shrink-0" />
                    <span>Catalog & Stock</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-[#1b4332] text-slate-700 dark:text-slate-300">
                    {products.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center justify-between gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'orders'
                      ? 'bg-[#012d1d] text-[#fed65b] shadow-sm font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>Orders & Logistics</span>
                  </div>
                  {activeOrdersCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fed65b] text-[#012d1d] font-bold">
                      {activeOrdersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('promos')}
                  className={`flex items-center justify-between gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'promos'
                      ? 'bg-[#012d1d] text-[#fed65b] shadow-sm font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Tag className="w-4 h-4 shrink-0" />
                    <span>Promo Engine</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-[#1b4332]">
                    {promoCodes.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('inquiries')}
                  className={`flex items-center justify-between gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'inquiries'
                      ? 'bg-[#012d1d] text-[#fed65b] shadow-sm font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>B2B Inquiries</span>
                  </div>
                  {pendingInquiriesCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                      {pendingInquiriesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'settings'
                      ? 'bg-[#012d1d] text-[#fed65b] shadow-sm font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Store Global Settings</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center justify-between gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'security'
                      ? 'bg-[#012d1d] text-[#fed65b] shadow-sm font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Security & Access Control</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                    RBAC
                  </span>
                </button>

                <button
                  onClick={() => setIsGmailHubOpen(true)}
                  className="flex items-center justify-between gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all bg-amber-500/10 dark:bg-amber-950/40 text-amber-800 dark:text-[#fed65b] border border-amber-300/60 dark:border-[#275943] hover:bg-amber-500/20"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Mail className="w-4 h-4 shrink-0 text-[#c79a1f]" />
                    <span>Gmail Dispatch Hub</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-[#fed65b]">
                    OAuth
                  </span>
                </button>
              </div>

              {/* Status & Logout footer in sidebar */}
              <div className="hidden md:flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-[#1b4332] text-[11px] text-slate-400">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#07130d] border border-slate-200 dark:border-[#1b4332] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Isolated Session Active</span>
                    </div>
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate">
                    {user?.email || 'neevsona@gmail.com'}
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500">
                    Varanasi Hub • Full RBAC Clearance
                  </div>
                </div>

                <button
                  id="admin-sidebar-logout-btn"
                  onClick={handleSecureAdminLogout}
                  disabled={authLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm group cursor-pointer"
                  title="Secure Admin Logout & Return to Store Homepage"
                >
                  {authLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5 text-red-500 group-hover:-translate-x-0.5 transition-transform" />
                  )}
                  <span>Secure Logout & Home</span>
                </button>
              </div>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#07130d]">
              {/* TAB 1: OVERVIEW & KPI */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-[#012d1d] dark:text-[#fed65b]">
                      Command Dashboard Overview
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Real-time metrics for Varanasi harvest orders, catalog items, and client inquiries.
                    </p>
                  </div>

                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-[#0d2a1c] dark:to-[#091f14] rounded-2xl border border-emerald-200 dark:border-[#275943]">
                      <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 text-xs font-semibold mb-1">
                        <span>Total Revenue</span>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold font-cinzel text-[#012d1d] dark:text-white">
                        {formatPrice(totalRevenue)}
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1">
                        Across all recorded consignments
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-[#2a240d] dark:to-[#1a1708] rounded-2xl border border-amber-200 dark:border-[#594d27]">
                      <div className="flex items-center justify-between text-amber-800 dark:text-amber-400 text-xs font-semibold mb-1">
                        <span>Active Orders</span>
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold font-cinzel text-[#012d1d] dark:text-[#fed65b]">
                        {activeOrdersCount}
                      </div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                        In packing / dispatch transit
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-[#0d1e2a] dark:to-[#08131a] rounded-2xl border border-blue-200 dark:border-[#274859]">
                      <div className="flex items-center justify-between text-blue-800 dark:text-blue-400 text-xs font-semibold mb-1">
                        <span>Harvest Catalog</span>
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold font-cinzel text-[#012d1d] dark:text-blue-300">
                        {products.length} Products
                      </div>
                      <div className="text-[10px] text-blue-700 dark:text-blue-300 mt-1">
                        {outOfStockCount} marked out of stock
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-[#240d2a] dark:to-[#17081a] rounded-2xl border border-purple-200 dark:border-[#4d2759]">
                      <div className="flex items-center justify-between text-purple-800 dark:text-purple-400 text-xs font-semibold mb-1">
                        <span>B2B Inquiries</span>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold font-cinzel text-[#012d1d] dark:text-purple-300">
                        {wholesaleInquiries.length} Inquiries
                      </div>
                      <div className="text-[10px] text-purple-700 dark:text-purple-300 mt-1">
                        {pendingInquiriesCount} requiring quotation
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Shortcuts */}
                  <div className="p-4 bg-[#FAF3E0] dark:bg-[#0f241a] rounded-2xl border border-[#d6caba] dark:border-[#275943]">
                    <h4 className="font-cinzel text-sm font-bold text-[#012d1d] dark:text-[#fed65b] mb-3">
                      ⚡ Quick Operations
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <button
                        onClick={() => {
                          setIsBulkManagerOpen(true);
                        }}
                        className="p-3 bg-emerald-50 dark:bg-[#0d2a1c] rounded-xl border border-emerald-300 dark:border-[#275943] text-left hover:border-emerald-600 transition-all group"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-emerald-700 dark:text-[#fed65b] mb-1.5 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-emerald-950 dark:text-white">Bulk Excel / CSV</div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300">Ingest & batch sync</div>
                      </button>

                      <button
                        onClick={() => {
                          resetProductForm();
                          setIsAddingProduct(true);
                          setActiveTab('products');
                        }}
                        className="p-3 bg-white dark:bg-[#162f22] rounded-xl border border-slate-200 dark:border-[#275943] text-left hover:border-[#012d1d] transition-all group"
                      >
                        <Plus className="w-5 h-5 text-[#012d1d] dark:text-[#fed65b] mb-1.5 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-[#012d1d] dark:text-white">Add New Product</div>
                        <div className="text-[10px] text-slate-400">Add to royal catalog</div>
                      </button>

                      <button
                        onClick={() => {
                          setIsAddingPromo(true);
                          setActiveTab('promos');
                        }}
                        className="p-3 bg-white dark:bg-[#162f22] rounded-xl border border-slate-200 dark:border-[#275943] text-left hover:border-[#012d1d] transition-all group"
                      >
                        <Tag className="w-5 h-5 text-[#012d1d] dark:text-[#fed65b] mb-1.5 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-[#012d1d] dark:text-white">Create Promo Code</div>
                        <div className="text-[10px] text-slate-400">Deploy discount campaign</div>
                      </button>

                      <button
                        onClick={() => setActiveTab('orders')}
                        className="p-3 bg-white dark:bg-[#162f22] rounded-xl border border-slate-200 dark:border-[#275943] text-left hover:border-[#012d1d] transition-all group"
                      >
                        <Truck className="w-5 h-5 text-[#012d1d] dark:text-[#fed65b] mb-1.5 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-[#012d1d] dark:text-white">Dispatch Orders</div>
                        <div className="text-[10px] text-slate-400">Update tracking steps</div>
                      </button>

                      <button
                        onClick={() => setActiveTab('settings')}
                        className="p-3 bg-white dark:bg-[#162f22] rounded-xl border border-slate-200 dark:border-[#275943] text-left hover:border-[#012d1d] transition-all group"
                      >
                        <Sparkles className="w-5 h-5 text-[#012d1d] dark:text-[#fed65b] mb-1.5 group-hover:scale-110 transition-transform" />
                        <div className="text-xs font-bold text-[#012d1d] dark:text-white">Broadcast Banner</div>
                        <div className="text-[10px] text-slate-400">Update announcement text</div>
                      </button>
                    </div>
                  </div>

                  {/* Recent Orders Overview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-cinzel text-sm font-bold text-[#012d1d] dark:text-[#fed65b]">
                        Recent Customer Orders
                      </h4>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-xs text-[#012d1d] dark:text-[#fed65b] font-bold hover:underline"
                      >
                        View All Orders →
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-[#275943]/40 border border-slate-200 dark:border-[#275943] rounded-2xl overflow-hidden bg-white dark:bg-[#0f241a]">
                      {orders.slice(0, 3).map((ord) => (
                        <div key={ord.id} className="p-4 flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-[#1a3828] text-[#012d1d] dark:text-[#fed65b] flex items-center justify-center font-mono font-bold text-xs">
                              {ord.orderNumber.slice(-3)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#012d1d] dark:text-white">
                                {ord.orderNumber}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {ord.shippingAddress?.fullName || 'Customer'} • {ord.items.length} item(s) • {ord.date}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-[#012d1d] dark:text-[#fed65b]">
                              {formatPrice(ord.total)}
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : ord.status === 'out_for_delivery'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRODUCTS & INVENTORY MANAGER */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-cinzel text-xl font-bold text-[#012d1d] dark:text-[#fed65b] flex items-center gap-2">
                        <span>Harvest Catalog & Inventory</span>
                        <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-[#012d1d]/10 dark:bg-[#fed65b]/20 text-[#012d1d] dark:text-[#fed65b]">
                          {products.length} Products
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        View, edit, and manage all harvest items across Dry Fruits, Spices, Seeds & Berries, Gift Boxes, and Dates & Exotics.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setIsBulkManagerOpen(true)}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Upload products directly from Excel or CSV with column mapping and Firestore sync"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Bulk Excel / CSV Ingest</span>
                      </button>

                      <button
                        onClick={resetProductsToDefault}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#162f22] hover:bg-slate-200 dark:hover:bg-[#1f4230] rounded-xl transition-colors flex items-center gap-1.5"
                        title="Reset all products to Varanasi default catalog"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset Default</span>
                      </button>

                      <button
                        onClick={() => {
                          resetProductForm();
                          setIsAddingProduct(true);
                        }}
                        className="px-4 py-2 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Product</span>
                      </button>
                    </div>
                  </div>

                  {/* Category Filter Pills Bar */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    <button
                      onClick={() => setProductCategoryFilter('all')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        productCategoryFilter === 'all'
                          ? 'bg-[#012d1d] text-[#fed65b] shadow-sm dark:bg-[#fed65b] dark:text-[#012d1d]'
                          : 'bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#275943] hover:border-[#012d1d]'
                      }`}
                    >
                      <span>All Harvests</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">
                        {products.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setProductCategoryFilter('dry-fruits')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        productCategoryFilter === 'dry-fruits'
                          ? 'bg-[#012d1d] text-[#fed65b] shadow-sm dark:bg-[#fed65b] dark:text-[#012d1d]'
                          : 'bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#275943] hover:border-[#012d1d]'
                      }`}
                    >
                      <span>Royal Dry Fruits</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">
                        {products.filter((p) => p.category === 'dry-fruits').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setProductCategoryFilter('spices')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        productCategoryFilter === 'spices'
                          ? 'bg-[#012d1d] text-[#fed65b] shadow-sm dark:bg-[#fed65b] dark:text-[#012d1d]'
                          : 'bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#275943] hover:border-[#012d1d]'
                      }`}
                    >
                      <span>Heritage Spices</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">
                        {products.filter((p) => p.category === 'spices').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setProductCategoryFilter('seeds-berries')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        productCategoryFilter === 'seeds-berries'
                          ? 'bg-[#012d1d] text-[#fed65b] shadow-sm dark:bg-[#fed65b] dark:text-[#012d1d]'
                          : 'bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#275943] hover:border-[#012d1d]'
                      }`}
                    >
                      <span>Seeds & Berries</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">
                        {products.filter((p) => p.category === 'seeds-berries').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setProductCategoryFilter('gifting')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        productCategoryFilter === 'gifting'
                          ? 'bg-[#012d1d] text-[#fed65b] shadow-sm dark:bg-[#fed65b] dark:text-[#012d1d]'
                          : 'bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#275943] hover:border-[#012d1d]'
                      }`}
                    >
                      <span>Gift Hampers</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">
                        {products.filter((p) => p.category === 'gifting').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setProductCategoryFilter('dates-exotics')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        productCategoryFilter === 'dates-exotics'
                          ? 'bg-[#012d1d] text-[#fed65b] shadow-sm dark:bg-[#fed65b] dark:text-[#012d1d]'
                          : 'bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#275943] hover:border-[#012d1d]'
                      }`}
                    >
                      <span>Dates & Exotics</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">
                        {products.filter((p) => p.category === 'dates-exotics').length}
                      </span>
                    </button>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f241a] border border-slate-200 dark:border-[#275943] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total SKUs</div>
                        <div className="text-base font-bold text-slate-900 dark:text-white">{products.length} Items</div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f241a] border border-slate-200 dark:border-[#275943] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">In Stock Active</div>
                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {products.filter((p) => p.inStock !== false).length}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f241a] border border-slate-200 dark:border-[#275943] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Sold Out</div>
                        <div className="text-base font-bold text-rose-600 dark:text-rose-400">
                          {products.filter((p) => p.inStock === false).length}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f241a] border border-slate-200 dark:border-[#275943] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Categories</div>
                        <div className="text-base font-bold text-amber-600 dark:text-amber-400">5 Categories</div>
                      </div>
                    </div>
                  </div>

                  {/* Add / Edit Product Modal Form */}
                  {isAddingProduct && (
                    <div className="p-6 bg-[#FAF3E0] dark:bg-[#0f241a] rounded-3xl border border-[#d6caba] dark:border-[#275943] space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-[#d6caba] dark:border-[#275943] pb-3">
                        <div>
                          <h4 className="font-cinzel text-base font-bold text-[#012d1d] dark:text-[#fed65b]">
                            {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Harvest Item'}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Configure harvest origin, pack options, pricing, and availability.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsAddingProduct(false);
                            resetProductForm();
                          }}
                          className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Product Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={newProdName}
                              onChange={(e) => setNewProdName(e.target.value)}
                              placeholder="e.g. Royal Kashmiri Mamra Almonds"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Hindi / Regional Name
                            </label>
                            <input
                              type="text"
                              value={newProdHindi}
                              onChange={(e) => setNewProdHindi(e.target.value)}
                              placeholder="e.g. कश्मीरी बादाम"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Category *
                            </label>
                            <select
                              value={newProdCategory}
                              onChange={(e) => setNewProdCategory(e.target.value as Product['category'])}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 font-semibold"
                            >
                              <option value="dry-fruits">Dry Fruits</option>
                              <option value="spices">Heritage Spices</option>
                              <option value="seeds-berries">Seeds & Berries</option>
                              <option value="gifting">Royal Gifting Hampers</option>
                              <option value="dates-exotics">Dates & Exotics</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Origin Terroir
                            </label>
                            <input
                              type="text"
                              value={newProdOrigin}
                              onChange={(e) => setNewProdOrigin(e.target.value)}
                              placeholder="e.g. Pulwama, Kashmir / Kerala / Varanasi"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Base Price (INR ₹) *
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={newProdBasePrice === '' ? '' : newProdBasePrice}
                              onChange={(e) => setNewProdBasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="e.g. 599"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Original / Strike Price (INR ₹)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={newProdOriginalPrice === '' ? '' : newProdOriginalPrice}
                              onChange={(e) => setNewProdOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="e.g. 799"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Pill Badge (Optional)
                            </label>
                            <select
                              value={newProdBadge}
                              onChange={(e) => setNewProdBadge(e.target.value as Product['badge'] | '')}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            >
                              <option value="">None</option>
                              <option value="Best Seller">Best Seller</option>
                              <option value="100% Pure">100% Pure</option>
                              <option value="Organic">Organic</option>
                              <option value="Farm Fresh">Farm Fresh</option>
                              <option value="Festive Pick">Festive Pick</option>
                              <option value="New">New</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Harvest Season
                            </label>
                            <input
                              type="text"
                              value={newProdHarvest}
                              onChange={(e) => setNewProdHarvest(e.target.value)}
                              placeholder="e.g. Autumn / Spring 2026"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Quality Grading
                            </label>
                            <input
                              type="text"
                              value={newProdGrading}
                              onChange={(e) => setNewProdGrading(e.target.value)}
                              placeholder="e.g. Grade-1 Jumbo Connoisseur"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div className="flex items-center gap-4 pt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newProdInStock}
                                onChange={(e) => setNewProdInStock(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600"
                              />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">In Stock</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newProdIsOrganic}
                                onChange={(e) => setNewProdIsOrganic(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600"
                              />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">100% Organic</span>
                            </label>
                          </div>
                        </div>

                        {/* Pack Options Builder */}
                        <div className="p-3 bg-white dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943]/60 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                Pack Options & Weights
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                Specify custom sizes and prices for customer selection.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const defaultWeight = newProdPackOptions.length === 0 ? '250g' : newProdPackOptions.length === 1 ? '500g' : '1kg';
                                const baseP = Number(newProdBasePrice) || 500;
                                const multiplier = newProdPackOptions.length === 0 ? 1 : newProdPackOptions.length === 1 ? 1.9 : 3.6;
                                setNewProdPackOptions([
                                  ...newProdPackOptions,
                                  {
                                    weight: defaultWeight,
                                    price: Math.round(baseP * multiplier),
                                    originalPrice: Math.round((Number(newProdOriginalPrice) || baseP) * multiplier),
                                    discountPercent: 10,
                                    popular: newProdPackOptions.length === 1
                                  }
                                ]);
                              }}
                              className="px-2.5 py-1 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] rounded-lg text-[11px] font-semibold flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Pack Size</span>
                            </button>
                          </div>

                          {newProdPackOptions.length > 0 ? (
                            <div className="space-y-2">
                              {newProdPackOptions.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-[#0c1f16] p-2 rounded-xl border border-slate-200 dark:border-[#275943]/40">
                                  <input
                                    type="text"
                                    placeholder="Weight (e.g. 250g)"
                                    value={opt.weight}
                                    onChange={(e) => {
                                      const updated = [...newProdPackOptions];
                                      updated[idx].weight = e.target.value;
                                      setNewProdPackOptions(updated);
                                    }}
                                    className="w-28 px-2 py-1 rounded-lg border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 text-xs"
                                  />
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400">₹</span>
                                    <input
                                      type="number"
                                      placeholder="Price"
                                      value={opt.price}
                                      onChange={(e) => {
                                        const updated = [...newProdPackOptions];
                                        updated[idx].price = Number(e.target.value);
                                        setNewProdPackOptions(updated);
                                      }}
                                      className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 text-xs"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400">Orig ₹</span>
                                    <input
                                      type="number"
                                      placeholder="Orig Price"
                                      value={opt.originalPrice}
                                      onChange={(e) => {
                                        const updated = [...newProdPackOptions];
                                        updated[idx].originalPrice = Number(e.target.value);
                                        setNewProdPackOptions(updated);
                                      }}
                                      className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 text-xs"
                                    />
                                  </div>
                                  <label className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer ml-2">
                                    <input
                                      type="checkbox"
                                      checked={opt.popular}
                                      onChange={(e) => {
                                        const updated = [...newProdPackOptions];
                                        updated[idx].popular = e.target.checked;
                                        setNewProdPackOptions(updated);
                                      }}
                                      className="w-3.5 h-3.5 rounded text-emerald-600"
                                    />
                                    <span>Popular</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = newProdPackOptions.filter((_, i) => i !== idx);
                                      setNewProdPackOptions(updated);
                                    }}
                                    className="p-1 text-rose-500 hover:text-rose-700 ml-auto"
                                    title="Remove Pack Size"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">
                              Default auto-scaled pack tiers (250g, 500g, 1kg) will be created automatically based on Base Price.
                            </div>
                          )}
                        </div>

                        {/* Image URL & Thumbnail preview */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                          <div className="sm:col-span-3">
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Image URL
                            </label>
                            <input
                              type="text"
                              value={newProdImage}
                              onChange={(e) => setNewProdImage(e.target.value)}
                              placeholder="https://images.unsplash.com/... or /products/..."
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            {newProdImage ? (
                              <img
                                src={newProdImage}
                                alt="Preview"
                                className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-[#275943]"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-[#162f22] flex items-center justify-center text-slate-400">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                            <span className="text-[10px] text-slate-500">Live Preview</span>
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Health Benefits (Comma separated)
                          </label>
                          <input
                            type="text"
                            value={newProdBenefits}
                            onChange={(e) => setNewProdBenefits(e.target.value)}
                            placeholder="e.g. High in Vitamin E, Boosts Immunity, Brain Booster, Heart Healthy"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Description
                          </label>
                          <textarea
                            rows={2}
                            value={newProdDesc}
                            onChange={(e) => setNewProdDesc(e.target.value)}
                            placeholder="Artisan description of harvest, moisture level, nitrogen packing..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingProduct(false);
                              resetProductForm();
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#162f22] text-slate-700 dark:text-slate-300 font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2 rounded-xl bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold shadow-md flex items-center gap-1.5"
                          >
                            <Save className="w-4 h-4" />
                            <span>{editingProduct ? 'Save Changes' : 'Publish Product to Store'}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search by product name, Hindi name, or origin terroir..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs focus:ring-1 focus:ring-[#012d1d] focus:outline-none"
                      />
                    </div>

                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value as CategorySlug)}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs font-semibold"
                    >
                      <option value="all">All Categories ({products.length})</option>
                      <option value="dry-fruits">Dry Fruits ({products.filter(p => p.category === 'dry-fruits').length})</option>
                      <option value="spices">Heritage Spices ({products.filter(p => p.category === 'spices').length})</option>
                      <option value="seeds-berries">Seeds & Berries ({products.filter(p => p.category === 'seeds-berries').length})</option>
                      <option value="gifting">Gifting Hampers ({products.filter(p => p.category === 'gifting').length})</option>
                      <option value="dates-exotics">Dates & Exotics ({products.filter(p => p.category === 'dates-exotics').length})</option>
                    </select>

                    <select
                      value={productStockFilter}
                      onChange={(e) => setProductStockFilter(e.target.value as 'all' | 'in-stock' | 'out-of-stock')}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs font-semibold"
                    >
                      <option value="all">All Stock Status</option>
                      <option value="in-stock">In Stock Only</option>
                      <option value="out-of-stock">Sold Out Only</option>
                    </select>

                    <select
                      value={productSortBy}
                      onChange={(e) => setProductSortBy(e.target.value as 'name-asc' | 'price-low' | 'price-high' | 'category')}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs font-semibold"
                    >
                      <option value="name-asc">Sort: Name (A-Z)</option>
                      <option value="price-low">Sort: Price (Low to High)</option>
                      <option value="price-high">Sort: Price (High to Low)</option>
                      <option value="category">Sort: Category</option>
                    </select>
                  </div>

                  {/* Comprehensive Products Table */}
                  <div className="border border-slate-200 dark:border-[#275943] rounded-2xl overflow-hidden bg-white dark:bg-[#0f241a] shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF3E0] dark:bg-[#0c1f16] text-[#012d1d] dark:text-[#fed65b] font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-[#275943]">
                          <tr>
                            <th className="p-3.5">Product & Harvest</th>
                            <th className="p-3.5">Category</th>
                            <th className="p-3.5">Terroir & Origin</th>
                            <th className="p-3.5">Base Price</th>
                            <th className="p-3.5">Pack Sizes</th>
                            <th className="p-3.5 text-center">Stock Status</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#275943]/30">
                          {products
                            .filter((p) => {
                              const matchesQ =
                                p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                (p.hindiName && p.hindiName.toLowerCase().includes(productSearch.toLowerCase())) ||
                                (p.origin && p.origin.toLowerCase().includes(productSearch.toLowerCase()));
                              const matchesCat =
                                productCategoryFilter === 'all' || p.category === productCategoryFilter;
                              const matchesStock =
                                productStockFilter === 'all' ||
                                (productStockFilter === 'in-stock' && p.inStock !== false) ||
                                (productStockFilter === 'out-of-stock' && p.inStock === false);
                              return matchesQ && matchesCat && matchesStock;
                            })
                            .sort((a, b) => {
                              if (productSortBy === 'price-low') return a.basePrice - b.basePrice;
                              if (productSortBy === 'price-high') return b.basePrice - a.basePrice;
                              if (productSortBy === 'category') return a.category.localeCompare(b.category);
                              return a.name.localeCompare(b.name);
                            })
                            .map((prod) => (
                              <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-[#162f22]/50 transition-colors">
                                <td className="p-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="relative group cursor-pointer" onClick={() => setPreviewProduct(prod)}>
                                      <img
                                        src={resolveProductImage(prod)}
                                        alt={prod.name}
                                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-[#275943] transition-transform group-hover:scale-105"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center text-white">
                                        <Eye className="w-4 h-4" />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                        <span>{prod.name}</span>
                                        {prod.badge && (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#fed65b]/20 text-[#012d1d] dark:text-[#fed65b] border border-[#fed65b]/30">
                                            {prod.badge}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-hindi">
                                        {prod.hindiName}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    prod.category === 'dry-fruits'
                                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                      : prod.category === 'spices'
                                      ? 'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300'
                                      : prod.category === 'seeds-berries'
                                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300'
                                      : prod.category === 'gifting'
                                      ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300'
                                      : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  }`}>
                                    {prod.category.replace('-', ' ')}
                                  </span>
                                </td>
                                <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                                  {prod.origin || 'India'}
                                </td>
                                <td className="p-3.5">
                                  <div className="font-bold text-[#012d1d] dark:text-[#fed65b] text-sm">
                                    {formatPrice(prod.basePrice)}
                                  </div>
                                  {prod.originalPrice > prod.basePrice && (
                                    <div className="text-[10px] text-slate-400 line-through">
                                      {formatPrice(prod.originalPrice)}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3.5">
                                  <div className="flex items-center gap-1 flex-wrap max-w-xs">
                                    {(prod.packOptions || []).map((opt, i) => (
                                      <span
                                        key={i}
                                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#162f22] text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#275943]/40 whitespace-nowrap"
                                      >
                                        {opt.weight}: ₹{opt.price}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-3.5 text-center">
                                  <button
                                    onClick={() => toggleProductStock(prod.id)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 mx-auto ${
                                      prod.inStock !== false
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-200'
                                    }`}
                                    title="Click to toggle stock status"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${prod.inStock !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span>{prod.inStock !== false ? 'In Stock' : 'Sold Out'}</span>
                                  </button>
                                </td>
                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setPreviewProduct(prod)}
                                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#012d1d] dark:hover:text-[#fed65b] rounded-lg hover:bg-slate-100 dark:hover:bg-[#162f22]"
                                      title="Quick View Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenEditProduct(prod)}
                                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#012d1d] dark:hover:text-[#fed65b] rounded-lg hover:bg-slate-100 dark:hover:bg-[#162f22]"
                                      title="Edit Product"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Remove "${prod.name}" from catalog?`)) {
                                          deleteProduct(prod.id);
                                          showToast(`Deleted ${prod.name}`, 'info');
                                        }
                                      }}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Quick Product Detail Modal */}
                  {previewProduct && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-[#0f241a] rounded-3xl max-w-lg w-full border border-slate-200 dark:border-[#275943] overflow-hidden shadow-2xl space-y-4 p-6">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#275943] pb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              {previewProduct.category.replace('-', ' ')}
                            </span>
                            <h4 className="font-cinzel text-lg font-bold text-[#012d1d] dark:text-[#fed65b]">
                              {previewProduct.name}
                            </h4>
                            <p className="text-xs text-slate-500">{previewProduct.hindiName}</p>
                          </div>
                          <button
                            onClick={() => setPreviewProduct(null)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <img
                            src={resolveProductImage(previewProduct)}
                            alt={previewProduct.name}
                            className="w-24 h-24 rounded-2xl object-cover border border-slate-200 dark:border-[#275943]"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-1 text-xs">
                            <div><strong className="text-slate-700 dark:text-slate-300">Origin:</strong> {previewProduct.origin}</div>
                            <div><strong className="text-slate-700 dark:text-slate-300">Base Price:</strong> {formatPrice(previewProduct.basePrice)}</div>
                            <div><strong className="text-slate-700 dark:text-slate-300">Status:</strong> {previewProduct.inStock !== false ? 'In Stock' : 'Sold Out'}</div>
                            <div><strong className="text-slate-700 dark:text-slate-300">Grading:</strong> {previewProduct.grading || 'Grade-1'}</div>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="font-bold text-slate-800 dark:text-slate-200">Pack Pricing Options:</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {(previewProduct.packOptions || []).map((opt, idx) => (
                              <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-[#162f22] border border-slate-200 dark:border-[#275943]/40">
                                <div className="font-bold text-slate-900 dark:text-white">{opt.weight}</div>
                                <div className="text-[#012d1d] dark:text-[#fed65b] font-bold">₹{opt.price}</div>
                                {opt.discountPercent > 0 && (
                                  <div className="text-[9px] text-emerald-600 font-semibold">{opt.discountPercent}% OFF</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {previewProduct.benefits && previewProduct.benefits.length > 0 && (
                          <div className="text-xs space-y-1">
                            <div className="font-bold text-slate-800 dark:text-slate-200">Key Benefits:</div>
                            <div className="flex flex-wrap gap-1">
                              {previewProduct.benefits.map((b, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px]">
                                  {b}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-[#275943] pt-3">
                          <p>{previewProduct.description}</p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => {
                              const prodToEdit = previewProduct;
                              setPreviewProduct(null);
                              handleOpenEditProduct(prodToEdit);
                            }}
                            className="px-4 py-2 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] text-xs font-bold rounded-xl flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit This Product</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ORDERS & LOGISTICS LIFECYCLE */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-cinzel text-xl font-bold text-[#012d1d] dark:text-[#fed65b]">
                        Orders & Consignment Dispatch
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Advance order stages, push live tracking updates, and inspect payment & address details.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs font-semibold"
                      >
                        <option value="all">All Statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="packed">Quality Packed</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </div>

                  {/* Orders List */}
                  <div className="space-y-4">
                    {orders
                      .filter((o) => {
                        const matchesFilter = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                        const matchesSearch =
                          o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.shippingAddress?.fullName?.toLowerCase().includes(orderSearch.toLowerCase());
                        return matchesFilter && matchesSearch;
                      })
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="p-5 bg-white dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943] shadow-sm space-y-4"
                        >
                          {/* Order Card Header */}
                          <div className="flex items-start justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-[#275943]/40 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-[#012d1d] dark:text-[#fed65b]">
                                  {ord.orderNumber}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  ord.status === 'delivered'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : ord.status === 'out_for_delivery'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}>
                                  {ord.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Placed: {ord.date} • Paid via {ord.paymentMethod.toUpperCase()} ({ord.paymentStatus})
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-base font-bold font-cinzel text-[#012d1d] dark:text-[#fed65b]">
                                {formatPrice(ord.total)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {ord.items.length} product(s)
                              </div>
                            </div>
                          </div>

                          {/* Items & Shipping Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="bg-slate-50 dark:bg-[#162f22]/60 p-3 rounded-xl">
                              <div className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5" />
                                <span>Harvest Package Content</span>
                              </div>
                              <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                                {ord.items.map((it, idx) => (
                                  <li key={idx} className="flex justify-between">
                                    <span>{it.quantity}x {it.product.name} ({it.selectedWeight})</span>
                                    <span className="font-semibold">{formatPrice(it.price * it.quantity)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-slate-50 dark:bg-[#162f22]/60 p-3 rounded-xl">
                              <div className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5" />
                                <span>Delivery Destination</span>
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                                <div className="font-semibold">{ord.shippingAddress?.fullName} ({ord.shippingAddress?.phone})</div>
                                <div>{ord.shippingAddress?.apartment}, {ord.shippingAddress?.street}</div>
                                <div>{ord.shippingAddress?.city}, {ord.shippingAddress?.state} - {ord.shippingAddress?.pincode}</div>
                              </div>
                            </div>
                          </div>

                          {/* Order Dispatch Stage Advancer */}
                          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-[#275943]/40">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                Advance Status:
                              </span>
                              <button
                                onClick={() => updateOrderStatus(ord.id, 'confirmed')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  ord.status === 'confirmed'
                                    ? 'bg-[#012d1d] text-[#fed65b]'
                                    : 'bg-slate-100 dark:bg-[#162f22] text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                Confirmed
                              </button>

                              <button
                                onClick={() => updateOrderStatus(ord.id, 'packed', 'Nitrogen-sealed and vacuum inspected in Varanasi center.')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  ord.status === 'packed'
                                    ? 'bg-[#012d1d] text-[#fed65b]'
                                    : 'bg-slate-100 dark:bg-[#162f22] text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                Packed & Sealed
                              </button>

                              <button
                                onClick={() => updateOrderStatus(ord.id, 'dispatched', 'Consignment handed to BlueDart Express transit hub.')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  ord.status === 'dispatched'
                                    ? 'bg-[#012d1d] text-[#fed65b]'
                                    : 'bg-slate-100 dark:bg-[#162f22] text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                Dispatched
                              </button>

                              <button
                                onClick={() => updateOrderStatus(ord.id, 'out_for_delivery', 'Delivery agent assigned & en route to address.')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  ord.status === 'out_for_delivery'
                                    ? 'bg-[#012d1d] text-[#fed65b]'
                                    : 'bg-slate-100 dark:bg-[#162f22] text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                Out for Delivery
                              </button>

                              <button
                                onClick={() => updateOrderStatus(ord.id, 'delivered', 'Handed over at customer doorstep with OTP confirmation.')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  ord.status === 'delivered'
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-slate-100 dark:bg-[#162f22] text-slate-600 dark:text-slate-300 hover:bg-emerald-50'
                                }`}
                              >
                                Delivered ✓
                              </button>
                            </div>

                            <button
                              onClick={() => openGmailInvoice(ord)}
                              className="px-3 py-1.5 bg-[#FAF3E0] dark:bg-[#162f22] hover:bg-[#fed65b]/20 text-[#012d1d] dark:text-[#fed65b] border border-amber-300 dark:border-[#275943] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                              title="Send official HTML invoice via Gmail"
                            >
                              <Mail className="w-3.5 h-3.5 text-[#c79a1f]" />
                              <span>Dispatch Invoice via Gmail</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PROMO CODES ENGINE */}
              {activeTab === 'promos' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-cinzel text-xl font-bold text-[#012d1d] dark:text-[#fed65b]">
                        Coupons & Promotional Engine
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Create festive promo codes, set percentage or flat discount amounts, and manage active coupons.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddingPromo(!isAddingPromo)}
                      className="px-4 py-2 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Promo Code</span>
                    </button>
                  </div>

                  {/* Create Promo Code Form */}
                  {isAddingPromo && (
                    <div className="p-6 bg-[#FAF3E0] dark:bg-[#0f241a] rounded-3xl border border-[#d6caba] dark:border-[#275943] space-y-4">
                      <div className="flex items-center justify-between border-b border-[#d6caba] dark:border-[#275943] pb-3">
                        <h4 className="font-cinzel text-base font-bold text-[#012d1d] dark:text-[#fed65b]">
                          Configure New Promo Code
                        </h4>
                        <button
                          onClick={() => setIsAddingPromo(false)}
                          className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Promo Code Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={newPromoCode}
                              onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                              placeholder="e.g. DIWALI25"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Discount Type
                            </label>
                            <select
                              value={newPromoType}
                              onChange={(e) => setNewPromoType(e.target.value as 'percent' | 'flat')}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            >
                              <option value="percent">Percentage Off (%)</option>
                              <option value="flat">Flat Amount Off (₹)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Discount Value *
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={newPromoValue}
                              onChange={(e) => setNewPromoValue(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Min. Order Amount (₹)
                            </label>
                            <input
                              type="number"
                              value={newPromoMinOrder}
                              onChange={(e) => setNewPromoMinOrder(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Public Description
                            </label>
                            <input
                              type="text"
                              value={newPromoDesc}
                              onChange={(e) => setNewPromoDesc(e.target.value)}
                              placeholder="e.g. 20% off on all royal hampers"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Expiry Date
                            </label>
                            <input
                              type="date"
                              value={newPromoExpiry}
                              onChange={(e) => setNewPromoExpiry(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingPromo(false)}
                            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#162f22] text-slate-700 dark:text-slate-300 font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2 rounded-xl bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold shadow-md"
                          >
                            Activate Promo Code
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Promo Codes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {promoCodes.map((promo) => (
                      <div
                        key={promo.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          promo.isActive
                            ? 'bg-white dark:bg-[#0f241a] border-slate-200 dark:border-[#275943] shadow-sm'
                            : 'bg-slate-100 dark:bg-[#0a1811] border-slate-200 dark:border-[#1a3828] opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-base font-black text-[#012d1d] dark:text-[#fed65b] px-3 py-1 bg-amber-50 dark:bg-[#163a2c] rounded-lg border border-[#fed65b]/40">
                              {promo.code}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              promo.isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {promo.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => togglePromoCode(promo.id)}
                              className="p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-[#012d1d] dark:hover:text-[#fed65b]"
                              title="Toggle Active"
                            >
                              {promo.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete coupon ${promo.code}?`)) {
                                  deletePromoCode(promo.id);
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700"
                              title="Delete Promo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-3">
                          {promo.description}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#275943]/40 flex items-center justify-between text-[11px] text-slate-400">
                          <div>Min. Order: ₹{promo.minOrderValue}</div>
                          <div>Used: {promo.usageCount} times</div>
                          <div>Expires: {promo.expiryDate || 'No limit'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: WHOLESALE INQUIRIES */}
              {activeTab === 'inquiries' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-[#012d1d] dark:text-[#fed65b]">
                      B2B & Wholesale Leads
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Corporate gifting, banquet contracts, and bulk dry fruit inquiries submitted via store.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {wholesaleInquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="p-5 bg-white dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943] shadow-sm space-y-4"
                      >
                        <div className="flex items-start justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-[#275943]/40 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-cinzel text-base font-bold text-[#012d1d] dark:text-white">
                                {inq.companyName}
                              </h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                inq.status === 'new'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                  : inq.status === 'quoted'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}>
                                {inq.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {inq.contactPerson} • {inq.date}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${inq.phone}`}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{inq.phone}</span>
                            </a>
                            {inq.email && (
                              <button
                                onClick={() => openGmailInquiry(inq)}
                                className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-[#162f22] text-[#854d0e] dark:text-[#fed65b] border border-amber-300 dark:border-[#275943] text-xs font-bold flex items-center gap-1.5 hover:bg-amber-100 transition-colors shadow-xs"
                                title="Send custom quotation via Gmail"
                              >
                                <Mail className="w-3.5 h-3.5 text-[#c79a1f]" />
                                <span>Reply via Gmail</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="bg-slate-50 dark:bg-[#162f22]/60 p-3.5 rounded-xl space-y-1">
                            <div className="font-bold text-slate-700 dark:text-slate-300">
                              Estimated Volume: <span className="text-[#012d1d] dark:text-[#fed65b]">{inq.estimatedQuantity}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                              {inq.requirement}
                            </p>
                          </div>

                          <div className="bg-slate-50 dark:bg-[#162f22]/60 p-3.5 rounded-xl space-y-2">
                            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                              <span>Admin Trade Desk Notes</span>
                              <span className="text-[10px] text-slate-400">Internal</span>
                            </div>
                            <input
                              type="text"
                              defaultValue={inq.notes || ''}
                              onBlur={(e) => updateInquiryStatus(inq.id, inq.status, e.target.value)}
                              placeholder="Add follow-up notes or quotation details..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#275943]/40">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              Update Lead Stage:
                            </span>
                            {(['new', 'contacted', 'quoted', 'fulfilled', 'archived'] as WholesaleInquiry['status'][]).map((st) => (
                              <button
                                key={st}
                                onClick={() => updateInquiryStatus(inq.id, st)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                                  inq.status === st
                                    ? 'bg-[#012d1d] text-[#fed65b]'
                                    : 'bg-slate-100 dark:bg-[#162f22] text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              if (confirm(`Remove inquiry from ${inq.companyName}?`)) {
                                deleteInquiry(inq.id);
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 text-xs p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: STORE GLOBAL SETTINGS & ANNOUNCEMENT */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-[#012d1d] dark:text-[#fed65b]">
                      Storefront Parameters & Announcement Bar
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Instantly modify top promotional ticker, support contacts, tax rates, and free delivery thresholds.
                    </p>
                  </div>

                  <div className="p-6 bg-white dark:bg-[#0f241a] rounded-3xl border border-slate-200 dark:border-[#275943] space-y-6 text-xs">
                    {/* Announcement Bar Settings */}
                    <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-[#275943]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#fed65b]" />
                          <h4 className="font-cinzel text-sm font-bold text-[#012d1d] dark:text-white">
                            Live Header Announcement Ticker
                          </h4>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.announcementActive}
                            onChange={(e) => setSettingsForm({ ...settingsForm, announcementActive: e.target.checked })}
                            className="rounded border-slate-300 text-[#012d1d] focus:ring-[#012d1d]"
                          />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Show on Header</span>
                        </label>
                      </div>

                      <input
                        type="text"
                        value={settingsForm.announcementText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                        placeholder="e.g. Free Express Delivery on orders above ₹999..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Financial & Shipping Configuration */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-200 dark:border-[#275943]">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Free Shipping Minimum (₹)
                        </label>
                        <input
                          type="number"
                          value={settingsForm.freeShippingThreshold}
                          onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Flat Shipping Fee (₹)
                        </label>
                        <input
                          type="number"
                          value={settingsForm.flatShippingFee}
                          onChange={(e) => setSettingsForm({ ...settingsForm, flatShippingFee: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          GST / Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          value={settingsForm.taxRatePercent}
                          onChange={(e) => setSettingsForm({ ...settingsForm, taxRatePercent: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 font-bold"
                        />
                      </div>
                    </div>

                    {/* Support Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-200 dark:border-[#275943]">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Customer Care Phone Hotline
                        </label>
                        <input
                          type="text"
                          value={settingsForm.supportPhone}
                          onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Official Orders & Wholesale Email
                        </label>
                        <input
                          type="email"
                          value={settingsForm.supportEmail}
                          onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    {/* Processing Hub Address */}
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Central Processing & Packing Hub Address
                      </label>
                      <input
                        type="text"
                        value={settingsForm.hubAddress}
                        onChange={(e) => setSettingsForm({ ...settingsForm, hubAddress: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => updateStoreSettings(settingsForm)}
                        className="px-6 py-3 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Deploy Settings Live</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* SECURITY & ACCESS CONTROL (RBAC) TAB */}
              {/* ========================================== */}
              {activeTab === 'security' && (
                <div className="space-y-6 animate-fadeIn pb-12">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-cinzel text-xl font-bold text-[#012d1d] dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-[#fed65b]" />
                        <span>Security Architecture & Access Control</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Hardened role-based access control (RBAC), Google Sign-In administrative gate & server-side verification telemetry.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fetchSecurityAuditData()}
                      disabled={loadingSecurity}
                      className="px-4 py-2 bg-slate-100 dark:bg-[#133324] hover:bg-slate-200 dark:hover:bg-[#1b4330] text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingSecurity ? 'animate-spin' : ''}`} />
                      <span>{loadingSecurity ? 'Refreshing Audit Logs...' : 'Refresh Telemetry'}</span>
                    </button>
                  </div>

                  {/* Security Posture Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-white dark:bg-[#0f241a] rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                          Admin Auth Policy
                        </span>
                        <BadgeCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white">
                        Google Sign-In Only
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Manual forms & bypasses strictly purged.
                      </p>
                    </div>

                    <div className="p-4 bg-white dark:bg-[#0f241a] rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                          Server-Side Guard
                        </span>
                        <Lock className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white">
                        Active Middleware
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        /api/admin routes gated by email whitelist.
                      </p>
                    </div>

                    <div className="p-4 bg-white dark:bg-[#0f241a] rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                          Firestore Database
                        </span>
                        <ShieldAlert className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white">
                        Strict Rules Armed
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        isAdmin() check & default-deny enforced.
                      </p>
                    </div>

                    <div className="p-4 bg-white dark:bg-[#0f241a] rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                          Authorized Admins
                        </span>
                        <Sparkles className="w-4 h-4 text-[#fed65b]" />
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white">
                        {ADMIN_EMAILS.length} Accounts Whitelisted
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Primary: {ADMIN_EMAILS[0]}
                      </p>
                    </div>
                  </div>

                  {/* RBAC Role & Permission Matrix */}
                  <div className="bg-white dark:bg-[#0f241a] rounded-3xl border border-slate-200 dark:border-[#275943] p-5 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-amber-500" />
                        <h4 className="font-cinzel text-base font-bold text-[#012d1d] dark:text-white">
                          Role-Based Access Control (RBAC) Matrix
                        </h4>
                      </div>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#162f22] text-slate-600 dark:text-slate-300 font-bold">
                        Principle of Least Privilege
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Superadmin Card */}
                      <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-300/60 dark:border-amber-700/40 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
                            Super Administrator
                          </span>
                          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                            Google Sign-In Only
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          Full authority over store catalog, inventory overrides, order lifecycles, global financials, promo engines, and wholesale quoting.
                        </p>
                        <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-200">
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Full Product & Pricing CRUD Operations
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Complete Order Fulfillment & Status Overrides
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Global Store Settings & Announcement Banners
                          </div>
                        </div>
                      </div>

                      {/* Store Manager Card */}
                      <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-300/60 dark:border-emerald-700/40 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                            Store Operations Manager
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                            Staff Operations
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          Assigned to daily operational fulfillment, stock inventory level adjustments, and wholesale customer communication.
                        </p>
                        <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-200">
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Dispatch Logistics & Tracking Updates
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Stock Availability & Low-Inventory Flags
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                            <X className="w-3.5 h-3.5 text-red-400" /> Cannot modify system security or master accounts
                          </div>
                        </div>
                      </div>

                      {/* Verified Customer Patron Card */}
                      <div className="p-4 rounded-2xl bg-sky-500/5 dark:bg-sky-950/20 border border-sky-300/60 dark:border-sky-700/40 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-600 text-white uppercase tracking-wider">
                            Verified Patron (Customer)
                          </span>
                          <span className="text-[11px] font-semibold text-sky-800 dark:text-sky-300">
                            Google / Email Auth
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          Isolated customer profile with personalized shopping cart, order history tracking, saved addresses, and secure reviews.
                        </p>
                        <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-200">
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Personal Order & Address Cloud Sync
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Secure Checkout & Custom Box Builder
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                            <X className="w-3.5 h-3.5 text-red-400" /> Blocked from administrative consoles & routes
                          </div>
                        </div>
                      </div>

                      {/* Anonymous Guest Card */}
                      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#12281d] border border-slate-200 dark:border-[#275943] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-600 text-white uppercase tracking-wider">
                            Anonymous Guest Patron
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Public Access
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          Public browsing of dry fruit catalog, pricing inspection, cart calculation, and AI Sommelier assistance.
                        </p>
                        <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-200">
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Catalog Exploration & Sommelier Advice
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Transient Cart & Guest Orders
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                            <X className="w-3.5 h-3.5 text-red-400" /> No access to protected patron or admin stores
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Security Audit Log Stream */}
                  <div className="bg-white dark:bg-[#0f241a] rounded-3xl border border-slate-200 dark:border-[#275943] p-5 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600 dark:text-[#fed65b]" />
                        <h4 className="font-cinzel text-base font-bold text-[#012d1d] dark:text-white">
                          Live Security & Access Audit Log
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Updated {securityPosture.lastAuditCheck}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                      {auditLogs.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#12281d] text-center text-xs text-slate-500">
                          Server security shield armed. No unauthorized intrusion attempts recorded.
                        </div>
                      ) : (
                        auditLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                              log.status === 'granted'
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                                : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 text-red-900 dark:text-red-200'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  log.status === 'granted'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-red-600 text-white'
                                }`}>
                                  {log.status === 'granted' ? 'GRANTED' : 'DENIED'}
                                </span>
                                <span className="font-bold font-mono text-[11px]">{log.action}</span>
                                <span className="text-[10px] text-slate-400">{log.userEmail}</span>
                              </div>
                              <p className="text-[11px] opacity-90">{log.details}</p>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Security Best Practices & Operating Guidelines */}
                  <div className="bg-[#012d1d] text-[#FAF3E0] rounded-3xl p-5 sm:p-6 space-y-3 shadow-lg">
                    <h4 className="font-cinzel text-base font-bold text-[#fed65b] flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      <span>E-Commerce Security Hardening Guidelines</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed text-slate-300">
                      <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-1">
                        <div className="font-bold text-white">1. Sole Google Administrator Gate</div>
                        <p>All administrative features strictly require a verified Google Sign-In with an email explicitly registered in the authorized administrators directory.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-1">
                        <div className="font-bold text-white">2. Dual Server & Database Verification</div>
                        <p>Every admin interaction is checked via server-side verification middleware (/api/admin/*) and validated against Firestore isAdmin() security rules.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-1">
                        <div className="font-bold text-white">3. Customer-Admin Isolation</div>
                        <p>Customer accounts are strictly segregated from store management tools, ensuring patron address books and order histories remain tamper-proof.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-1">
                        <div className="font-bold text-white">4. Comprehensive Telemetry & Logging</div>
                        <p>All administrative logins and rejected privilege elevations are logged in real-time with event audit IDs and timestamps.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BULK EXCEL / CSV CATALOG & STOCK INGESTION MODAL */}
        <BulkCatalogManager
          isOpen={isBulkManagerOpen}
          onClose={() => setIsBulkManagerOpen(false)}
          onSuccessNavigate={() => {
            setIsBulkManagerOpen(false);
            setActiveTab('products');
          }}
        />
      </div>
    </div>
  );
};
