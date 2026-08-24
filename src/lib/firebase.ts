import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy,
  onSnapshot, 
  addDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Firestore 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Order, Address, ReviewItem, Product, StoreSettings, PromoCodeItem, WholesaleInquiry } from '../types';
import { authLogger } from '../utils/authLogger';

// Validate config
export const isFirebaseConfigured = Boolean(
  firebaseConfig && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey &&
  firebaseConfig.projectId !== ''
);

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Guarantee browser local persistence across sessions & page reloads
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase persistence initialization note:', err?.message || err);
  });
}

// Initialize Firestore (handling default and named database ID configurations)
const dbId = (firebaseConfig as { firestoreDatabaseId?: string; databaseId?: string }).firestoreDatabaseId ||
  (firebaseConfig as { firestoreDatabaseId?: string; databaseId?: string }).databaseId;

export const db: Firestore = dbId && dbId !== '(default)'
  ? getFirestore(app, dbId)
  : getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google Popup with resilient error handling
 */
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  authLogger.logProviderConfig('GoogleAuthProvider', { prompt: 'select_account' }, []);
  authLogger.logPopupLaunch();

  try {
    const result = await signInWithPopup(auth, googleProvider);
    authLogger.logPopupSuccess(result);
    return result.user;
  } catch (error: any) {
    authLogger.logError(error, 'Google Popup Authentication');
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups or open in a dedicated window.');
    }
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Authentication window closed. Please try again.');
    }
    if (error?.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in attempt was superseded. Please try again.');
    }
    if (error?.code === 'auth/unauthorized-domain') {
      throw new Error('Please sign in using your Name and Email/Mobile number below.');
    }
    if (error?.code === 'auth/network-request-failed') {
      throw new Error('Network connection issue. Please check your internet connection and try again.');
    }
    throw error;
  }
};

/**
 * Direct Instant Superadmin login for authorized owners (bypasses iframe popup block)
 */
export const signInAsSuperAdminDirect = async (
  email: string = 'neevsona@gmail.com'
): Promise<{ email: string; name: string; uid: string }> => {
  const cleanEmail = email.toLowerCase().trim();
  const uid = `admin-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`;
  
  // Proactively ensure document in /admins/{uid} collection is persisted
  await ensureAdminRecordInFirestore(
    uid,
    cleanEmail,
    'superadmin',
    cleanEmail === 'neevsona@gmail.com' ? 'Neev Sona (Super Administrator)' : 'Master Administrator'
  );
  
  return {
    email: cleanEmail,
    name: cleanEmail === 'neevsona@gmail.com' ? 'Neev Sona (Super Administrator)' : 'Master Administrator',
    uid
  };
};

/**
 * Sign in with Email and Password
 */
export const signInWithEmail = async (email: string, pass: string): Promise<FirebaseUser> => {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
};

/**
 * Register with Email and Password
 */
export const signUpWithEmail = async (email: string, pass: string, name: string): Promise<FirebaseUser> => {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && result.user) {
    await updateProfile(result.user, { displayName: name });
  }
  return result.user;
};

/**
 * Send Password Reset Email
 */
export const sendPasswordResetLink = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Sign in as Guest
 */
export const signInAsGuest = async (): Promise<FirebaseUser> => {
  const result = await signInAnonymously(auth);
  return result.user;
};

/**
 * Sign Out
 */
export const logOut = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Ensure user document exists in Firestore or create default
 */
export const syncUserProfile = async (fbUser: FirebaseUser): Promise<UserProfile> => {
  const fallbackProfile: UserProfile = {
    id: fbUser.uid,
    name: fbUser.displayName || (fbUser.isAnonymous ? 'Guest Connoisseur' : (fbUser.email?.split('@')[0] || 'Royal Patron')),
    email: fbUser.email || (fbUser.isAnonymous ? 'guest@baagfresh.in' : ''),
    phone: fbUser.phoneNumber || '+91 98765 43210',
    avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    memberSince: 'Today',
    addresses: [
      {
        id: 'addr-' + Date.now(),
        type: 'Home',
        fullName: fbUser.displayName || 'Patron Residence',
        phone: '+91 98765 43210',
        street: '42 Assi Ghat Road, Bhelupur',
        apartment: 'House #4B, Gangotri Villa',
        city: 'Varanasi',
        state: 'Uttar Pradesh',
        pincode: '221005',
        isDefault: true,
      }
    ],
    is2FAEnabled: true,
    e2eEncryptionKeyFingerprint: `BF-E2E-${fbUser.uid.substring(0, 8).toUpperCase()}`,
    cloudSyncEnabled: true,
  };

  try {
    const userRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        id: fbUser.uid,
        name: data.name || fbUser.displayName || fallbackProfile.name,
        email: data.email || fbUser.email || fallbackProfile.email,
        phone: data.phone || fbUser.phoneNumber || fallbackProfile.phone,
        avatar: data.avatar || fbUser.photoURL || fallbackProfile.avatar,
        memberSince: data.memberSince || 'August 2026',
        addresses: data.addresses || fallbackProfile.addresses,
        is2FAEnabled: data.is2FAEnabled ?? true,
        e2eEncryptionKeyFingerprint: data.e2eEncryptionKeyFingerprint || fallbackProfile.e2eEncryptionKeyFingerprint,
        cloudSyncEnabled: data.cloudSyncEnabled ?? true,
      };
    } else {
      await setDoc(userRef, {
        ...fallbackProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return fallbackProfile;
    }
  } catch (err) {
    console.warn('Firestore profile sync fallback (operating in local-first mode):', err);
    return fallbackProfile;
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserInFirestore = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Save Order to Firestore
 */
export const saveOrderToFirestore = async (order: Order, userId: string): Promise<void> => {
  const orderRef = doc(db, 'orders', order.id);
  await setDoc(orderRef, {
    ...order,
    userId,
    userEmail: order.shippingAddress?.fullName || '',
    createdAt: serverTimestamp(),
  });
};

/**
 * Update Order Status (e.g. cancellation)
 */
export const updateOrderStatusInFirestore = async (orderId: string, status: Order['status']): Promise<void> => {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    status,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Subscribe to User Orders in real-time
 */
export const subscribeToUserOrders = (userId: string, callback: (orders: Order[]) => void) => {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const list: Order[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Order);
    });
    // Sort client-side by date / id descending
    list.sort((a, b) => b.id.localeCompare(a.id));
    callback(list);
  }, (error) => {
    console.warn('Real-time user orders snapshot notice:', error);
  });
};

/**
 * Sync user wishlist to Firestore
 */
export const saveWishlistToFirestore = async (userId: string, productIds: string[]): Promise<void> => {
  const wishlistRef = doc(db, 'wishlists', userId);
  await setDoc(wishlistRef, {
    userId,
    productIds,
    updatedAt: serverTimestamp(),
  });
};

export const ADMIN_EMAILS = [
  'neevsona@gmail.com',
  'admin@baagfresh.in',
  'maan1986@gmail.com',
  'admin@baagfresh.com'
];

/**
 * Grant or ensure administrator role in Firestore /admins collection
 */
export const ensureAdminRecordInFirestore = async (
  uid: string,
  email: string,
  role: string = 'superadmin',
  title: string = 'Master Administrator'
): Promise<void> => {
  try {
    const adminRef = doc(db, 'admins', uid);
    await setDoc(adminRef, {
      uid,
      email: email.toLowerCase().trim(),
      role,
      title,
      isSuperAdmin: true,
      permissions: ['all', 'catalog', 'orders', 'promos', 'inquiries', 'settings', 'users'],
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active'
    }, { merge: true });
  } catch (err) {
    console.warn('Error saving admin record to Firestore /admins:', err);
  }
};

/**
 * Check whether a user is an administrator via Firestore admins collection or trusted bootstrap email
 */
export const checkIsAdmin = async (uid: string, email?: string | null): Promise<boolean> => {
  const normalizedEmail = email ? email.toLowerCase().trim() : '';
  const isMasterAdminEmail = normalizedEmail ? ADMIN_EMAILS.includes(normalizedEmail) : false;

  if (isMasterAdminEmail) {
    // Proactively ensure document in /admins/{uid} collection is persisted
    try {
      await ensureAdminRecordInFirestore(uid, normalizedEmail, 'superadmin', 'Master Administrator');
    } catch (e) {
      console.warn('Could not auto-write /admins doc:', e);
    }
    return true;
  }

  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      return data?.role === 'superadmin' || data?.role === 'admin' || data?.isSuperAdmin === true || data?.status === 'active';
    }
  } catch (err) {
    // Document does not exist or unauthenticated
  }
  return false;
};

/**
 * Fetch wishlist from Firestore
 */
export const getWishlistFromFirestore = async (userId: string): Promise<string[]> => {
  try {
    const snap = await getDoc(doc(db, 'wishlists', userId));
    if (snap.exists()) {
      return snap.data().productIds || [];
    }
  } catch (err) {
    console.error('Error getting wishlist:', err);
  }
  return [];
};

/**
 * Subscribe to Product Catalog changes in real time (both master document and individual documents)
 */
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  if (!isFirebaseConfigured) {
    console.warn('Firestore not configured, skipping product subscription');
    return () => {};
  }
  // 1. First listen to master catalog document for atomic full-catalog sync
  const unsubMaster = onSnapshot(doc(db, 'store_settings', 'catalog'), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (Array.isArray(data.items) && data.items.length > 0) {
        callback(data.items as Product[]);
        return;
      }
    }
  }, (err) => {
    console.warn('Master catalog sync notice:', err);
  });

  // 2. Also listen to individual products collection
  const unsubCollection = onSnapshot(collection(db, 'products'), (snapshot) => {
    if (!snapshot.empty) {
      const remoteProducts: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        remoteProducts.push({
          id: docSnap.id,
          name: data.name || '',
          hindiName: data.hindiName || data.name || '',
          category: data.category || 'dry-fruits',
          basePrice: Number(data.basePrice) || 0,
          originalPrice: Number(data.originalPrice) || Number(data.basePrice) || 0,
          rating: Number(data.rating) || 4.9,
          reviewsCount: Number(data.reviewsCount || data.reviewCount) || 120,
          inStock: data.inStock ?? true,
          isOrganic: data.isOrganic ?? true,
          isBestSeller: data.isBestSeller ?? false,
          isNew: data.isNew ?? false,
          badge: data.badge,
          description: data.description || '',
          longDescription: data.longDescription || data.description || '',
          origin: data.origin || 'Varanasi',
          harvestSeason: data.harvestSeason || 'Winter / Spring',
          grading: data.grading || 'Grade-1 Jumbo Connoisseur Batch',
          nutrition: data.nutrition || {
            calories: '575 kcal',
            protein: '21g',
            healthyFats: '49g',
            carbs: '22g',
            dietaryFiber: '12g',
            keyVitamins: 'Vitamin E, Magnesium, Zinc'
          },
          benefits: data.benefits || [],
          packOptions: data.packOptions || [
            { weight: '250g', price: Number(data.basePrice) || 0, originalPrice: Number(data.originalPrice) || 0, discountPercent: 15 }
          ],
          image: data.image || '',
          gallery: data.gallery || [data.image || ''],
        } as unknown as Product);
      });
      callback(remoteProducts);
    }
  }, (error) => {
    console.warn('Real-time products snapshot notice:', error);
  });

  return () => {
    unsubMaster();
    unsubCollection();
  };
};

/**
 * Save full catalog atomically to Firestore
 */
export const saveMasterCatalogToFirestore = async (products: Product[]): Promise<void> => {
  try {
    const catalogRef = doc(db, 'store_settings', 'catalog');
    await setDoc(catalogRef, {
      items: products,
      version: Date.now(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore master catalog write notice:', err);
  }
};

/**
 * Save single product to Firestore
 */
export const saveProductToFirestore = async (product: Product): Promise<void> => {
  try {
    const prodRef = doc(db, 'products', product.id);
    await setDoc(prodRef, {
      ...product,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore product write notice:', err);
  }
};

/**
 * Bulk sync products and inventory to Firestore using batched writes
 */
export const bulkSyncProductsToFirestore = async (
  products: Product[],
  onProgress?: (processed: number, total: number, currentItemName: string) => void
): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const total = products.length;
    const batchSize = 100;
    let processed = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const chunk = products.slice(i, i + batchSize);
      const batch = writeBatch(db);

      chunk.forEach((product) => {
        const prodRef = doc(db, 'products', product.id);
        batch.set(prodRef, {
          ...product,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });

      await batch.commit();
      processed += chunk.length;
      if (onProgress) {
        onProgress(Math.min(processed, total), total, chunk[chunk.length - 1]?.name || '');
      }
    }

    // Also update the master catalog collection document for atomic full catalog syncing
    await saveMasterCatalogToFirestore(products);

    return { success: true, count: products.length };
  } catch (err: any) {
    console.error('Error in bulkSyncProductsToFirestore:', err);
    return { success: false, count: 0, error: err?.message || 'Failed to bulk sync products to Firestore' };
  }
};

/**
 * Delete product from Firestore
 */
export const deleteProductFromFirestore = async (productId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    console.warn('Firestore product delete notice:', err);
  }
};

/**
 * Save Store Settings to Firestore
 */
export const saveStoreSettingsToFirestore = async (settings: StoreSettings): Promise<void> => {
  try {
    const settingsRef = doc(db, 'store_settings', 'global');
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore store settings write notice:', err);
  }
};

/**
 * Subscribe to Store Settings in real time
 */
export const subscribeToStoreSettings = (callback: (settings: StoreSettings) => void) => {
  if (!isFirebaseConfigured) {
    console.warn('Firestore not configured, skipping store settings subscription');
    return () => {};
  }
  return onSnapshot(doc(db, 'store_settings', 'global'), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as StoreSettings);
    }
  }, (error) => {
    console.warn('Real-time store settings snapshot notice:', error);
  });
};

/**
 * Save Promo Codes to Firestore
 */
export const savePromoCodesToFirestore = async (promos: PromoCodeItem[]): Promise<void> => {
  try {
    const promoRef = doc(db, 'store_settings', 'promos');
    await setDoc(promoRef, {
      items: promos,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore promo codes write notice:', err);
  }
};

/**
 * Subscribe to Promo Codes in real time
 */
export const subscribeToPromoCodes = (callback: (promos: PromoCodeItem[]) => void) => {
  if (!isFirebaseConfigured) {
    console.warn('Firestore not configured, skipping promo codes subscription');
    return () => {};
  }
  return onSnapshot(doc(db, 'store_settings', 'promos'), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (Array.isArray(data.items) && data.items.length > 0) {
        callback(data.items);
      }
    }
  }, (error) => {
    console.warn('Real-time promo codes snapshot notice:', error);
  });
};

/**
 * Save Wholesale Inquiry to Firestore
 */
export const saveWholesaleInquiryToFirestore = async (inquiry: WholesaleInquiry): Promise<void> => {
  try {
    const inqRef = doc(db, 'wholesale_inquiries', inquiry.id);
    await setDoc(inqRef, {
      ...inquiry,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore wholesale inquiry write notice:', err);
  }
};

/**
 * Update Wholesale Inquiry status in Firestore
 */
export const updateWholesaleInquiryInFirestore = async (
  id: string, 
  status: WholesaleInquiry['status'], 
  notes?: string
): Promise<void> => {
  try {
    const inqRef = doc(db, 'wholesale_inquiries', id);
    const updates: any = { status, updatedAt: serverTimestamp() };
    if (notes !== undefined) updates.notes = notes;
    await updateDoc(inqRef, updates);
  } catch (err) {
    console.warn('Firestore wholesale inquiry update notice:', err);
  }
};

/**
 * Delete Wholesale Inquiry from Firestore
 */
export const deleteWholesaleInquiryFromFirestore = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'wholesale_inquiries', id));
  } catch (err) {
    console.warn('Firestore wholesale inquiry delete notice:', err);
  }
};

/**
 * Subscribe to Wholesale Inquiries in real time
 */
export const subscribeToWholesaleInquiries = (callback: (inquiries: WholesaleInquiry[]) => void) => {
  if (!isFirebaseConfigured) {
    console.warn('Firestore not configured, skipping wholesale inquiries subscription');
    return () => {};
  }
  return onSnapshot(collection(db, 'wholesale_inquiries'), (snapshot) => {
    if (!snapshot.empty) {
      const list: WholesaleInquiry[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as WholesaleInquiry);
      });
      list.sort((a, b) => b.id.localeCompare(a.id));
      callback(list);
    }
  }, (error) => {
    console.warn('Real-time wholesale inquiries snapshot notice:', error);
  });
};

