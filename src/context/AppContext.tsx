import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  CartItem, 
  CurrencyCode, 
  LanguageCode, 
  Address, 
  Order, 
  AppNotification, 
  UserProfile, 
  CategorySlug,
  PromoCodeItem,
  StoreSettings,
  WholesaleInquiry,
  TrackingStep
} from '../types';
import { PRODUCTS } from '../data/products';
import { CURRENCIES, formatCurrencyPrice } from '../data/currencies';
import { TRANSLATIONS } from '../data/translations';
import { 
  syncUserProfile, 
  updateUserInFirestore, 
  saveOrderToFirestore, 
  updateOrderStatusInFirestore, 
  subscribeToUserOrders, 
  saveWishlistToFirestore, 
  getWishlistFromFirestore, 
  checkIsAdmin,
  subscribeToProducts,
  saveProductToFirestore,
  bulkSyncProductsToFirestore,
  saveMasterCatalogToFirestore,
  deleteProductFromFirestore,
  subscribeToStoreSettings,
  saveStoreSettingsToFirestore,
  subscribeToPromoCodes,
  savePromoCodesToFirestore,
  subscribeToWholesaleInquiries,
  saveWholesaleInquiryToFirestore,
  updateWholesaleInquiryInFirestore,
  deleteWholesaleInquiryFromFirestore,
  ADMIN_EMAILS
} from '../lib/firebase';
import { LocalAuthManager } from '../services/LocalAuthManager';
import { 
  supabase, 
  queryOrderTable, 
  queryCustomerTable,
  apiCreateOrder,
  apiFetchOrders,
  apiUpdateOrderStatus,
  apiCustomerAuth
} from '../lib/supabase';

export function generateTrackingSteps(status: string): TrackingStep[] {
  const norm = (status || '').toLowerCase();
  const isConfirmed = true;
  const isPacked = norm.includes('pack') || norm.includes('dispatch') || norm.includes('out') || norm.includes('deliver');
  const isDispatched = norm.includes('dispatch') || norm.includes('out') || norm.includes('deliver');
  const isOut = norm.includes('out') || norm.includes('deliver');
  const isDelivered = norm.includes('deliver');

  return [
    {
      title: 'Order Confirmed & Placed',
      description: 'Order registered in Supabase database & secured in Varanasi hub.',
      date: 'Completed',
      completed: isConfirmed,
      current: norm === 'confirmed' || norm === 'order confirmed',
    },
    {
      title: 'Quality Check & Nitrogen Sealing',
      description: 'Nitrogen-sealed and vacuum inspected in Varanasi center.',
      date: isPacked ? 'Completed' : 'Pending',
      completed: isPacked,
      current: norm === 'packed' || norm === 'packed & sealed',
    },
    {
      title: 'Express Dispatch',
      description: 'Consignment handed to BlueDart Express transit hub.',
      date: isDispatched ? 'Completed' : 'Pending',
      completed: isDispatched,
      current: norm === 'dispatched',
    },
    {
      title: 'Out for Delivery',
      description: 'Delivery agent assigned & en route to destination.',
      date: isOut ? 'Completed' : 'Pending',
      completed: isOut,
      current: norm === 'out_for_delivery' || norm === 'out for delivery',
    },
    {
      title: 'Delivered Safely',
      description: 'Handed over at customer doorstep with OTP confirmation.',
      date: isDelivered ? 'Completed' : 'Pending',
      completed: isDelivered,
      current: norm === 'delivered',
    },
  ];
}

export function mapSupabaseOrderToOrder(row: any): Order {
  let parsedAddress: Address = {
    id: 'addr-' + (row.order_id || row.id || Date.now()),
    type: 'Home',
    fullName: row.customer_name || 'Valued Patron',
    phone: String(row.customer_phone || ''),
    street: '',
    apartment: '',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    pincode: '221001',
    isDefault: true,
  };

  if (row.shipping_address) {
    if (typeof row.shipping_address === 'string') {
      try {
        parsedAddress = { ...parsedAddress, ...JSON.parse(row.shipping_address) };
      } catch (e) {
        parsedAddress.street = row.shipping_address;
      }
    } else if (typeof row.shipping_address === 'object') {
      parsedAddress = { ...parsedAddress, ...row.shipping_address };
    }
  }

  let parsedItems: CartItem[] = [];
  if (row.items) {
    let rawList: any[] = [];
    if (typeof row.items === 'string') {
      try {
        rawList = JSON.parse(row.items);
      } catch (e) {
        console.warn('Failed to parse items JSON:', e);
      }
    } else if (Array.isArray(row.items)) {
      rawList = row.items;
    }

    parsedItems = rawList.map((it: any) => {
      let matchedProduct: Product | undefined = undefined;
      if (it.product && typeof it.product === 'object' && it.product.id) {
        matchedProduct = it.product;
      } else {
        const prodId = it.productId || it.id || '';
        matchedProduct = PRODUCTS.find((p) => p.id === prodId);
      }

      if (!matchedProduct) {
        matchedProduct = {
          id: it.id || 'custom-item',
          name: it.name || it.title || 'Premium Harvest Item',
          hindiName: '',
          category: 'dry-fruits',
          origin: 'Varanasi',
          description: '',
          longDescription: '',
          image: it.image || 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80',
          gallery: [],
          basePrice: Number(it.price || 0),
          originalPrice: Number(it.price || 0),
          rating: 5,
          reviewsCount: 1,
          inStock: true,
          isOrganic: true,
          packOptions: [],
          nutrition: { calories: '', protein: '', healthyFats: '', carbs: '', dietaryFiber: '', keyVitamins: '' },
          harvestSeason: '',
          grading: '',
          benefits: []
        };
      }

      return {
        id: it.id || `${matchedProduct.id}-${it.selectedWeight || 'pack'}`,
        product: matchedProduct,
        selectedWeight: it.selectedWeight || 'Standard',
        quantity: Number(it.quantity || 1),
        price: Number(it.price || matchedProduct.basePrice || 0),
        originalPrice: Number(it.originalPrice || matchedProduct.originalPrice || matchedProduct.basePrice || 0)
      };
    });
  }

  const rawStatus = row.status || 'confirmed';
  let normStatus: Order['status'] = 'confirmed';
  const sLower = rawStatus.toLowerCase();
  if (sLower.includes('pack')) normStatus = 'packed';
  else if (sLower.includes('dispatch')) normStatus = 'dispatched';
  else if (sLower.includes('out')) normStatus = 'out_for_delivery';
  else if (sLower.includes('deliver')) normStatus = 'delivered';
  else normStatus = 'confirmed';

  const orderId = row.order_id || (row.id ? `ORD-${row.id}` : `ORD-${Date.now()}`);
  const totalAmount = Number(row.total_amount ?? row.total ?? (Number(row.subtotal || 0) + Number(row.shipping_fee || 0)));

  const rawDate = row.created_at || row.createdAt || row.date || row.timestamp || row.order_date || row.created_date;
  let formattedDate = new Date().toLocaleDateString('en-IN');
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  return {
    id: orderId,
    orderNumber: orderId,
    date: formattedDate,
    items: parsedItems,
    subtotal: Number(row.subtotal || 0),
    discount: 0,
    shippingFee: Number(row.shipping_fee || 0),
    tax: 0,
    total: totalAmount,
    currency: 'INR',
    status: normStatus,
    shippingAddress: parsedAddress,
    customerName: row.customer_name || parsedAddress.fullName || 'Patron',
    customerPhone: String(row.customer_phone || parsedAddress.phone || ''),
    paymentMethod: (row.payment_method || 'cod') as any,
    paymentStatus: (row.payment_method || '').toLowerCase() === 'cod' ? 'cod_pending' : 'paid',
    trackingSteps: generateTrackingSteps(rawStatus),
    eta: normStatus === 'delivered' ? 'Delivered' : 'Estimated in 2-3 business days',
  };
}

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Currency & i18n
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (amountInINR: number) => string;
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string) => string;

  // Products & Filtering
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductStock: (id: string) => void;
  bulkUpdateProducts: (
    productsToUpsert: Product[],
    onProgress?: (processed: number, total: number, currentItemName: string) => void
  ) => Promise<{ success: boolean; count: number; error?: string }>;
  resetProductsToDefault: () => void;
  selectedCategory: CategorySlug;
  setSelectedCategory: (cat: CategorySlug) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (prod: Product | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, selectedWeight?: string, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  cartShipping: number;
  cartTax: number;
  cartTotal: number;
  appliedPromo: string;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;

  // Promo Codes Admin
  promoCodes: PromoCodeItem[];
  addPromoCode: (promo: PromoCodeItem) => void;
  updatePromoCode: (id: string, updates: Partial<PromoCodeItem>) => void;
  deletePromoCode: (id: string) => void;
  togglePromoCode: (id: string) => void;

  // Store Settings Admin
  storeSettings: StoreSettings;
  updateStoreSettings: (updates: Partial<StoreSettings>) => void;

  // Wholesale Inquiries
  wholesaleInquiries: WholesaleInquiry[];
  addWholesaleInquiry: (inquiry: Omit<WholesaleInquiry, 'id' | 'date' | 'status'>) => void;
  updateInquiryStatus: (id: string, status: WholesaleInquiry['status'], notes?: string) => void;
  deleteInquiry: (id: string) => void;

  // Wishlist
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;

  // Gemini AI Chatbot
  isChatbotOpen: boolean;
  setIsChatbotOpen: (open: boolean) => void;

  // Modals & Navigation
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isWholesaleOpen: boolean;
  setIsWholesaleOpen: (open: boolean) => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  isStoryOpen: boolean;
  setIsStoryOpen: (open: boolean) => void;
  trackingOrder: Order | null;
  setTrackingOrder: (order: Order | null) => void;

  // Admin Control Center
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (auth: boolean) => void;
  isAdminUser: boolean;

  // Gmail Workspace Integration
  isGmailHubOpen: boolean;
  setIsGmailHubOpen: (open: boolean) => void;
  gmailHubInitialOrder: Order | null;
  setGmailHubInitialOrder: (order: Order | null) => void;
  gmailHubInitialInquiry: WholesaleInquiry | null;
  setGmailHubInitialInquiry: (inquiry: WholesaleInquiry | null) => void;
  openGmailInvoice: (order: Order) => void;
  openGmailInquiry: (inquiry: WholesaleInquiry) => void;

  // Auth & Database
  authLoading: boolean;
  signOutUser: () => Promise<void>;
  loginCustomerWithPhone: (name: string, phone: string, email?: string) => Promise<{ success: boolean; error?: string }>;

  // User & Orders
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  updateUserAddresses: (addresses: Address[]) => Promise<void>;
  orders: Order[];
  fetchOrdersFromSupabase: (phoneFilter?: string) => Promise<void>;
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'status' | 'trackingSteps' | 'eta'>) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status'], customNote?: string) => Promise<void>;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  addNotification: (title: string, message: string, type?: AppNotification['type']) => void;

  // Toast
  toast: ToastItem | null;
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastItem['type']) => void;
  hideToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Removed INITIAL_USER definition as it contained hardcoded mock data.

const INITIAL_PROMOS: PromoCodeItem[] = [
  {
    id: 'promo-1',
    code: 'BAAGFRESH10',
    discountPercent: 10,
    minOrderValue: 499,
    description: '10% Off across all dry fruits, spices and gifting boxes',
    isActive: true,
    usageCount: 142,
    expiryDate: '2026-12-31',
  },
  {
    id: 'promo-2',
    code: 'ROYALVARANASI',
    discountPercent: 15,
    minOrderValue: 999,
    maxDiscount: 500,
    description: '15% Off on Royal Festive Hampers & Heritage Spices',
    isActive: true,
    usageCount: 89,
    expiryDate: '2026-11-30',
  },
  {
    id: 'promo-3',
    code: 'FESTIVE20',
    discountPercent: 20,
    minOrderValue: 1499,
    maxDiscount: 1000,
    description: '20% Off on Bulk & Festive Celebration Hampers',
    isActive: true,
    usageCount: 215,
    expiryDate: '2026-10-31',
  },
  {
    id: 'promo-4',
    code: 'WELCOME50',
    flatDiscount: 50,
    minOrderValue: 399,
    description: 'Flat ₹50 Instant Off on all orders above ₹399',
    isActive: true,
    usageCount: 67,
    expiryDate: '2026-12-31',
  }
];

const INITIAL_STORE_SETTINGS: StoreSettings = {
  storeName: 'BAAGFRESH',
  tagline: 'Royal Dry Fruits & Heritage Spices of Varanasi',
  announcementText: '✨ Free Express Delivery on orders above ₹999 | 100% Nitrogen-Sealed Freshness Guarantee',
  announcementActive: true,
  freeShippingThreshold: 999,
  flatShippingFee: 99,
  taxRatePercent: 5,
  supportPhone: '+91 87076 71319',
  supportEmail: 'contact@baagfresh.in',
  hubAddress: 'Varanasi Orchard Processing Hub, Pisach Mochan, UP 221001',
  isStoreLive: true,
  allowCOD: true,
  maintenanceNotice: 'We are currently upgrading our harvest dispatch vault. Store will reopen shortly.',
};

const INITIAL_INQUIRIES: WholesaleInquiry[] = [
  {
    id: 'inq-1',
    companyName: 'Taj Ganges Hospitality',
    contactPerson: 'Aditya Mathur (F&B Director)',
    email: 'a.mathur@tajhotels.com',
    phone: '+91 98390 11223',
    requirement: '50kg Kashmiri Mamra Almonds & 500g Mongra Saffron for upcoming royal wedding banquets.',
    estimatedQuantity: '50kg + 500g',
    date: '16 Aug 2026',
    status: 'quoted',
    notes: 'Quotation sent at ₹820/500g bulk tier with food-grade airtight canisters.'
  },
  {
    id: 'inq-2',
    companyName: 'Kashi Sweets & Confectioners',
    contactPerson: 'Sanjay Agarwal',
    email: 'sanjay@kashisweets.in',
    phone: '+91 94152 33445',
    requirement: '100kg Grade W-180 Jumbo Cashews and 25kg Tellicherry Black Pepper.',
    estimatedQuantity: '125kg monthly',
    date: '17 Aug 2026',
    status: 'new',
    notes: 'Requested sample batch delivered to Godowlia branch.'
  },
  {
    id: 'inq-3',
    companyName: 'Varanasi Heritage Gifting Co.',
    contactPerson: 'Pooja Srivastava',
    email: 'pooja@heritagegifts.co',
    phone: '+91 88401 55667',
    requirement: '200 custom engraved brass trunks for corporate Diwali gifting.',
    estimatedQuantity: '200 units',
    date: '14 Aug 2026',
    status: 'contacted',
    notes: 'Logo engraving sample mockup sent for client approval.'
  }
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-1',
    title: 'Fresh Kashmiri Harvest Arrived!',
    message: 'New batch of cold-cracked Mamra Almonds and Mongra Saffron freshly vacuum-packed in Varanasi.',
    date: '10 mins ago',
    type: 'harvest',
    read: false,
  },
  {
    id: 'n-2',
    title: 'Festive Promo Code Live: FESTIVE20',
    message: 'Get 20% off on handcrafted Varanasi Royal Brass Gift Hampers for upcoming celebrations.',
    date: '3 hours ago',
    type: 'promo',
    read: false,
  },
  {
    id: 'n-3',
    title: 'Encrypted Cloud Sync Active',
    message: 'Your addresses and order history are end-to-end encrypted with AES-256 Cloud Vault.',
    date: '1 day ago',
    type: 'security',
    read: true,
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('baagfresh_theme') === 'dark';
  });

  // Currency & Language
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Dynamic Products State with Local Storage persistence for custom edits/additions
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('baagfresh_custom_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge in any newly introduced products from PRODUCTS that aren't in parsed or update default product definitions
          const defaultMap = new Map(PRODUCTS.map((p) => [p.id, p]));
          const merged = parsed.map((p: Product) => {
            if (p.id === 'bf-handpicked-whole-cloves') {
              return defaultMap.get('bf-handpicked-whole-cloves') || p;
            }
            return p;
          });
          const existingIds = new Set(merged.map((p: Product) => p.id));
          const missingDefaults = PRODUCTS.filter((p) => !existingIds.has(p.id));
          return [...merged, ...missingDefaults];
        }
      }
    } catch (e) {
      console.warn('Failed to load cached custom products:', e);
    }
    return PRODUCTS;
  });

  // Save products to local storage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem('baagfresh_custom_products', JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to save custom products:', e);
    }
  }, [products]);

  // Cross-Tab Broadcast Channel Helper for immediate global synchronization
  const broadcastSync = (type: string, payload: any) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('baagfresh_global_sync');
        channel.postMessage({ type, payload, timestamp: Date.now() });
        channel.close();
      }
    } catch (e) {
      console.warn('Broadcast sync error:', e);
    }
  };

  // Product CRUD with immediate Firestore persistence, LocalStorage, and global broadcast
  const addProduct = (newProd: Product) => {
    setProducts((prev) => {
      const updated = [newProd, ...prev.filter((p) => p.id !== newProd.id)];
      saveProductToFirestore(newProd);
      saveMasterCatalogToFirestore(updated);
      try {
        localStorage.setItem('baagfresh_custom_products', JSON.stringify(updated));
        localStorage.setItem('baagfresh_catalog_version', String(Date.now()));
      } catch (e) {
        console.warn(e);
      }
      broadcastSync('PRODUCTS_SYNC', updated);
      return updated;
    });
    showToast(`Added "${newProd.name}" to royal catalog!`, 'success');
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      const target = updated.find((p) => p.id === id);
      if (target) {
        saveProductToFirestore(target);
      }
      saveMasterCatalogToFirestore(updated);
      try {
        localStorage.setItem('baagfresh_custom_products', JSON.stringify(updated));
        localStorage.setItem('baagfresh_catalog_version', String(Date.now()));
      } catch (e) {
        console.warn(e);
      }
      broadcastSync('PRODUCTS_SYNC', updated);
      return updated;
    });
    showToast(`Updated product details successfully`, 'success');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      deleteProductFromFirestore(id);
      saveMasterCatalogToFirestore(updated);
      try {
        localStorage.setItem('baagfresh_custom_products', JSON.stringify(updated));
        localStorage.setItem('baagfresh_catalog_version', String(Date.now()));
      } catch (e) {
        console.warn(e);
      }
      broadcastSync('PRODUCTS_SYNC', updated);
      return updated;
    });
    showToast(`Product removed from catalog`, 'info');
  };

  const toggleProductStock = (id: string) => {
    setProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, inStock: !p.inStock } : p
      );
      const target = updated.find((p) => p.id === id);
      if (target) {
        saveProductToFirestore(target);
      }
      saveMasterCatalogToFirestore(updated);
      try {
        localStorage.setItem('baagfresh_custom_products', JSON.stringify(updated));
        localStorage.setItem('baagfresh_catalog_version', String(Date.now()));
      } catch (e) {
        console.warn(e);
      }
      broadcastSync('PRODUCTS_SYNC', updated);
      return updated;
    });
    const target = products.find((p) => p.id === id);
    const newStatus = target ? !target.inStock : false;
    showToast(
      `Product marked as ${newStatus ? 'In Stock' : 'Out of Stock'}`,
      newStatus ? 'success' : 'warning'
    );
  };

  const bulkUpdateProducts = async (
    productsToUpsert: Product[],
    onProgress?: (processed: number, total: number, currentItemName: string) => void
  ): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
      let mergedList: Product[] = [];
      setProducts((prev) => {
        const existingMap = new Map(prev.map((p) => [p.id, p]));
        productsToUpsert.forEach((item) => {
          existingMap.set(item.id, item);
        });
        mergedList = Array.from(existingMap.values());
        try {
          localStorage.setItem('baagfresh_custom_products', JSON.stringify(mergedList));
          localStorage.setItem('baagfresh_catalog_version', String(Date.now()));
        } catch (e) {
          console.warn(e);
        }
        broadcastSync('PRODUCTS_SYNC', mergedList);
        return mergedList;
      });

      // Commit to Firestore using batch writes
      const syncResult = await bulkSyncProductsToFirestore(productsToUpsert, onProgress);

      if (syncResult.success) {
        showToast(`Bulk updated & synced ${productsToUpsert.length} products to Firestore!`, 'success');
        addNotification(
          'Catalog & Inventory Bulk Ingestion',
          `Bulk updated ${productsToUpsert.length} harvest items across stock, pricing, and catalog specifications with Cloud Firestore.`,
          'stock'
        );
      } else {
        showToast(`Local catalog updated; Firestore notice: ${syncResult.error || 'Check database connectivity'}`, 'warning');
      }

      return syncResult;
    } catch (err: any) {
      console.error('Bulk update products error:', err);
      showToast('Failed to complete bulk product update', 'error');
      return { success: false, count: 0, error: err?.message || 'Failed to update catalog in bulk' };
    }
  };

  const resetProductsToDefault = () => {
    setProducts(PRODUCTS);
    localStorage.removeItem('baagfresh_custom_products');
    localStorage.setItem('baagfresh_catalog_version', String(Date.now()));
    saveMasterCatalogToFirestore(PRODUCTS);
    PRODUCTS.forEach((p) => saveProductToFirestore(p));
    broadcastSync('PRODUCTS_SYNC', PRODUCTS);
    showToast('Reset catalog to master harvest default', 'info');
  };

  // Promo Codes State
  const [promoCodes, setPromoCodes] = useState<PromoCodeItem[]>(() => {
    try {
      const saved = localStorage.getItem('baagfresh_promos');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_PROMOS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('baagfresh_promos', JSON.stringify(promoCodes));
    } catch (e) {
      console.warn(e);
    }
  }, [promoCodes]);

  const addPromoCode = (promo: PromoCodeItem) => {
    setPromoCodes((prev) => {
      const updated = [promo, ...prev];
      savePromoCodesToFirestore(updated);
      broadcastSync('PROMOS_SYNC', updated);
      return updated;
    });
    showToast(`Created promo code ${promo.code}!`, 'success');
  };

  const updatePromoCode = (id: string, updates: Partial<PromoCodeItem>) => {
    setPromoCodes((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      savePromoCodesToFirestore(updated);
      broadcastSync('PROMOS_SYNC', updated);
      return updated;
    });
    showToast('Updated promo code settings', 'success');
  };

  const deletePromoCode = (id: string) => {
    setPromoCodes((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      savePromoCodesToFirestore(updated);
      broadcastSync('PROMOS_SYNC', updated);
      return updated;
    });
    showToast('Promo code removed', 'info');
  };

  const togglePromoCode = (id: string) => {
    setPromoCodes((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
      savePromoCodesToFirestore(updated);
      broadcastSync('PROMOS_SYNC', updated);
      return updated;
    });
    showToast('Promo code status toggled', 'info');
  };

  // Store Settings State
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('baagfresh_store_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_STORE_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('baagfresh_store_settings', JSON.stringify(storeSettings));
    } catch (e) {
      console.warn(e);
    }
  }, [storeSettings]);

  const updateStoreSettings = (updates: Partial<StoreSettings>) => {
    setStoreSettings((prev) => {
      const updated = { ...prev, ...updates };
      saveStoreSettingsToFirestore(updated);
      broadcastSync('SETTINGS_SYNC', updated);
      return updated;
    });
    showToast('Store settings updated & live across store!', 'success');
  };

  // Wholesale Inquiries State
  const [wholesaleInquiries, setWholesaleInquiries] = useState<WholesaleInquiry[]>(() => {
    try {
      const saved = localStorage.getItem('baagfresh_inquiries');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_INQUIRIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('baagfresh_inquiries', JSON.stringify(wholesaleInquiries));
    } catch (e) {
      console.warn(e);
    }
  }, [wholesaleInquiries]);

  const addWholesaleInquiry = (inquiryData: Omit<WholesaleInquiry, 'id' | 'date' | 'status'>) => {
    const newInq: WholesaleInquiry = {
      ...inquiryData,
      id: 'inq-' + Date.now(),
      date: 'Today',
      status: 'new',
    };
    setWholesaleInquiries((prev) => {
      const updated = [newInq, ...prev];
      saveWholesaleInquiryToFirestore(newInq);
      broadcastSync('INQUIRIES_SYNC', updated);
      return updated;
    });
    showToast('Wholesale inquiry submitted to Varanasi hub!', 'success');
  };

  const updateInquiryStatus = (id: string, status: WholesaleInquiry['status'], notes?: string) => {
    setWholesaleInquiries((prev) => {
      const updated = prev.map((i) =>
        i.id === id ? { ...i, status, ...(notes !== undefined ? { notes } : {}) } : i
      );
      updateWholesaleInquiryInFirestore(id, status, notes);
      broadcastSync('INQUIRIES_SYNC', updated);
      return updated;
    });
    showToast(`Inquiry status updated to "${status}"`, 'success');
  };

  const deleteInquiry = (id: string) => {
    setWholesaleInquiries((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      deleteWholesaleInquiryFromFirestore(id);
      broadcastSync('INQUIRIES_SYNC', updated);
      return updated;
    });
    showToast('Inquiry removed', 'info');
  };

  // Global Real-time Listeners (Firestore + BroadcastChannel)
  useEffect(() => {
    // 1. Live Product Catalog from Firestore
    const unsubProducts = subscribeToProducts((remoteProducts) => {
      if (remoteProducts && remoteProducts.length > 0) {
        setProducts(remoteProducts);
        try {
          localStorage.setItem('baagfresh_custom_products', JSON.stringify(remoteProducts));
          localStorage.setItem('baagfresh_catalog_version', String(Date.now()));
        } catch (e) {
          console.warn(e);
        }
      }
    });

    // 2. Live Store Configuration from Firestore
    const unsubSettings = subscribeToStoreSettings((remoteSettings) => {
      if (remoteSettings) {
        setStoreSettings((prev) => {
          const updated = { ...prev, ...remoteSettings };
          try {
            localStorage.setItem('baagfresh_store_settings', JSON.stringify(updated));
          } catch (e) {
            console.warn(e);
          }
          return updated;
        });
      }
    });

    // 3. Live Promo Codes from Firestore
    const unsubPromos = subscribeToPromoCodes((remotePromos) => {
      if (remotePromos && remotePromos.length > 0) {
        setPromoCodes(remotePromos);
        try {
          localStorage.setItem('baagfresh_promos', JSON.stringify(remotePromos));
        } catch (e) {
          console.warn(e);
        }
      }
    });

    // 4. Live Wholesale Inquiries from Firestore
    const unsubInquiries = subscribeToWholesaleInquiries((remoteInquiries) => {
      if (remoteInquiries && remoteInquiries.length > 0) {
        setWholesaleInquiries(remoteInquiries);
        try {
          localStorage.setItem('baagfresh_inquiries', JSON.stringify(remoteInquiries));
        } catch (e) {
          console.warn(e);
        }
      }
    });

    // 5. Cross-Tab / Cross-Window Real-time Broadcast Channel
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('baagfresh_global_sync');
        channel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === 'PRODUCTS_SYNC' && Array.isArray(payload)) {
            setProducts(payload);
          } else if (type === 'SETTINGS_SYNC' && payload) {
            setStoreSettings(payload);
          } else if (type === 'PROMOS_SYNC' && Array.isArray(payload)) {
            setPromoCodes(payload);
          } else if (type === 'INQUIRIES_SYNC' && Array.isArray(payload)) {
            setWholesaleInquiries(payload);
          }
        };
      }
    } catch (e) {
      console.warn('Broadcast channel sync setup:', e);
    }

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubSettings) unsubSettings();
      if (unsubPromos) unsubPromos();
      if (unsubInquiries) unsubInquiries();
      if (channel) channel.close();
    };
  }, []);

  // Admin Modal & Auth
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('baagfresh_admin_session') === 'active' ||
        sessionStorage.getItem('baagfresh_admin_session') === 'active'
      );
    } catch {
      return false;
    }
  });

  // Gmail Workspace State
  const [isGmailHubOpen, setIsGmailHubOpen] = useState<boolean>(false);
  const [gmailHubInitialOrder, setGmailHubInitialOrder] = useState<Order | null>(null);
  const [gmailHubInitialInquiry, setGmailHubInitialInquiry] = useState<WholesaleInquiry | null>(null);

  const openGmailInvoice = (order: Order) => {
    setGmailHubInitialOrder(order);
    setGmailHubInitialInquiry(null);
    setIsGmailHubOpen(true);
  };

  const openGmailInquiry = (inquiry: WholesaleInquiry) => {
    setGmailHubInitialInquiry(inquiry);
    setGmailHubInitialOrder(null);
    setIsGmailHubOpen(true);
  };

  const handleSetAdminAuth = (authStatus: boolean) => {
    setIsAdminAuthenticated(authStatus);
    try {
      if (authStatus) {
        localStorage.setItem('baagfresh_admin_session', 'active');
        sessionStorage.setItem('baagfresh_admin_session', 'active');
      } else {
        localStorage.removeItem('baagfresh_admin_session');
        sessionStorage.removeItem('baagfresh_admin_session');
      }
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  };

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('baagfresh_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('baagfresh_cart', JSON.stringify(cart));
  }, [cart]);
  const [appliedPromo, setAppliedPromo] = useState<string>('');
  const [promoDiscountRate, setPromoDiscountRate] = useState<number>(0);
  const [promoFlatDiscount, setPromoFlatDiscount] = useState<number>(0);

  // Wishlist
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Automatically propagate live product changes (pricing, pack options, stock, descriptions) to active Cart
  useEffect(() => {
    setCart((prevCart) => {
      let changed = false;
      const productMap = new Map(products.map((p) => [p.id, p]));

      const updatedCart = prevCart.map((item) => {
        const liveProduct = productMap.get(item.product.id);
        if (!liveProduct) return item;

        const livePack = liveProduct.packOptions.find((opt) => opt.weight === item.selectedWeight) || liveProduct.packOptions[0];
        const updatedPrice = livePack ? livePack.price : liveProduct.basePrice;
        const updatedOriginalPrice = livePack ? livePack.originalPrice : liveProduct.originalPrice;

        if (
          item.price !== updatedPrice ||
          item.originalPrice !== updatedOriginalPrice ||
          item.product.name !== liveProduct.name ||
          item.product.image !== liveProduct.image ||
          item.product.inStock !== liveProduct.inStock ||
          item.product !== liveProduct
        ) {
          changed = true;
          return {
            ...item,
            product: liveProduct,
            price: updatedPrice,
            originalPrice: updatedOriginalPrice,
          };
        }
        return item;
      });

      return changed ? updatedCart : prevCart;
    });
  }, [products]);

  // Automatically propagate live product changes to Wishlist
  useEffect(() => {
    setWishlist((prevWishlist) => {
      const productMap = new Map(products.map((p) => [p.id, p]));
      return prevWishlist.map((item) => productMap.get(item.id) || item);
    });
  }, [products]);

  // Automatically propagate live product changes to QuickView modal if active
  useEffect(() => {
    // Real-time Supabase Subscription
    const channel1 = supabase.channel('realtime:orders:1')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Order' }, payload => {
        console.log('Real-time INSERT on Order:', payload);
        fetchOrdersFromSupabase();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Order' }, payload => {
        console.log('Real-time UPDATE on Order:', payload);
        fetchOrdersFromSupabase();
      })
      .subscribe();
    
    const channel2 = supabase.channel('realtime:orders:2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        console.log('Real-time INSERT on orders:', payload);
        fetchOrdersFromSupabase();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
        console.log('Real-time UPDATE on orders:', payload);
        fetchOrdersFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, []);
  useEffect(() => {
    if (quickViewProduct) {
      const liveProduct = products.find((p) => p.id === quickViewProduct.id);
      if (liveProduct && (liveProduct.basePrice !== quickViewProduct.basePrice || liveProduct.inStock !== quickViewProduct.inStock || liveProduct.name !== quickViewProduct.name)) {
        setQuickViewProduct(liveProduct);
      }
    }
  }, [products, quickViewProduct]);

  // Modals
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isWholesaleOpen, setIsWholesaleOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isStoryOpen, setIsStoryOpen] = useState<boolean>(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // User & Auth State
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Admin User Check
  useEffect(() => {
    if (user && user.email) {
      const isMasterAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
      setIsAdminUser(isMasterAdmin);
    } else {
      setIsAdminUser(false);
    }
  }, [user]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Fetch orders from Supabase backend
  const fetchOrdersFromSupabase = async (phoneFilter?: string) => {
    try {
      const effectivePhone = phoneFilter || user?.phone;
      console.log('Fetching live orders from Supabase. isAdminUser:', isAdminUser, 'isAdminAuthenticated:', isAdminAuthenticated, 'Phone:', effectivePhone);
      
      let rawOrders: any[] = [];
      if (isAdminUser || isAdminAuthenticated) {
        rawOrders = await apiFetchOrders({ adminEmail: user?.email || 'admin@baagfresh.in' });
      } else if (effectivePhone) {
        rawOrders = await apiFetchOrders({ phone: effectivePhone });
      } else {
        rawOrders = [];
      }

      console.log('[Supabase Sync] Fetched orders count:', rawOrders?.length);

      if (rawOrders && Array.isArray(rawOrders)) {
        const sortedData = [...rawOrders].sort((a: any, b: any) => {
          const timeA = new Date(a.created_at || a.createdAt || a.date || a.timestamp || a.order_date || 0).getTime() || Number(a.id) || 0;
          const timeB = new Date(b.created_at || b.createdAt || b.date || b.timestamp || b.order_date || 0).getTime() || Number(b.id) || 0;
          return timeB - timeA;
        });
        const parsedOrders = sortedData.map(mapSupabaseOrderToOrder);
        setOrders(parsedOrders);
      }
    } catch (err) {
      console.error('Failed to fetch orders from Supabase:', err);
    }
  };

  // Initialize user from Local Storage and fetch orders from Supabase
  useEffect(() => {
    const savedUser = localStorage.getItem('baagfresh_active_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.phone) {
          fetchOrdersFromSupabase(parsed.phone);
        } else {
          fetchOrdersFromSupabase();
        }
      } catch (e) {
        console.error('Failed to parse active user:', e);
        setUser(null);
        fetchOrdersFromSupabase();
      }
    } else {
      setUser(null);
      fetchOrdersFromSupabase();
    }
    setAuthLoading(false);
  }, []);

  // Fetch orders when user changes or admin toggles
  useEffect(() => {
    fetchOrdersFromSupabase(user?.phone);
  }, [user?.phone, isAdminUser, isAdminAuthenticated]);

  // Customer Login with Phone & Name via Supabase
  const loginCustomerWithPhone = async (
    name: string,
    phone: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (!cleanPhone) {
      return { success: false, error: 'Please enter a valid phone number.' };
    }

    try {
      const { customer, orders: customerOrders } = await apiCustomerAuth({
        phone: cleanPhone,
        name: cleanName,
        email: cleanEmail,
      });

      let parsedAddress: Address[] = [];
      if (customer?.saved_address) {
        if (Array.isArray(customer.saved_address)) parsedAddress = customer.saved_address;
        else if (typeof customer.saved_address === 'object') parsedAddress = [customer.saved_address];
        else if (typeof customer.saved_address === 'string') {
          try {
            const p = JSON.parse(customer.saved_address);
            parsedAddress = Array.isArray(p) ? p : [p];
          } catch {}
        }
      }

      const customerProfile: UserProfile = {
        id: String(customer?.id || `cust-${Date.now()}`),
        name: cleanName || customer?.name || 'Patron',
        email: cleanEmail || customer?.email || '',
        phone: cleanPhone,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
        memberSince: customer?.created_at ? new Date(customer.created_at).getFullYear().toString() : '2026',
        addresses: parsedAddress,
        is2FAEnabled: false,
        e2eEncryptionKeyFingerprint: 'SUPABASE-E2E-VAULT',
        cloudSyncEnabled: true,
      };

      setUser(customerProfile);
      localStorage.setItem('baagfresh_active_user', JSON.stringify(customerProfile));

      if (customerOrders && Array.isArray(customerOrders)) {
        const sorted = [...customerOrders].sort((a: any, b: any) => {
          const timeA = new Date(a.created_at || a.createdAt || a.date || a.timestamp || a.order_date || 0).getTime() || Number(a.id) || 0;
          const timeB = new Date(b.created_at || b.createdAt || b.date || b.timestamp || b.order_date || 0).getTime() || Number(b.id) || 0;
          return timeB - timeA;
        });
        const userOrders = sorted.map(mapSupabaseOrderToOrder);
        setOrders(userOrders);
      }

      showToast(`Welcome back, ${customerProfile.name}! Synced with Supabase.`, 'success');
      return { success: true };
    } catch (err: any) {
      console.error('Customer login error:', err);
      return { success: false, error: err?.message || 'Failed to authenticate with Supabase.' };
    }
  };

  const signOutUser = async () => {
    localStorage.removeItem('baagfresh_active_user');
    setIsAdminUser(false);
    handleSetAdminAuth(false);
    setUser(null);
    fetchOrdersFromSupabase();
    showToast('Signed out of account', 'info');
  };

  const updateUserAddresses = async (addresses: Address[]) => {
    if (!user) return;
    const updated = { ...user, addresses };
    setUser(updated);
    LocalAuthManager.setSession(updated);
    localStorage.setItem('baagfresh_active_user', JSON.stringify(updated));

    if (user.phone) {
      try {
        await queryCustomerTable(async (tableName) => {
          return await supabase
            .from(tableName)
            .update({ saved_address: addresses })
            .eq('phone', user.phone);
        });
      } catch (err) {
        console.warn('Failed to update address in Supabase:', err);
      }
    }
    showToast('Addresses updated successfully', 'success');
  };

  // Notifications & Toast
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('baagfresh_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('baagfresh_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const showToast = (message: string, type: ToastItem['type'] = 'success') => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, message, type };
    setToasts((prev) => [...prev, item]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const hideToast = () => {
    setToasts((prev) => prev.slice(1));
  };

  const toast = toasts[toasts.length - 1] || null;

  const addNotification = (title: string, message: string, type: AppNotification['type'] = 'order') => {
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title,
      message,
      date: 'Just now',
      timestamp: 'Just now',
      type,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || key;
  };

  const formatPrice = (amountInINR: number): string => {
    const currentCurr = CURRENCIES[currency] || CURRENCIES.INR;
    return formatCurrencyPrice(amountInINR, currentCurr);
  };

  // Cart operations
  const addToCart = (product: Product, selectedWeight?: string, quantity: number = 1) => {
    const chosenWeight = selectedWeight || product.packOptions[0]?.weight || '250g';
    const opt = product.packOptions.find((p) => p.weight === chosenWeight) || product.packOptions[0];
    const cartItemId = `${product.id}-${chosenWeight}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          product,
          selectedWeight: chosenWeight,
          price: opt ? opt.price : product.basePrice,
          originalPrice: opt ? opt.originalPrice : product.originalPrice,
          quantity,
        },
      ];
    });

    showToast(`Added ${quantity}x ${product.name} (${chosenWeight}) to basket!`, 'success');
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    showToast('Item removed from basket', 'info');
  };

  const updateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity: newQty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo('');
    setPromoDiscountRate(0);
  };

  const applyPromoCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const foundPromo = promoCodes.find((p) => p.code.toUpperCase() === cleanCode);

    if (!foundPromo) {
      showToast('Invalid or expired coupon code', 'error');
      return { success: false, message: 'Invalid coupon code. Try BAAGFRESH10 or FESTIVE20.' };
    }

    if (!foundPromo.isActive) {
      showToast('This coupon code is currently inactive', 'warning');
      return { success: false, message: 'Coupon code is no longer active.' };
    }

    if (cartSubtotal < foundPromo.minOrderValue) {
      showToast(`Minimum order amount of ${formatPrice(foundPromo.minOrderValue)} required`, 'warning');
      return { 
        success: false, 
        message: `Min. order value of ${formatPrice(foundPromo.minOrderValue)} required for this code.` 
      };
    }

    setAppliedPromo(foundPromo.code);
    if (foundPromo.discountPercent) {
      setPromoDiscountRate(foundPromo.discountPercent / 100);
      setPromoFlatDiscount(0);
      showToast(`Promo ${foundPromo.code} applied: ${foundPromo.discountPercent}% OFF!`, 'success');
      return { success: true, message: `${foundPromo.discountPercent}% discount applied!` };
    } else if (foundPromo.flatDiscount) {
      setPromoDiscountRate(0);
      setPromoFlatDiscount(foundPromo.flatDiscount);
      showToast(`Promo ${foundPromo.code} applied: ₹${foundPromo.flatDiscount} OFF!`, 'success');
      return { success: true, message: `Flat ₹${foundPromo.flatDiscount} discount applied!` };
    }

    return { success: true, message: 'Discount applied!' };
  };

  const removePromoCode = () => {
    setAppliedPromo('');
    setPromoDiscountRate(0);
    setPromoFlatDiscount(0);
    showToast('Promo code removed', 'info');
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // Calculate discount based on percentage and flat rate
  let rawDiscount = (cartSubtotal * promoDiscountRate) + promoFlatDiscount;
  const currentPromoObj = promoCodes.find((p) => p.code.toUpperCase() === appliedPromo.toUpperCase());
  if (currentPromoObj?.maxDiscount && rawDiscount > currentPromoObj.maxDiscount) {
    rawDiscount = currentPromoObj.maxDiscount;
  }
  const cartDiscount = rawDiscount;
  const cartShipping = cartSubtotal >= 999 ? 0 : 99;
  const cartTax = Math.max(0, (cartSubtotal - cartDiscount)) * (storeSettings.taxRatePercent / 100);
  const cartTotal = Number(cartSubtotal - cartDiscount + cartShipping + cartTax);

  // Wishlist
  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      let updated: Product[];
      if (exists) {
        showToast(`Removed ${product.name} from wishlist`, 'info');
        updated = prev.filter((p) => p.id !== product.id);
      } else {
        showToast(`Saved ${product.name} to wishlist!`, 'success');
        updated = [...prev, product];
      }

      if (true) {
        saveWishlistToFirestore(user.id, updated.map((p) => p.id)).catch((err) => {
          console.error('Failed to sync wishlist to Firestore:', err);
        });
      }

      return updated;
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p.id === productId);
  };

  // Orders (Pure Supabase Database Backend Integration)
  const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'status' | 'trackingSteps' | 'eta'>): Promise<Order> => {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Cannot place order: Your cart is empty.');
    }

    const shippingFee = orderData.subtotal >= 999 ? 0 : 99;
    const finalGrandTotal = Number(orderData.subtotal) - Number(orderData.discount || 0) + Number(shippingFee) + Number(orderData.tax || 0);
    const generatedOrderId = 'ORD-' + Date.now();
    const custName = (orderData.customerName || orderData.shippingAddress?.fullName || 'Patron').trim();
    const custPhone = String(orderData.customerPhone || orderData.shippingAddress?.phone || '').trim();

    if (!custPhone) {
      throw new Error('Valid customer contact phone number is required to confirm your order.');
    }

    const orderPayload = {
      orderId: generatedOrderId,
      customerName: custName,
      customerPhone: custPhone,
      customerEmail: user?.email || '',
      shippingAddress: orderData.shippingAddress,
      items: orderData.items,
      subtotal: Number(orderData.subtotal),
      shippingFee: Number(shippingFee),
      discount: Number(orderData.discount || 0),
      tax: Number(orderData.tax || 0),
      total: Number(finalGrandTotal),
      paymentMethod: orderData.paymentMethod || 'COD',
      paymentStatus: orderData.paymentStatus || (orderData.paymentMethod === 'cod' ? 'cod_pending' : 'paid'),
      idempotencyKey: `${custPhone}_${Math.round(finalGrandTotal)}_${orderData.items.map(i => i.id).sort().join('-')}`
    };

    // 1. Save to Supabase (Enforced: will throw error if save fails)
    const savedRow = await apiCreateOrder(orderPayload);
    const mappedOrder = mapSupabaseOrderToOrder(savedRow);

    // 2. Update local state
    setOrders((prev) => [mappedOrder, ...prev.filter(o => o.id !== mappedOrder.id)]);

    // 3. Clear cart ONLY after successful Supabase persistence
    clearCart();

    // 4. Notifications
    addNotification(
      `Order ${mappedOrder.orderNumber} Confirmed!`,
      `Thank you for your order of ${formatPrice(mappedOrder.total)}. Your order is saved in the Supabase database.`,
      'order'
    );
    showToast(`Order ${mappedOrder.orderNumber} placed & saved in Supabase!`, 'success');

    return mappedOrder;
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await apiUpdateOrderStatus(orderId, 'Cancelled');
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId || o.orderNumber === orderId ? { ...o, status: 'confirmed' } : o
        )
      );
      showToast(`Order #${orderId} cancellation updated in Supabase`, 'info');
    } catch (err: any) {
      console.error('Failed to cancel order in Supabase:', err);
      showToast('Failed to cancel order in database', 'error');
    }
  };

  // Admin update order status directly in Supabase
  const updateOrderStatus = async (orderId: string, newStatus: Order['status'], customNote?: string) => {
    let dbStatus = 'Order Confirmed';
    if (newStatus === 'confirmed') dbStatus = 'Order Confirmed';
    else if (newStatus === 'packed') dbStatus = 'Packed & Sealed';
    else if (newStatus === 'dispatched') dbStatus = 'Dispatched';
    else if (newStatus === 'out_for_delivery') dbStatus = 'Out for Delivery';
    else if (newStatus === 'delivered') dbStatus = 'Delivered';

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId && ord.orderNumber !== orderId) return ord;

        const updatedSteps = ord.trackingSteps.map((step, idx) => {
          if (newStatus === 'confirmed') {
            return { ...step, completed: idx === 0, current: idx === 0 };
          }
          if (newStatus === 'packed') {
            return { ...step, completed: idx <= 1, current: idx === 1 };
          }
          if (newStatus === 'dispatched') {
            return { ...step, completed: idx <= 2, current: idx === 2 };
          }
          if (newStatus === 'out_for_delivery') {
            return { ...step, completed: idx <= 3, current: idx === 3 };
          }
          if (newStatus === 'delivered') {
            return { ...step, completed: true, current: false };
          }
          return step;
        });

        if (customNote && updatedSteps.length > 0) {
          const activeIndex = updatedSteps.findIndex((s) => s.current) || 0;
          if (updatedSteps[activeIndex]) {
            updatedSteps[activeIndex].description = customNote;
          }
        }

        return {
          ...ord,
          status: newStatus,
          trackingSteps: updatedSteps,
          eta: newStatus === 'delivered' ? 'Delivered' : ord.eta,
        };
      })
    );

    try {
      await apiUpdateOrderStatus(orderId, dbStatus, customNote);
      showToast(`Order status updated to "${dbStatus}" in Supabase!`, 'success');
    } catch (err: any) {
      console.error('Supabase status update exception:', err);
      showToast(`Failed to update order status in Supabase: ${err?.message || ''}`, 'error');
    }
  };

  function newOrderNumber(num: number) {
    return `BF-${num}-VRN`;
  }

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        currency,
        setCurrency,
        formatPrice,
        language,
        setLanguage,
        t,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStock,
        bulkUpdateProducts,
        resetProductsToDefault,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        quickViewProduct,
        setQuickViewProduct,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartDiscount,
        cartShipping,
        cartTax,
        cartTotal,
        appliedPromo,
        applyPromoCode,
        removePromoCode,
        promoCodes,
        addPromoCode,
        updatePromoCode,
        deletePromoCode,
        togglePromoCode,
        storeSettings,
        updateStoreSettings,
        wholesaleInquiries,
        addWholesaleInquiry,
        updateInquiryStatus,
        deleteInquiry,
        wishlist,
        toggleWishlist,
        isInWishlist,
        isChatbotOpen,
        setIsChatbotOpen,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isProfileOpen,
        setIsProfileOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isWholesaleOpen,
        setIsWholesaleOpen,
        isAuthOpen,
        setIsAuthOpen,
        isStoryOpen,
        setIsStoryOpen,
        trackingOrder,
        setTrackingOrder,
        isAdminOpen,
        setIsAdminOpen,
        isAdminAuthenticated,
        setIsAdminAuthenticated: handleSetAdminAuth,
        isAdminUser,
        isGmailHubOpen,
        setIsGmailHubOpen,
        gmailHubInitialOrder,
        setGmailHubInitialOrder,
        gmailHubInitialInquiry,
        setGmailHubInitialInquiry,
        openGmailInvoice,
        openGmailInquiry,
        // firebaseUser: null, // Removed
        authLoading,
        signOutUser,
        loginCustomerWithPhone,
        user,
        setUser,
        updateUserAddresses,
        orders,
        fetchOrdersFromSupabase,
        createOrder,
        cancelOrder,
        updateOrderStatus,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        addNotification,
        toast,
        toasts,
        showToast,
        hideToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
