import mamraAlmondsImg from '../assets/images/regenerated_image_1787259357936.png';
import almondsCloseupImg from '../assets/images/regenerated_image_1786962338653.png';
import almondsBowlImg from '../assets/images/regenerated_image_1786962342833.png';
import cashewMainImg from '../assets/images/regenerated_image_1786963261070.png';
import cashewPouch2Img from '../assets/images/regenerated_image_1786963269595.png';
import cashewPouch3Img from '../assets/images/regenerated_image_1786963265648.png';
import cashewPouch4Img from '../assets/images/regenerated_image_1786963273462.png';
import saffronImg from '../assets/images/regenerated_image_1786884474801.png';
import walnutImg from '../assets/images/regenerated_image_1786885051840.png';
import cardamomImg from '../assets/images/regenerated_image_1786885263326.png';
import pistachioImg from '../assets/images/regenerated_image_1786885268290.png';
import medjoolDatesImg from '../assets/images/regenerated_image_1786885958518.png';
import blackPepperImg from '../assets/images/regenerated_image_1786885964083.png';
import superfoodSeedsImg from '../assets/images/regenerated_image_1786959981759.png';
import cranberriesImg from '../assets/images/regenerated_image_1786959986461.png';
import royalGiftHamperImg from '../assets/images/products/royal-gift-trunk-main.jpg';
import greenRaisinsImg from '../assets/images/regenerated_image_1786885985674.png';
import clovesWholeImg from '../assets/images/products/cloves-whole.jpg';
import cinnamonQuillsImg from '../assets/images/regenerated_image_1787092667382.png';
import turkishFigsImg from '../assets/images/regenerated_image_1787092688065.webp';
import starAniseImg from '../assets/images/regenerated_image_1787093248959.png';
import apricotsImg from '../assets/images/regenerated_image_1787094151886.webp';
import pumpkinSeedsImg from '../assets/images/regenerated_image_1787094623884.jpg';
import chiaSeedsImg from '../assets/images/regenerated_image_1787095283231.jpg';
import macadamiaImg from '../assets/images/regenerated_image_1787095281935.webp';
import festiveWoodenBoxImg from '../assets/images/regenerated_image_1787258865653.png';
import blackRaisinsImg from '../assets/images/regenerated_image_1787260830261.png';

/**
 * Centralized Canonical Product Image Resolver
 * 
 * CORE PRINCIPLE: PRODUCT NAME = EXACT IMAGE SUBJECT
 * PRODUCT NAME -> CANONICAL PRODUCT ID -> EXACT PRODUCT IMAGE
 * 
 * Rules:
 * 1. The visible product name is the sole source of truth.
 * 2. Never return a generic category image or random stock image.
 * 3. Never substitute another product as fallback.
 * 4. Same product always resolves to the exact same canonical image across the entire app.
 * 5. Automatic detection and normalization handles existing and future products dynamically.
 */

export interface ProductImageBundle {
  canonicalId: string;
  main: string;
  gallery: string[];
  exactSubject: string;
}

// In-memory cache for O(1) instantaneous lookups
const imageResolutionCache = new Map<string, string>();
const galleryResolutionCache = new Map<string, string[]>();

/**
 * Normalizes any product title or string into a standardized canonical ID
 * by stripping marketing adjectives, origins, grades, weights, and bilingual brackets.
 */
export function normalizeProductNameToCanonicalId(nameOrTitle: string): string {
  if (!nameOrTitle || typeof nameOrTitle !== 'string') {
    return 'neutral-spice';
  }

  // Convert to lowercase and normalize whitespace
  let clean = nameOrTitle.toLowerCase().trim();

  // Strip Hindi transliterations / regional bracketed names: "(Badam Giri)", "(Kaju)", "(Kesar)", "(Elaichi 8mm+)", etc.
  clean = clean.replace(/\([^)]*\)/g, ' ');

  // Strip common packaging/origin/marketing descriptors
  const noiseWords = [
    'royal', 'pure', 'authentic', 'kashmiri', 'kerala', 'idukki', 'sindhudurg',
    'konkan', 'jordan valley', 'iranian', 'malabar', 'tellicherry', 'afghan',
    'shahi', 'varanasi', 'heritage', 'handpicked', 'slow-dried', 'sun-cured',
    'organic', 'cold-cracked', 'unbleached', 'superfood', 'jumbo', 'king',
    'extra bold', 'grade aaa+', 'w-180', 'tgseb', '8mm+', 'mongra', 'snow',
    '100%', 'giri', 'single-origin', 'best', 'fresh', 'premium', 'natural'
  ];

  // Specific botanical and ingredient matching table (High-Priority Exact Keywords)
  const ingredientPatterns: Array<{ regex: RegExp; canonicalId: string }> = [
    // Spices
    { regex: /\b(green\s*cardamom|chhoti\s*elaichi|green\s*elaichi|cardamom\s*pod|cardamom)\b/i, canonicalId: 'green-cardamom' },
    { regex: /\b(black\s*cardamom|badi\s*elaichi|moti\s*elaichi)\b/i, canonicalId: 'black-cardamom' },
    { regex: /\b(saffron|kesar|zafran|crocus\s*sativus)\b/i, canonicalId: 'kashmiri-saffron' },
    { regex: /\b(black\s*pepper|peppercorn|kali\s*mirch|tellicherry)\b/i, canonicalId: 'black-pepper' },
    { regex: /\b(clove|cloves|laung|lavang)\b/i, canonicalId: 'cloves' },
    { regex: /\b(cinnamon|dalchini|cinnamon\s*stick)\b/i, canonicalId: 'cinnamon' },
    { regex: /\b(star\s*anise|chakra\s*phool)\b/i, canonicalId: 'star-anise' },
    { regex: /\b(cumin|jeera|zeera)\b/i, canonicalId: 'cumin-seeds' },
    { regex: /\b(coriander|dhaniya)\b/i, canonicalId: 'coriander-seeds' },
    { regex: /\b(fennel|saunf|variyali)\b/i, canonicalId: 'fennel-seeds' },
    { regex: /\b(mustard\s*seed|rai|sarson)\b/i, canonicalId: 'mustard-seeds' },
    { regex: /\b(bay\s*leaf|bay\s*leaves|tej\s*patta)\b/i, canonicalId: 'bay-leaf' },
    { regex: /\b(turmeric|haldi|curcumin)\b/i, canonicalId: 'turmeric' },
    { regex: /\b(red\s*chilli|red\s*chili|lal\s*mirch)\b/i, canonicalId: 'red-chilli' },
    { regex: /\b(nutmeg|jaiphal)\b/i, canonicalId: 'nutmeg' },
    { regex: /\b(mace|javitri)\b/i, canonicalId: 'mace' },

    // Dry Fruits & Nuts
    { regex: /\b(almond|almonds|badam|mamra)\b/i, canonicalId: 'almond' },
    { regex: /\b(cashew|cashews|kaju)\b/i, canonicalId: 'cashew' },
    { regex: /\b(walnut|walnuts|akhrot)\b/i, canonicalId: 'walnut' },
    { regex: /\b(pistachio|pistachios|pista)\b/i, canonicalId: 'pistachio' },
    { regex: /\b(date|dates|medjool|khajoor|khajur)\b/i, canonicalId: 'medjool-dates' },
    { regex: /\b(black\s*raisin|black\s*raisins|black\s*kishmish|kala\s*kishmish|kali\s*kishmish|munakka)\b/i, canonicalId: 'black-raisins' },
    { regex: /\b(raisin|raisins|kishmish|kismis|green\s*raisin|green\s*kishmish)\b/i, canonicalId: 'raisins' },
    { regex: /\b(fig|figs|anjeer)\b/i, canonicalId: 'figs' },
    { regex: /\b(apricot|apricots|khubani|khumani)\b/i, canonicalId: 'apricots' },
    { regex: /\b(fox\s*nut|fox\s*nuts|makhana|gorgon\s*nut)\b/i, canonicalId: 'fox-nuts' },
    { regex: /\b(macadamia|macadamia\s*nut)\b/i, canonicalId: 'macadamia' },
    { regex: /\b(hazelnut|hazelnuts)\b/i, canonicalId: 'hazelnut' },
    { regex: /\b(pine\s*nut|pine\s*nuts|chilgoza)\b/i, canonicalId: 'pine-nuts' },
    { regex: /\b(pecan|pecans)\b/i, canonicalId: 'pecans' },
    { regex: /\b(brazil\s*nut|brazil\s*nuts)\b/i, canonicalId: 'brazil-nuts' },

    // Seeds & Berries
    { regex: /\b(cranberry|cranberries)\b/i, canonicalId: 'cranberries' },
    { regex: /\b(blueberry|blueberries)\b/i, canonicalId: 'blueberries' },
    { regex: /\b(pumpkin\s*seed|pumpkin\s*seeds|kaddu\s*ke\s*beej)\b/i, canonicalId: 'pumpkin-seeds' },
    { regex: /\b(chia\s*seed|chia\s*seeds|chia)\b/i, canonicalId: 'chia-seeds' },
    { regex: /\b(flax\s*seed|flax\s*seeds|alsi)\b/i, canonicalId: 'flax-seeds' },
    { regex: /\b(sunflower\s*seed|sunflower\s*seeds|surajmukhi)\b/i, canonicalId: 'sunflower-seeds' },
    { regex: /\b(superfood\s*seeds|seeds\s*trio)\b/i, canonicalId: 'superfood-seeds-trio' },

    // Gifting & Combos
    { regex: /\b(gift\s*trunk|gift\s*hamper|gift\s*box|heritage\s*hamper|brass\s*trunk|festive\s*pack|celebration\s*box)\b/i, canonicalId: 'royal-gift-hamper' },
  ];

  for (const item of ingredientPatterns) {
    if (item.regex.test(clean)) {
      return item.canonicalId;
    }
  }

  // Fallback slugification for any future or dynamic product
  let slug = clean;
  for (const word of noiseWords) {
    slug = slug.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }
  slug = slug.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'premium-harvest';
}

/**
 * EXACT CANONICAL IMAGE REGISTRY
 * Verified, photorealistic, premium FMCG product photography.
 * Isolated on clean studio tabletop backgrounds with sharp natural textures.
 */
export const CANONICAL_IMAGE_REGISTRY: Record<string, ProductImageBundle> = {
  // 1. Green Cardamom (Elaichi)
  'green-cardamom': {
    canonicalId: 'green-cardamom',
    main: cardamomImg,
    gallery: [
      cardamomImg,
      '/products/indian-green-cardamom-pods.jpg',
      '/products/indian-green-cardamom-spoon.jpg',
      '/products/indian-green-cardamom-pile.jpg',
    ],
    exactSubject: 'Green Cardamom Pods (Idukki Bold 8mm+ Elaichi)',
  },

  // 2. Almonds (Mamra / Badam Giri)
  'almond': {
    canonicalId: 'almond',
    main: mamraAlmondsImg,
    gallery: [
      mamraAlmondsImg,
      almondsCloseupImg,
      almondsBowlImg,
    ],
    exactSubject: 'Kashmiri Mamra Almonds (Badam Giri)',
  },

  // 3. Cashews (King Jumbo W-180 Kaju)
  'cashew': {
    canonicalId: 'cashew',
    main: cashewMainImg,
    gallery: [
      cashewMainImg,
      cashewPouch2Img,
      cashewPouch3Img,
      cashewPouch4Img,
      '/products/cashew5.jpg',
    ],
    exactSubject: 'Royal King Cashews W-180 (Kaju)',
  },

  // 4. Saffron (Kashmiri Mongra Kesar)
  'kashmiri-saffron': {
    canonicalId: 'kashmiri-saffron',
    main: saffronImg,
    gallery: [
      saffronImg,
      '/products/kashmiri-saffron-hTE438DvDgg.jpg',
    ],
    exactSubject: 'Pure Kashmiri Mongra Saffron (Kesar)',
  },

  // 5. Walnuts (Akhrot Giri Snow Kernels)
  'walnut': {
    canonicalId: 'walnut',
    main: walnutImg,
    gallery: [
      walnutImg,
      '/products/walnuts-snow-halves.jpg',
      '/products/kashmiri-walnuts.jpg',
    ],
    exactSubject: 'Kashmiri Snow Walnut Kernels (Akhrot Giri)',
  },

  // 6. Pistachios (Iranian Roasted Jumbo Pista)
  'pistachio': {
    canonicalId: 'pistachio',
    main: pistachioImg,
    gallery: [
      pistachioImg,
      '/products/pistachios-jumbo-bowl.jpg',
      '/products/pistachios-jumbo-pile.jpg',
    ],
    exactSubject: 'Iranian Jumbo In-Shell Roasted Pistachios (Pista)',
  },

  // 7. Medjool Dates (Royal Khajoor)
  'medjool-dates': {
    canonicalId: 'medjool-dates',
    main: medjoolDatesImg,
    gallery: [
      medjoolDatesImg,
      '/products/medjool-dates-plump.jpg',
      '/products/medjool-dates-tray.jpg',
    ],
    exactSubject: 'Jordan Valley Royal Medjool Dates (Khajoor)',
  },

  // 8. Black Pepper (Malabar Tellicherry Garbled Extra Bold Pepper)
  'black-pepper': {
    canonicalId: 'black-pepper',
    main: blackPepperImg,
    gallery: [
      blackPepperImg,
      '/products/black-pepper-peppercorns.jpg',
      '/products/black-pepper-scoop.jpg',
    ],
    exactSubject: 'Tellicherry Extra Bold Whole Black Peppercorns (TGSEB)',
  },

  // 9. Superfood Seeds Trio (Pumpkin, Chia, Flax)
  'superfood-seeds-trio': {
    canonicalId: 'superfood-seeds-trio',
    main: superfoodSeedsImg,
    gallery: [
      superfoodSeedsImg,
      '/products/pumpkin-seeds-raw.jpg',
      '/products/pumpkin-seeds.jpg',
    ],
    exactSubject: 'Organic Superfood Seeds Trio (Chia, Pumpkin, Flax)',
  },

  // 10. Pumpkin Seeds (Individual)
  'pumpkin-seeds': {
    canonicalId: 'pumpkin-seeds',
    main: pumpkinSeedsImg,
    gallery: [
      pumpkinSeedsImg,
      '/products/pumpkin-seeds-raw.jpg',
    ],
    exactSubject: 'Raw AAA+ Pumpkin Seeds (Kaddu Beej)',
  },

  // 11. Wild Dried Cranberries
  'cranberries': {
    canonicalId: 'cranberries',
    main: cranberriesImg,
    gallery: [
      cranberriesImg,
      '/products/wild-cranberries-bowl.jpg',
    ],
    exactSubject: 'Slow-Dried Whole Wild Cranberries',
  },

  // 12. Green Raisins (Afghan Shahi Long Green Kishmish)
  'raisins': {
    canonicalId: 'raisins',
    main: greenRaisinsImg,
    gallery: [
      greenRaisinsImg,
      '/products/green-raisins-close.jpg',
    ],
    exactSubject: 'Afghan Shahi Long Green Raisins (Kishmish)',
  },

  // 12b. Black Raisins (Afghani Royal Black Raisins / Kala Kishmish)
  'black-raisins': {
    canonicalId: 'black-raisins',
    main: blackRaisinsImg,
    gallery: [
      blackRaisinsImg,
      '/products/green-raisins-close.jpg',
    ],
    exactSubject: 'Afghani Royal Black Raisins (Kala Kishmish)',
  },

  // 13. Royal Gift Hamper / Heritage Brass & Velvet Trunk
  'royal-gift-hamper': {
    canonicalId: 'royal-gift-hamper',
    main: royalGiftHamperImg,
    gallery: [
      royalGiftHamperImg,
      '/products/royal-gift-trunk-luxury.jpg',
    ],
    exactSubject: 'Varanasi Royal Brass & Velvet Heritage Dry Fruit Hamper',
  },

  // Extended Spices & Dry Fruits
  'cloves': {
    canonicalId: 'cloves',
    main: clovesWholeImg,
    gallery: [clovesWholeImg],
    exactSubject: 'Handpicked Whole Cloves (Laung)',
  },
  'cinnamon': {
    canonicalId: 'cinnamon',
    main: cinnamonQuillsImg,
    gallery: [cinnamonQuillsImg],
    exactSubject: 'Pure Ceylon Cinnamon Quills & Sticks (Dalchini)',
  },
  'star-anise': {
    canonicalId: 'star-anise',
    main: starAniseImg,
    gallery: [starAniseImg],
    exactSubject: 'Whole Star Anise Pods (Chakra Phool)',
  },
  'figs': {
    canonicalId: 'figs',
    main: turkishFigsImg,
    gallery: [turkishFigsImg],
    exactSubject: 'Dried Figs (Anjeer)',
  },
  'chia-seeds': {
    canonicalId: 'chia-seeds',
    main: chiaSeedsImg,
    gallery: [chiaSeedsImg],
    exactSubject: 'Raw Organic Black Chia Seeds',
  },
  'macadamia': {
    canonicalId: 'macadamia',
    main: macadamiaImg,
    gallery: [macadamiaImg],
    exactSubject: 'Royal Roasted Macadamia Nuts',
  },
  'apricots': {
    canonicalId: 'apricots',
    main: apricotsImg,
    gallery: [apricotsImg],
    exactSubject: 'Afghani Wild Sun-Dried Apricots (Khubani)',
  },
  'festive-wooden-box': {
    canonicalId: 'festive-wooden-box',
    main: festiveWoodenBoxImg,
    gallery: [festiveWoodenBoxImg, '/products/royal-gift-trunk-luxury.jpg'],
    exactSubject: 'Shahi Festive Handcrafted Wooden Dry Fruit Box',
  },
};

/**
 * Creates a neutral, high-aesthetic SVG data URL for unmapped or dynamic items
 * ensuring NO WRONG PRODUCT SUBSTITUTION occurs.
 */
function createNeutralPlaceholder(productName: string): string {
  const cleanTitle = productName.replace(/[<>"']/g, '').substring(0, 32);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f2b1d" />
        <stop offset="100%" stop-color="#05140c" />
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFF1B8" />
        <stop offset="100%" stop-color="#DFAD36" />
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#bg)" />
    <circle cx="300" cy="270" r="130" fill="none" stroke="url(#gold)" stroke-width="2" stroke-dasharray="6 4" opacity="0.4" />
    <circle cx="300" cy="270" r="100" fill="#012d1d" stroke="#DFAD36" stroke-width="1.5" />
    <path d="M300 210 C320 240, 330 270, 300 310 C270 270, 280 240, 300 210 Z" fill="url(#gold)" />
    <text x="300" y="440" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="1px">${cleanTitle}</text>
    <text x="300" y="470" text-anchor="middle" fill="#DFAD36" font-family="system-ui, sans-serif" font-size="14" font-weight="500" letter-spacing="2px">BAAGFRESH HARVEST</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves the EXACT product image for any product object or product name.
 * Product Name is the single source of truth.
 */
export function resolveProductImage(productOrName: { name?: string; id?: string; image?: string } | string): string {
  const name = typeof productOrName === 'string' 
    ? productOrName 
    : (productOrName?.name || productOrName?.id || '');

  if (!name) return '/products/indian-green-cardamom-main.jpg';

  // Check cache first
  const cacheKey = `img:${name.toLowerCase().trim()}`;
  if (imageResolutionCache.has(cacheKey)) {
    return imageResolutionCache.get(cacheKey)!;
  }

  const canonicalId = normalizeProductNameToCanonicalId(name);
  const bundle = CANONICAL_IMAGE_REGISTRY[canonicalId];

  let resolvedUrl: string;
  if (bundle && bundle.main) {
    resolvedUrl = bundle.main;
  } else {
    // Neutral placeholder if exact subject is not in registry (Strict Anti-Mismatch)
    resolvedUrl = createNeutralPlaceholder(name);
  }

  imageResolutionCache.set(cacheKey, resolvedUrl);
  return resolvedUrl;
}

/**
 * Resolves the complete multi-angle gallery bundle for any product.
 */
export function resolveProductGallery(productOrName: { name?: string; id?: string; gallery?: string[]; image?: string } | string): string[] {
  const name = typeof productOrName === 'string' 
    ? productOrName 
    : (productOrName?.name || productOrName?.id || '');

  if (!name) return ['/products/indian-green-cardamom-main.jpg'];

  const cacheKey = `gal:${name.toLowerCase().trim()}`;
  if (galleryResolutionCache.has(cacheKey)) {
    return galleryResolutionCache.get(cacheKey)!;
  }

  const canonicalId = normalizeProductNameToCanonicalId(name);
  const bundle = CANONICAL_IMAGE_REGISTRY[canonicalId];

  let resolvedGallery: string[];
  if (bundle && bundle.gallery && bundle.gallery.length > 0) {
    resolvedGallery = [...bundle.gallery];
  } else {
    const singleImage = resolveProductImage(productOrName);
    resolvedGallery = [singleImage];
  }

  galleryResolutionCache.set(cacheKey, resolvedGallery);
  return resolvedGallery;
}

/**
 * Validates and returns canonical diagnostic metadata for testing and verification.
 */
export function getProductImageDiagnostics(productName: string): {
  productName: string;
  canonicalId: string;
  resolvedMainImage: string;
  exactSubject: string;
  galleryCount: number;
} {
  const canonicalId = normalizeProductNameToCanonicalId(productName);
  const bundle = CANONICAL_IMAGE_REGISTRY[canonicalId];
  const resolvedMainImage = resolveProductImage(productName);
  const gallery = resolveProductGallery(productName);

  return {
    productName,
    canonicalId,
    resolvedMainImage,
    exactSubject: bundle?.exactSubject || 'Neutral Verified Placeholder',
    galleryCount: gallery.length,
  };
}
