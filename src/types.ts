export type CategorySlug = 'all' | 'dry-fruits' | 'spices' | 'seeds-berries' | 'gifting' | 'dates-exotics';

export interface PackOption {
  weight: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  popular?: boolean;
}

export interface NutritionFact {
  calories: string;
  protein: string;
  healthyFats: string;
  carbs: string;
  dietaryFiber: string;
  keyVitamins: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  verifiedBuyer: boolean;
  title: string;
  comment: string;
  likes: number;
}

export interface Product {
  id: string;
  name: string;
  hindiName: string;
  category: 'dry-fruits' | 'spices' | 'seeds-berries' | 'gifting' | 'dates-exotics';
  origin: string;
  description: string;
  longDescription: string;
  image: string;
  gallery: string[];
  basePrice: number; // in INR
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  badge?: 'Best Seller' | 'Organic' | 'Festive Pick' | 'Farm Fresh' | 'New' | '100% Pure';
  inStock: boolean;
  isOrganic: boolean;
  packOptions: PackOption[];
  nutrition: NutritionFact;
  harvestSeason: string;
  grading: string;
  benefits: string[];
  reviews?: ReviewItem[];
}

export interface CartItem {
  id: string; // product.id + '-' + weight
  product: Product;
  selectedWeight: string;
  price: number;
  originalPrice: number;
  quantity: number;
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateFromINR: number; // 1 INR = X Currency
}

export type LanguageCode = 'en' | 'hi' | 'es' | 'fr' | 'de';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface TrackingStep {
  title: string;
  description: string;
  date: string;
  completed: boolean;
  current?: boolean;
}

export type PaymentMethod = 'upi' | 'rupay' | 'visa' | 'mastercard' | 'card' | 'cod' | 'netbanking';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  shippingFee: number;
  tax: number;
  total: number;
  currency: CurrencyCode;
  status: 'confirmed' | 'packed' | 'dispatched' | 'out_for_delivery' | 'delivered';
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending' | 'cod_pending';
  trackingSteps: TrackingStep[];
  eta: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  timestamp?: string;
  type: 'order' | 'promo' | 'harvest' | 'stock' | 'security';
  read: boolean;
  link?: string;
  orderId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  memberSince: string;
  addresses: Address[];
  is2FAEnabled: boolean;
  e2eEncryptionKeyFingerprint: string;
  cloudSyncEnabled: boolean;
  pin?: string;
}

export interface CategoryInfo {
  id: CategorySlug;
  name: string;
  hindiName: string;
  description: string;
  image: string;
  itemCount: number;
  accentColor: string;
}

export interface PromoCodeItem {
  id: string;
  code: string;
  discountPercent?: number;
  flatDiscount?: number;
  minOrderValue: number;
  maxDiscount?: number;
  description: string;
  isActive: boolean;
  usageCount: number;
  expiryDate: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  announcementText: string;
  announcementActive: boolean;
  freeShippingThreshold: number;
  flatShippingFee: number;
  taxRatePercent: number;
  supportPhone: string;
  supportEmail: string;
  hubAddress: string;
  isStoreLive: boolean;
  allowCOD: boolean;
  maintenanceNotice: string;
}

export interface WholesaleInquiry {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  requirement: string;
  estimatedQuantity: string;
  date: string;
  status: 'new' | 'contacted' | 'quoted' | 'closed';
  notes?: string;
}

export type UserRole = 'guest' | 'customer' | 'store_manager' | 'superadmin';

export interface RolePermissionPolicy {
  role: UserRole;
  title: string;
  badgeColor: string;
  description: string;
  allowedActions: string[];
  restrictedActions: string[];
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  action: string;
  userEmail: string;
  userRole: UserRole;
  status: 'granted' | 'denied' | 'flagged';
  authMethod: 'google_oauth' | 'email_password' | 'guest_session';
  details: string;
  ipPlaceholder?: string;
}

export interface SecurityPostureStatus {
  googleAuthEnforced: boolean;
  serverSideVerificationActive: boolean;
  rbacPolicyLoaded: boolean;
  firestoreRulesEnforced: boolean;
  lastAuditCheck: string;
  authorizedAdminCount: number;
}
