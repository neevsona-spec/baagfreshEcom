import { Product, CategoryInfo } from '../types';
import { resolveProductImage, resolveProductGallery } from '../utils/productImageResolver';
import seedsBerriesRoundelImg from '../assets/images/regenerated_image_1786881482654.jpg';
import royalGiftingRoundelImg from '../assets/images/regenerated_image_1786882294516.png';
import datesExoticsRoundelImg from '../assets/images/regenerated_image_1786882788390.png';
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

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'all',
    name: 'All Harvests',
    hindiName: 'सभी उत्पाद',
    description: 'Explore our complete spectrum of handpicked dry fruits, spices, and seeds.',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=85',
    itemCount: 25,
    accentColor: '#012d1d',
  },
  {
    id: 'dry-fruits',
    name: 'Royal Dry Fruits',
    hindiName: 'शाही मेवे',
    description: 'Jumbo Mamra almonds, grade W-180 cashews, and Kashmiri walnut kernels.',
    image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=600&q=85',
    itemCount: 11,
    accentColor: '#D4AF37',
  },
  {
    id: 'spices',
    name: 'Authentic Indian Spices',
    hindiName: 'प्रामाणिक मसाले',
    description: 'Kashmiri Mongra Saffron, Kerala Cardamom, and whole aromatic spices.',
    image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=85',
    itemCount: 8,
    accentColor: '#e07a5f',
  },
  {
    id: 'seeds-berries',
    name: 'Seeds & Berries',
    hindiName: 'बीज और जामुन',
    description: 'Raw AAA Pumpkin seeds, Watermelon white seeds (Magaz), Wild Blueberries & Chia.',
    image: seedsBerriesRoundelImg,
    itemCount: 6,
    accentColor: '#3d5a80',
  },
  {
    id: 'gifting',
    name: 'Royal Gift Hampers',
    hindiName: 'शाही उपहार',
    description: 'Handcrafted Varanasi brass & velvet gift trunks for festivals and weddings.',
    image: royalGiftingRoundelImg,
    itemCount: 5,
    accentColor: '#811d2e',
  },
  {
    id: 'dates-exotics',
    name: 'Dates & Exotic Fruits',
    hindiName: 'खजूर और दुर्लभ फल',
    description: 'Saudi Medjool dates, Turkish Figs (Anjeer), and dried Apricots.',
    image: datesExoticsRoundelImg,
    itemCount: 5,
    accentColor: '#b08968',
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'bf-mamra-almond',
    name: 'Kashmiri Mamra Almonds (Badam Giri)',
    hindiName: 'कश्मीरी मामरा बादाम गिरी',
    category: 'dry-fruits',
    origin: 'Pampore Orchards, Kashmir',
    description: '100% single-origin Kashmiri Mamra almonds with over 50% natural oil content. Cold-cracked to preserve natural antioxidants.',
    longDescription: 'Mamra Almonds are the undisputed royalty of the dry fruit world. Unlike standard California almonds, our authentic Kashmiri Mamra is 100% pesticide-free, grown on heritage orchard trees in the pristine Himalayan valleys, and dried organically under gentle sunlight. Characterized by its distinct concave curve, sweet nutty crunch, and supreme concentration of vitamin E, riboflavin, and healthy polyunsaturated fatty acids.',
    image: mamraAlmondsImg,
    gallery: [
      mamraAlmondsImg,
      almondsCloseupImg,
      almondsBowlImg
    ],
    basePrice: 850,
    originalPrice: 1100,
    rating: 4.9,
    reviewsCount: 238,
    badge: 'Best Seller',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g', price: 850, originalPrice: 1100, discountPercent: 22 },
      { weight: '500g', price: 1620, originalPrice: 2200, discountPercent: 26, popular: true },
      { weight: '1kg', price: 3100, originalPrice: 4400, discountPercent: 29 },
    ],
    nutrition: {
      calories: '579 kcal',
      protein: '21.2 g',
      healthyFats: '49.9 g',
      carbs: '21.6 g',
      dietaryFiber: '12.5 g',
      keyVitamins: 'Vitamin E (170% RDA), Magnesium, Iron'
    },
    harvestSeason: 'Autumn Harvest (Sept - Nov)',
    grading: 'Grade AAA+ Organically Cultivated',
    benefits: [
      'Over 50% natural almond oil for brain vitality and memory boost',
      'Zero cholesterol and rich in heart-healthy monounsaturated fats',
      'High natural vitamin E protects cells against oxidative stress',
      'Non-pasteurized, raw, and non-fumigated'
    ],
    reviews: [
      {
        id: 'r-1',
        author: 'Sunil Mehrotra',
        location: 'Varanasi, UP',
        rating: 5,
        date: '2 days ago',
        verifiedBuyer: true,
        title: 'Authentic Mamra with unmatched oil content',
        comment: 'You can immediately tell the difference in crispness and sweetness. When soaked overnight, the water retains that rich almond essence. Highly recommended!',
        likes: 19
      },
      {
        id: 'r-2',
        author: 'Dr. Ananya Sharma',
        location: 'New Delhi',
        rating: 5,
        date: '1 week ago',
        verifiedBuyer: true,
        title: 'Best quality almonds I have ever bought online',
        comment: 'Vacuum packaging is top-notch. Not a single bitter almond in the entire 1kg pack. Truly premium.',
        likes: 12
      }
    ]
  },
  {
    id: 'bf-jumbo-cashews',
    name: 'Royal King Cashews W-180 (Kaju)',
    hindiName: 'रॉयल किंग काजू W-180',
    category: 'dry-fruits',
    origin: 'Sindhudurg Orchards, Konkan',
    description: 'The largest grading of whole cashews (King of Cashews). Buttery, sweet, and crisp with zero chemical bleaching.',
    longDescription: 'Grade W-180 stands for 180 cashew kernels per pound—the biggest and most luxurious grade in the global spice trade. Sourced from the fertile coastal red soils of the Konkan belt, each kernel is naturally sun-dried and gently steam-cracked. Experience the melting buttery texture and delicate sweetness that elevates desserts, festive platters, and wholesome snacking.',
    image: cashewMainImg,
    gallery: [
      cashewMainImg,
      cashewPouch2Img,
      cashewPouch3Img,
      cashewPouch4Img,
      '/products/cashew5.jpg'
    ],
    basePrice: 520,
    originalPrice: 650,
    rating: 4.8,
    reviewsCount: 184,
    badge: '100% Pure',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g', price: 520, originalPrice: 650, discountPercent: 20 },
      { weight: '500g', price: 980, originalPrice: 1300, discountPercent: 24, popular: true },
      { weight: '1kg', price: 1890, originalPrice: 2600, discountPercent: 27 },
    ],
    nutrition: {
      calories: '553 kcal',
      protein: '18.2 g',
      healthyFats: '43.8 g',
      carbs: '30.1 g',
      dietaryFiber: '3.3 g',
      keyVitamins: 'Zinc, Phosphorus, Copper, Vitamin K'
    },
    harvestSeason: 'Spring Harvest (March - May)',
    grading: 'Grade W-180 Super Jumbo',
    benefits: [
      'Naturally sweet & rich in zinc for immune system support',
      'Zero added salt, preservatives, or artificial whitening agents',
      'Excellent plant protein source for active lifestyles',
      'Steam-processed to retain fresh natural moisture'
    ],
    reviews: [
      {
        id: 'r-cashew-1',
        author: 'Vikramaditya Rao',
        location: 'Mumbai, Maharashtra',
        rating: 5,
        date: '3 days ago',
        verifiedBuyer: true,
        title: 'Massive jumbo size W-180 cashews from Konkan!',
        comment: 'These are genuinely the largest whole cashews I have ever seen. Perfectly creamy, zero broken pieces, and authentic natural sweetness from Sindhudurg. Ideal for gifting and festive sweets.',
        likes: 24
      },
      {
        id: 'r-cashew-2',
        author: 'Meenakshi Iyer',
        location: 'Pune, Maharashtra',
        rating: 5,
        date: '1 week ago',
        verifiedBuyer: true,
        title: 'Unbleached and intensely buttery',
        comment: 'You can taste the purity immediately. No chemical odor or chalkiness. The 1kg vacuum tin maintains unmatched freshness.',
        likes: 18
      },
      {
        id: 'r-cashew-3',
        author: 'Rajesh K. Chawla',
        location: 'Bengaluru, Karnataka',
        rating: 4,
        date: '2 weeks ago',
        verifiedBuyer: true,
        title: 'Superb quality and rapid express shipping',
        comment: 'Arrived in pristine condition. Every single cashew kernel is whole and golden-white.',
        likes: 11
      }
    ]
  },
  {
    id: 'bf-kashmiri-saffron',
    name: 'Pure Kashmiri Mongra Saffron (Kesar)',
    hindiName: 'शुद्ध कश्मीरी मोंगरा केसर',
    category: 'spices',
    origin: 'Pampore, Kashmir (GI-Tagged)',
    description: 'Certified Grade 1 Mongra Saffron stigmas. Intense floral aroma, deep crimson threads, and potent crocin color strength.',
    longDescription: 'Hand-plucked at dawn during the three-week October blooming season in Pampore, our Mongra saffron consists solely of the topmost crimson stigmas of Crocus sativus flowers. It contains the world’s highest natural levels of Safranal (aroma) and Crocin (deep golden hue). GI-tagged, lab-tested, and nitrogen-sealed in luxury glass vials.',
    image: saffronImg,
    gallery: [
      saffronImg,
      '/products/kashmiri-saffron-hTE438DvDgg.jpg'
    ],
    basePrice: 420,
    originalPrice: 550,
    rating: 5.0,
    reviewsCount: 312,
    badge: 'Organic',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '1g Vial', price: 420, originalPrice: 550, discountPercent: 23 },
      { weight: '2g Box', price: 790, originalPrice: 1100, discountPercent: 28, popular: true },
      { weight: '5g Luxury Box', price: 1850, originalPrice: 2750, discountPercent: 32 },
    ],
    nutrition: {
      calories: '310 kcal',
      protein: '11.4 g',
      healthyFats: '5.8 g',
      carbs: '65.3 g',
      dietaryFiber: '3.9 g',
      keyVitamins: 'Active Crocin > 240, Picrocrocin, Safranal'
    },
    harvestSeason: 'Winter Harvest (Late October)',
    grading: 'ISO 3632 Category 1 Certified',
    benefits: [
      'Highest natural crocin content yielding radiant amber-gold infusions',
      'Proven mood-elevating and skin-radiance enhancing botanical properties',
      'Traditional essential for biryanis, kheer, thandai, and ayurvedic golden milk',
      'Authentic GI tagged Pampore origin guarantee'
    ]
  },
  {
    id: 'bf-snow-walnut-kernels',
    name: 'Kashmiri Snow Walnut Kernels (Akhrot Giri)',
    hindiName: 'कश्मीरी अखरोट गिरी (एक्स्ट्रा लाइट)',
    category: 'dry-fruits',
    origin: 'Kupwara High Valleys, Kashmir',
    description: 'Extra-light, quarter & half-butterfly walnut kernels with crisp buttery crunch and rich Plant Omega-3 (ALA).',
    longDescription: 'Grown on century-old wild walnut trees across Kupwara in Kashmir, our walnuts are organically nurtured without synthetic sprays. Crushed manually by artisan peelers to preserve intact whole butterfly halves. Naturally low in moisture and bursting with alpha-linolenic acid, supporting neurological function and cardiovascular wellness.',
    image: walnutImg,
    gallery: [
      walnutImg,
      '/products/walnuts-snow-halves.jpg',
      '/products/kashmiri-walnuts.jpg'
    ],
    basePrice: 480,
    originalPrice: 620,
    rating: 4.8,
    reviewsCount: 142,
    badge: 'Farm Fresh',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g', price: 480, originalPrice: 620, discountPercent: 22 },
      { weight: '500g', price: 890, originalPrice: 1240, discountPercent: 28, popular: true },
      { weight: '1kg', price: 1720, originalPrice: 2480, discountPercent: 30 },
    ],
    nutrition: {
      calories: '654 kcal',
      protein: '15.2 g',
      healthyFats: '65.2 g',
      carbs: '13.7 g',
      dietaryFiber: '6.7 g',
      keyVitamins: 'Omega-3 ALA (9.08g), Folate, Melatonin'
    },
    harvestSeason: 'Autumn (September - October)',
    grading: 'Extra Light Halves & Quarters',
    benefits: [
      'Rich in Plant Omega-3 for heart health and cognitive function',
      'Contains natural melatonin for improved sleep cycles',
      'Never chemically bleached; 100% natural ivory-cream tone',
      'Cold-flushed packing prevents rancidity and preserves freshness'
    ]
  },
  {
    id: 'bf-green-cardamom',
    name: 'Idukki Bold Green Cardamom (Elaichi 8mm+)',
    hindiName: 'इलायची हरी बोल्ड 8mm+',
    category: 'spices',
    origin: 'Cardamom Hills, Idukki, Kerala',
    description: 'Hand-graded 8mm+ bold green pods brimming with aromatic essential oils and sweet camphor freshness.',
    longDescription: 'Cultivated amidst the misty rainforest canopy of the Western Ghats in Idukki, Kerala. Each pod is carefully harvested at peak maturity and gently heat-cured in traditional wood-fired dryers within hours of picking. The pods remain vibrant green, densely packed with dark aromatic seeds containing over 8% natural essential oils.',
    image: cardamomImg,
    gallery: [
      cardamomImg,
      '/products/indian-green-cardamom-pods.jpg',
      '/products/indian-green-cardamom-spoon.jpg',
      '/products/indian-green-cardamom-pile.jpg'
    ],
    basePrice: 460,
    originalPrice: 590,
    rating: 4.9,
    reviewsCount: 167,
    badge: 'Best Seller',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '100g', price: 460, originalPrice: 590, discountPercent: 22 },
      { weight: '250g', price: 1050, originalPrice: 1475, discountPercent: 28, popular: true },
      { weight: '500g', price: 1980, originalPrice: 2950, discountPercent: 32 },
    ],
    nutrition: {
      calories: '311 kcal',
      protein: '10.8 g',
      healthyFats: '6.7 g',
      carbs: '68.5 g',
      dietaryFiber: '28.0 g',
      keyVitamins: 'Essential Cineole, Terpinyl Acetate, Manganese'
    },
    harvestSeason: 'Monsoon Harvest (August - November)',
    grading: 'Bold 8mm+ Royal Green Grade',
    benefits: [
      'Superior 8mm+ pod diameter full of essential oil-rich black seeds',
      'Aids digestion, calms acidity, and serves as an authentic natural breath freshener',
      'Essential signature aroma for Royal Masala Chai and Mughlai delicacies',
      'Sun-shielded packaging protects natural chlorophyll color'
    ]
  },
  {
    id: 'bf-roasted-salted-pistachios',
    name: 'Iranian Jumbo Pistachios (Pista)',
    hindiName: 'ईरानी रोस्टेड पिस्ता (नमकीन)',
    category: 'dry-fruits',
    origin: 'Kerman Valley Orchards',
    description: 'Slow-roasted with Himalayan pink salt. Naturally open shells with bright green kernels and rich nutty flavor.',
    longDescription: 'Authentic Akbari jumbo-grade pistachios with naturally burst shells. Lightly slow-roasted with pure micro-ground Himalayan rock salt without oil or synthetic flavorings. Offers a satisfying snap, emerald-green core, and a dense nutritional profile full of lutein, potassium, and amino acids.',
    image: pistachioImg,
    gallery: [
      pistachioImg,
      '/products/pistachios-jumbo-bowl.jpg',
      '/products/pistachios-jumbo-pile.jpg'
    ],
    basePrice: 490,
    originalPrice: 650,
    rating: 4.8,
    reviewsCount: 195,
    badge: '100% Pure',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g', price: 490, originalPrice: 650, discountPercent: 24 },
      { weight: '500g', price: 920, originalPrice: 1300, discountPercent: 29, popular: true },
      { weight: '1kg', price: 1780, originalPrice: 2600, discountPercent: 31 },
    ],
    nutrition: {
      calories: '562 kcal',
      protein: '20.2 g',
      healthyFats: '45.3 g',
      carbs: '27.5 g',
      dietaryFiber: '10.3 g',
      keyVitamins: 'Vitamin B6, Potassium, Lutein & Zeaxanthin'
    },
    harvestSeason: 'September Harvest',
    grading: 'Akbari Jumbo Natural In-Shell',
    benefits: [
      'Himalayan pink salt seasoning enhances natural buttery taste',
      'High in lutein & zeaxanthin for optical wellness and retina protection',
      'Natural protein snack with zero palm oil or additives',
      'Clean cracking shells with 99%+ natural opening rate'
    ]
  },
  {
    id: 'bf-medjool-royal-dates',
    name: 'Jordan Valley Royal Medjool Dates',
    hindiName: 'रॉयल मेडजूल खजूर',
    category: 'dates-exotics',
    origin: 'Jordan River Valley',
    description: 'Jumbo succulent Medjool dates with caramel-like sweetness, soft tender flesh, and zero added sugar.',
    longDescription: 'Known as the Fruit of Kings, our Medjool dates are grown in the mineral-rich sun-drenched Jordan River Valley. Harvested at optimal softness, each date delivers a velvety caramel flavor that melts on the palate. A 100% natural, unrefined energy source rich in potassium and dietary fiber.',
    image: medjoolDatesImg,
    gallery: [
      medjoolDatesImg,
      '/products/medjool-dates-plump.jpg',
      '/products/medjool-dates-tray.jpg'
    ],
    basePrice: 560,
    originalPrice: 700,
    rating: 4.9,
    reviewsCount: 153,
    badge: 'Organic',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '500g', price: 560, originalPrice: 700, discountPercent: 20 },
      { weight: '1kg', price: 1080, originalPrice: 1400, discountPercent: 22, popular: true },
    ],
    nutrition: {
      calories: '277 kcal',
      protein: '1.8 g',
      healthyFats: '0.2 g',
      carbs: '75.0 g',
      dietaryFiber: '6.7 g',
      keyVitamins: 'Potassium (20% RDA), Magnesium, Iron'
    },
    harvestSeason: 'Autumn Harvest (October)',
    grading: 'Jumbo Premium Hand-Sorted',
    benefits: [
      'Nature’s unrefined energy powerhouse without added glucose syrups',
      'High soluble fiber aids gut health and regulates glycemic response',
      'Luscious caramel chewiness makes them an ideal pre-workout fuel',
      'Packed with essential electrolytes: Potassium and Magnesium'
    ]
  },
  {
    id: 'bf-black-pepper-tellicherry',
    name: 'Malabar Tellicherry Garbled Extra Bold Pepper (TGSEB)',
    hindiName: 'काली मिर्च टेलीचेरी एक्स्ट्रा बोल्ड',
    category: 'spices',
    origin: 'Wayanad High Ranges, Kerala',
    description: 'The highest global grade of black pepper. 4.75mm+ berries with intense pungency and citrus-woody undertones.',
    longDescription: 'Tellicherry Garbled Special Extra Bold (TGSEB) is the most sought-after black pepper globally. Hand-harvested from vine-ripened berries in Wayanad, sun-dried on bamboo mats, and graded for berry diameter. The high concentration of piperine delivers an invigorating heat balanced by complex woodsy, citrus floral notes.',
    image: blackPepperImg,
    gallery: [
      blackPepperImg,
      '/products/black-pepper-peppercorns.jpg',
      '/products/black-pepper-scoop.jpg'
    ],
    basePrice: 280,
    originalPrice: 380,
    rating: 4.8,
    reviewsCount: 96,
    badge: '100% Pure',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '150g', price: 280, originalPrice: 380, discountPercent: 26 },
      { weight: '300g', price: 510, originalPrice: 760, discountPercent: 32, popular: true },
      { weight: '1kg', price: 1450, originalPrice: 2100, discountPercent: 30 },
    ],
    nutrition: {
      calories: '251 kcal',
      protein: '10.4 g',
      healthyFats: '3.3 g',
      carbs: '64.0 g',
      dietaryFiber: '25.3 g',
      keyVitamins: 'High Piperine Content > 5.5%, Vitamin K, Iron'
    },
    harvestSeason: 'Winter (January - March)',
    grading: 'Grade TGSEB (Tellicherry Extra Bold)',
    benefits: [
      'Exceptional piperine enhances curcumin absorption by up to 2000%',
      'Single-estate unblended whole berries with intense aroma',
      'Free from spent berries, mineral oil, or synthetic polishing',
      'Whole peppercorns preserve volatile essential oils until freshly crushed'
    ]
  },
  {
    id: 'bf-superfood-chia-pumpkin-seeds',
    name: 'Organic Superfood Seeds Trio (Chia, Pumpkin, Flax)',
    hindiName: 'सुपरफूड सीड्स ट्रियो (चिया, कद्दू, अलसी)',
    category: 'seeds-berries',
    origin: 'Malwa Organic Farms, MP',
    description: 'Raw triple-cleaned blend of AAA-Grade Raw Pumpkin Seeds, Organic Black Chia, and Golden Flax Seeds.',
    longDescription: 'Specially crafted for daily vitality, smoothies, and breakfast bowls. Our trio blend combines cold-cleaned raw pumpkin seeds (loaded with zinc and plant sterols), antioxidant-dense organic black chia seeds, and roasted golden flax seeds rich in dietary lignans.',
    image: superfoodSeedsImg,
    gallery: [
      superfoodSeedsImg,
      '/products/pumpkin-seeds-raw.jpg',
      '/products/pumpkin-seeds.jpg'
    ],
    basePrice: 320,
    originalPrice: 420,
    rating: 4.9,
    reviewsCount: 118,
    badge: 'Organic',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g Jar', price: 320, originalPrice: 420, discountPercent: 23 },
      { weight: '500g Jar', price: 590, originalPrice: 840, discountPercent: 29, popular: true },
      { weight: '1kg Pouch', price: 1050, originalPrice: 1550, discountPercent: 32 },
    ],
    nutrition: {
      calories: '534 kcal',
      protein: '24.5 g',
      healthyFats: '42.0 g',
      carbs: '22.0 g',
      dietaryFiber: '19.8 g',
      keyVitamins: 'Zinc, Magnesium, Plant Omega-3, Lignans'
    },
    harvestSeason: 'Spring Harvest',
    grading: 'Triple-Cleaned Certified Organic',
    benefits: [
      'Complete plant-based amino acid profile and high soluble fiber',
      'Provides over 60% daily recommended Zinc for vital cellular immunity',
      'Perfect topping for yogurts, oats, artisanal breads, and salads',
      'Unsalted, unroasted, and raw for maximum enzymatic bioavailability'
    ]
  },
  {
    id: 'bf-wild-dried-cranberries',
    name: 'Slow-Dried Whole Wild Cranberries',
    hindiName: 'वाइल्ड ड्राइड क्रैनबेरी',
    category: 'seeds-berries',
    origin: 'Highland Farms',
    description: 'Plump, tart-sweet whole dried cranberries infused with natural apple juice concentrate. Zero refined sugars.',
    longDescription: 'Bursting with proanthocyanidins and vitamin C, our wild whole cranberries are slowly dehydrated to preserve their ruby translucence and juicy chew. Made without high-fructose corn syrups or artificial food dyes.',
    image: cranberriesImg,
    gallery: [
      cranberriesImg,
      '/products/wild-cranberries-bowl.jpg'
    ],
    basePrice: 340,
    originalPrice: 450,
    rating: 4.8,
    reviewsCount: 88,
    badge: 'Farm Fresh',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g', price: 340, originalPrice: 450, discountPercent: 24 },
      { weight: '500g', price: 630, originalPrice: 900, discountPercent: 30, popular: true },
      { weight: '1kg', price: 1190, originalPrice: 1750, discountPercent: 32 },
    ],
    nutrition: {
      calories: '308 kcal',
      protein: '0.4 g',
      healthyFats: '1.4 g',
      carbs: '82.0 g',
      dietaryFiber: '5.7 g',
      keyVitamins: 'Vitamin C, Proanthocyanidins (PACs), Vitamin E'
    },
    harvestSeason: 'Autumn Harvest',
    grading: 'Whole Berry Premium Grade',
    benefits: [
      'Natural PAC antioxidants support urinary tract and kidney health',
      'Sweetened naturally with apple juice instead of refined cane sugars',
      'Vibrant ruby red color from natural anthocyanin flavonoids',
      'Great for trail mixes, baking, and healthy midnight snacking'
    ]
  },
  {
    id: 'bf-royal-varanasi-gift-trunk',
    name: 'Varanasi Royal Brass & Velvet Heritage Hamper',
    hindiName: 'वाराणसी शाही पीतल और मखमली उपहार बॉक्स',
    category: 'gifting',
    origin: 'Artisan Workshop, Varanasi',
    description: 'An opulent handcrafted brass-filigree and emerald velvet trunk filled with 4 jars of our finest harvests.',
    longDescription: 'Curated specifically for distinguished celebrations, Diwali, and royal wedding gifting. The bespoke trunk is handmade by traditional brass artisans of Varanasi, lined with forest green velvet, and contains 4 air-tight gold-embossed glass jars: Kashmiri Mamra Almonds (200g), W-180 Jumbo Cashews (200g), Roasted Salted Iranian Pistachios (200g), and Kupwara Snow Walnuts (200g), accompanied by a 1g pure Kashmiri Mongra Saffron vial and an authentic brass diya.',
    image: royalGiftHamperImg,
    gallery: [
      royalGiftHamperImg,
      '/products/royal-gift-trunk-luxury.jpg'
    ],
    basePrice: 2850,
    originalPrice: 3600,
    rating: 5.0,
    reviewsCount: 94,
    badge: 'Festive Pick',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '4 Jars Royal Box (800g + Saffron)', price: 2850, originalPrice: 3600, discountPercent: 20, popular: true },
      { weight: '6 Jars Imperial Trunk (1.2kg + Saffron & Honey)', price: 4200, originalPrice: 5500, discountPercent: 23 },
    ],
    nutrition: {
      calories: 'Assorted Premium Nuts',
      protein: '19.5 g avg',
      healthyFats: '51.0 g avg',
      carbs: '22.0 g avg',
      dietaryFiber: '8.5 g avg',
      keyVitamins: 'Premium Dry Fruit Assortment + Grade 1 Saffron'
    },
    harvestSeason: 'Limited Artisan Edition',
    grading: 'Handcrafted Heritage Collectible Box',
    benefits: [
      'Handcrafted keepsake brass filigree box reusable for jewelry & decor',
      'Includes custom personalized calligraphy greeting card with wax seal',
      'Contains only the highest grades: Mamra Almonds, W180 Cashews, Pistas, Walnuts',
      'Securely packaged in heavy shockproof insulated master carton'
    ]
  },
  {
    id: 'bf-afghan-green-raisins',
    name: 'Afghan Shahi Kishmish (Long Green Raisins)',
    hindiName: 'अफगानी शाही किशमिश (लंबी हरी)',
    category: 'dry-fruits',
    origin: 'Kandahar Valley',
    description: 'Slender, naturally sun-cured long green raisins with refreshing floral sweetness and tender skin.',
    longDescription: 'Grown on ancient sun-drenched vineyard terraces of Kandahar. These green raisins are dried slowly in traditional shade-drying adobe towers (Kishmish Khana), which preserves their pale green jade hue and prevents carmelization. Rich in natural iron, potassium, and antioxidants.',
    image: greenRaisinsImg,
    gallery: [
      greenRaisinsImg,
      '/products/green-raisins-close.jpg'
    ],
    basePrice: 260,
    originalPrice: 350,
    rating: 4.7,
    reviewsCount: 79,
    badge: '100% Pure',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g', price: 260, originalPrice: 350, discountPercent: 25 },
      { weight: '500g', price: 490, originalPrice: 700, discountPercent: 30, popular: true },
      { weight: '1kg', price: 920, originalPrice: 1350, discountPercent: 31 },
    ],
    nutrition: {
      calories: '299 kcal',
      protein: '3.1 g',
      healthyFats: '0.5 g',
      carbs: '79.2 g',
      dietaryFiber: '3.7 g',
      keyVitamins: 'Iron (15% RDA), Copper, Potassium, Boron'
    },
    harvestSeason: 'Autumn Harvest',
    grading: 'Shahi Extra Long Grade 1',
    benefits: [
      'High natural bioavailable iron assists hemoglobin synthesis',
      'Shade-dried without sulfur dioxide or chemical glazes',
      'Delicate, non-sticky bite with sweet honey notes',
      'Naturally aids healthy digestion and prevents acidity'
    ]
  },
  {
    id: 'bf-afghan-black-raisins',
    name: 'Afghani Royal Black Raisins (Kala Kishmish)',
    hindiName: 'अफगानी शाही काली किशमिश (बीजरहित)',
    category: 'dry-fruits',
    origin: 'Kandahar Valley, Afghanistan',
    description: 'Jumbo seedless sun-dried black raisins with rich anthocyanins, natural fruit sweetness, and high iron content.',
    longDescription: 'Directly sourced from the celebrated mountain vineyards of Kandahar, our Afghani Black Raisins (Kala Kishmish) are sun-cured naturally on elevated slates to lock in rich plant iron, potassium, and anthocyanin antioxidants. Plump, juicy, and naturally sweet without added sugars, mineral oil coatings, or sulfur dioxide.',
    image: blackRaisinsImg,
    gallery: [
      blackRaisinsImg,
      '/products/green-raisins-close.jpg'
    ],
    basePrice: 280,
    originalPrice: 380,
    rating: 4.9,
    reviewsCount: 112,
    badge: '100% Pure',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g', price: 280, originalPrice: 380, discountPercent: 26 },
      { weight: '500g', price: 530, originalPrice: 760, discountPercent: 30, popular: true },
      { weight: '1kg', price: 990, originalPrice: 1520, discountPercent: 35 },
    ],
    nutrition: {
      calories: '299 kcal',
      protein: '3.3 g',
      healthyFats: '0.5 g',
      carbs: '79.2 g',
      dietaryFiber: '4.5 g',
      keyVitamins: 'Iron (23% RDA), Anthocyanins, Potassium, Vitamin C'
    },
    harvestSeason: 'Autumn Harvest (September - October)',
    grading: 'Jumbo Seedless Grade-A Export Quality',
    benefits: [
      'Exceptional source of bioavailable plant iron boosting hemoglobin and daily stamina',
      'High anthocyanin and polyphenol antioxidants supporting radiant skin & blood purification',
      'Natural dietary fiber promoting smooth digestive regularity when soaked overnight',
      'Unsulfured, unpolished, and free from chemical glazes or preservatives'
    ]
  },
  {
    id: 'bf-handpicked-whole-cloves',
    name: 'Handpicked Royal Whole Cloves (Laung)',
    hindiName: 'शाही साबुत लौंग (हाथ से चुनी गई)',
    category: 'spices',
    origin: 'Idukki Highlands, Kerala',
    description: '100% whole handpicked cloves with intact round heads (crowns) and rich natural eugenol essential oil.',
    longDescription: 'Harvested from the heritage spice estates of Idukki in Kerala, our whole cloves are hand-sorted to ensure intact round flower crowns and uniform dark brown hues. Naturally sun-cured to lock in over 15% volatile eugenol essential oils, imparting a deep warm pungency and authentic aroma for gourmet culinary dishes, immunity teas, and Ayurvedic care.',
    image: clovesWholeImg,
    gallery: [
      clovesWholeImg,
      '/products/cloves-whole.jpg'
    ],
    basePrice: 325,
    originalPrice: 399,
    rating: 4.9,
    reviewsCount: 114,
    badge: '100% Pure',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g', price: 325, originalPrice: 399, discountPercent: 19, popular: true },
      { weight: '500g', price: 740, originalPrice: 990, discountPercent: 25 },
      { weight: '1kg', price: 1390, originalPrice: 1900, discountPercent: 27 },
    ],
    nutrition: {
      calories: '274 kcal',
      protein: '6.0 g',
      healthyFats: '13.0 g',
      carbs: '65.5 g',
      dietaryFiber: '33.9 g',
      keyVitamins: 'High Eugenol Essential Oil, Manganese (126% DV), Vitamin K'
    },
    harvestSeason: 'Winter Harvest (December - February)',
    grading: 'Grade-A Bold Hand-Sorted (With Crown)',
    benefits: [
      'Over 15% natural eugenol content providing potent oral & antioxidant benefits',
      'Rich in vital manganese supporting bone density and enzyme function',
      '100% whole cloves with intact round crowns, never stripped or depleted',
      'Free from spent cloves, mineral oil glazing, or artificial colorants'
    ],
    reviews: [
      {
        id: 'r-clove-1',
        author: 'Pandit Ramakant Shastri',
        location: 'Varanasi, UP',
        rating: 5,
        date: '1 day ago',
        verifiedBuyer: true,
        title: 'Intact crowns and incredible aroma',
        comment: 'Every single clove has its round head intact. The moment you open the pouch, the rich warm aroma fills the room. Genuine Kerala harvest.',
        likes: 16
      }
    ]
  },
  {
    id: 'bf-ceylon-cinnamon-sticks',
    name: 'Ceylon True Cinnamon Quills (Dalchini)',
    hindiName: 'सीलोन असली दालचीनी',
    category: 'spices',
    origin: 'Southern Coastal Highlands, Ceylon',
    description: 'Authentic multi-layered Ceylon cinnamon quills with subtle floral sweetness, fragile texture, and ultra-low coumarin.',
    longDescription: 'Directly sourced from the lush coastal estates of Sri Lanka, our pure Ceylon Cinnamon is crafted by peeling paper-thin inner bark and hand-rolling it into delicate fragrant quills. Unlike harsh Cassia bark, Ceylon cinnamon has a gentle, sweet citrus aroma with negligible coumarin content, making it safe for daily health tonics, teas, and aromatic baking.',
    image: cinnamonQuillsImg,
    gallery: [
      cinnamonQuillsImg
    ],
    basePrice: 290,
    originalPrice: 380,
    rating: 4.9,
    reviewsCount: 82,
    badge: 'Organic',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '100g', price: 290, originalPrice: 380, discountPercent: 24, popular: true },
      { weight: '250g', price: 680, originalPrice: 950, discountPercent: 28 },
      { weight: '500g', price: 1290, originalPrice: 1900, discountPercent: 32 },
    ],
    nutrition: {
      calories: '247 kcal',
      protein: '4.0 g',
      healthyFats: '1.2 g',
      carbs: '80.6 g',
      dietaryFiber: '53.1 g',
      keyVitamins: 'Cinnamaldehyde, Calcium (100% RDA), Iron, Manganese'
    },
    harvestSeason: 'Spring Harvest',
    grading: 'Alba / Continental Grade Delicate Quills',
    benefits: [
      'Extremely low coumarin levels safe for daily golden milk and metabolism teas',
      'Supports healthy blood sugar balance and digestive wellness',
      'Sweet, delicate woody-citrus bouquet without bitter astringency',
      'Triple vacuum-sealed to preserve natural essential cinnamaldehyde oils'
    ]
  },
  {
    id: 'bf-star-anise-whole',
    name: 'Whole Star Anise Pods (Chakra Phool)',
    hindiName: 'शाही साबुत चक्र फूल',
    category: 'spices',
    origin: 'Lang Son Highlands',
    description: 'Intact 8-pointed star anise pods with sweet licorice aroma, rich in natural shikimic acid.',
    longDescription: 'Sun-dried whole star anise pods handpicked at peak autumn ripeness. Each pod features pristine star geometry with glossy seeds inside each carpel, providing a rich, warm anethole aroma essential for royal biryanis, garam masala blends, and soothing herbal infusions.',
    image: starAniseImg,
    gallery: [
      starAniseImg
    ],
    basePrice: 240,
    originalPrice: 320,
    rating: 4.8,
    reviewsCount: 64,
    badge: '100% Pure',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '100g', price: 240, originalPrice: 320, discountPercent: 25 },
      { weight: '250g', price: 540, originalPrice: 750, discountPercent: 28, popular: true },
      { weight: '500g', price: 990, originalPrice: 1450, discountPercent: 31 },
    ],
    nutrition: {
      calories: '337 kcal',
      protein: '17.6 g',
      healthyFats: '15.9 g',
      carbs: '50.0 g',
      dietaryFiber: '14.6 g',
      keyVitamins: 'Shikimic Acid, Anethole, Iron, Linalool'
    },
    harvestSeason: 'Autumn Harvest (October)',
    grading: 'Grade-A Whole Star Intact Pods',
    benefits: [
      'High natural concentration of shikimic acid boosting cellular immunity',
      'Intact whole 8-star symmetry without broken debris or stems',
      'Signature gourmet aroma for Awadhi biryanis, pho, and mulled spices',
      'Aids digestion and calms post-meal bloating'
    ]
  },
  {
    id: 'bf-turkish-dried-figs',
    name: 'Turkish Royal Dried Figs (Shahi Anjeer)',
    hindiName: 'तुर्की शाही सूखा अंजीर',
    category: 'dates-exotics',
    origin: 'Aydin Valley, Turkey',
    description: 'Naturally sun-ripened soft dried figs with crunchy seeds and honeyed caramel sweetness. Rich in dietary fiber and calcium.',
    longDescription: 'Grown on sun-drenched terraced mountain slopes in the Aydin valley. Our whole figs are allowed to dry naturally on the tree branches under gentle Mediterranean sunlight. They develop a tender, pliable skin, honeyed syrup core, and fine seed crunch with zero artificial sulfur or sugar coatings.',
    image: turkishFigsImg,
    gallery: [
      turkishFigsImg
    ],
    basePrice: 480,
    originalPrice: 650,
    rating: 4.9,
    reviewsCount: 175,
    badge: 'Best Seller',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g', price: 480, originalPrice: 650, discountPercent: 26 },
      { weight: '500g', price: 920, originalPrice: 1300, discountPercent: 29, popular: true },
      { weight: '1kg', price: 1790, originalPrice: 2600, discountPercent: 31 },
    ],
    nutrition: {
      calories: '249 kcal',
      protein: '3.3 g',
      healthyFats: '0.9 g',
      carbs: '63.9 g',
      dietaryFiber: '9.8 g',
      keyVitamins: 'Calcium (16% RDA), Potassium, Magnesium, Iron'
    },
    harvestSeason: 'Late Summer Harvest (August - September)',
    grading: 'Garland / Protoben Jumbo Size No. 1',
    benefits: [
      'Unsurpassed source of soluble prebiotic fiber supporting gut health',
      'High plant calcium and magnesium supporting bone density',
      'Natural honey sweetness without added syrups, chemicals, or sulfur',
      'Perfect for overnight soaking in warm water or milk'
    ]
  },
  {
    id: 'bf-wild-dried-apricots',
    name: 'Afghani Wild Sun-Dried Apricots (Khubani)',
    hindiName: 'अफगानी जंगली सूखी खुबानी',
    category: 'dates-exotics',
    origin: 'Bamyan Valley Orchards',
    description: 'Unsulfured sun-dried wild apricots with natural deep golden-amber tone, chewy texture, and high natural Vitamin A.',
    longDescription: 'Hand-picked in the clean mountain valleys of Afghanistan, these wild apricots are sun-cured naturally on mountain slate without chemical sulfur dioxide. They retain their natural tart-sweet balance, earthy aroma, and supreme concentration of beta-carotene and dietary potassium.',
    image: apricotsImg,
    gallery: [
      apricotsImg
    ],
    basePrice: 390,
    originalPrice: 520,
    rating: 4.8,
    reviewsCount: 92,
    badge: 'Organic',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g', price: 390, originalPrice: 520, discountPercent: 25 },
      { weight: '500g', price: 740, originalPrice: 1040, discountPercent: 28, popular: true },
      { weight: '1kg', price: 1420, originalPrice: 2080, discountPercent: 31 },
    ],
    nutrition: {
      calories: '241 kcal',
      protein: '3.4 g',
      healthyFats: '0.5 g',
      carbs: '62.6 g',
      dietaryFiber: '7.3 g',
      keyVitamins: 'Vitamin A (Beta-Carotene), Potassium, Vitamin E, Iron'
    },
    harvestSeason: 'Summer (July - August)',
    grading: 'Unsulfured Natural Wild Grade',
    benefits: [
      '100% Unsulfured, zero preservatives or artificial brighteners',
      'Rich in beta-carotene supporting eye health and skin vibrancy',
      'High potassium helping regulate blood pressure naturally',
      'Delicious chewy texture and wholesome snack for all ages'
    ]
  },
  {
    id: 'bf-raw-pumpkin-seeds',
    name: 'Raw AAA+ Pumpkin Seeds (Kaddu Beej)',
    hindiName: 'कद्दू के बीज (प्रीमियम AAA+)',
    category: 'seeds-berries',
    origin: 'Malwa Organic Belt, MP',
    description: 'Jumbo dark-green raw pumpkin seeds, triple-cleaned and loaded with natural zinc, magnesium, and plant sterols.',
    longDescription: 'Sourced from certified organic grower co-operatives in the Malwa plateau. Our raw pumpkin seeds (pepitas) are hull-less, plump, and emerald green. Cold-cleaned with air separators and nitrogen-sealed raw to ensure the delicate essential fatty acids and natural zinc enzymes stay fully bioavailable.',
    image: pumpkinSeedsImg,
    gallery: [
      pumpkinSeedsImg,
      '/products/pumpkin-seeds-raw.jpg'
    ],
    basePrice: 290,
    originalPrice: 390,
    rating: 4.8,
    reviewsCount: 105,
    badge: 'Farm Fresh',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g', price: 290, originalPrice: 390, discountPercent: 25 },
      { weight: '500g', price: 540, originalPrice: 780, discountPercent: 30, popular: true },
      { weight: '1kg', price: 990, originalPrice: 1500, discountPercent: 34 },
    ],
    nutrition: {
      calories: '559 kcal',
      protein: '30.2 g',
      healthyFats: '49.0 g',
      carbs: '10.7 g',
      dietaryFiber: '6.0 g',
      keyVitamins: 'Zinc (70% RDA), Magnesium (150% RDA), Plant Iron'
    },
    harvestSeason: 'Autumn Harvest',
    grading: 'AAA+ Jumbo European-Standard Dark Green',
    benefits: [
      'Highest natural food source of bioavailable Zinc & Magnesium',
      'Supports deep restorative sleep via natural tryptophan amino acids',
      'Supports prostate, cardiac, and metabolic vitality',
      'Raw, unsalted, non-GMO, and zero pesticide residue'
    ]
  },
  {
    id: 'bf-organic-chia-seeds',
    name: 'Raw Organic Black Chia Seeds (Superfood)',
    hindiName: 'ऑर्गेनिक ब्लैक चिया सीड्स',
    category: 'seeds-berries',
    origin: 'Certified Organic Foothills',
    description: '100% Raw whole black chia seeds packed with soluble mucilage fiber, calcium, and Plant Omega-3 ALA.',
    longDescription: 'Ancient powerhouse Aztec superfood seeds cultivated organically in virgin soils. When hydrated in water, milk, or fresh fruit juice, each chia seed forms a protective soluble fiber gel that keeps you hydrated and feeling full for hours while steadily delivering omega-3 fatty acids and complete plant proteins.',
    image: chiaSeedsImg,
    gallery: [
      chiaSeedsImg
    ],
    basePrice: 260,
    originalPrice: 360,
    rating: 4.9,
    reviewsCount: 138,
    badge: 'Organic',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '250g', price: 260, originalPrice: 360, discountPercent: 27 },
      { weight: '500g', price: 490, originalPrice: 720, discountPercent: 31, popular: true },
      { weight: '1kg', price: 890, originalPrice: 1400, discountPercent: 36 },
    ],
    nutrition: {
      calories: '486 kcal',
      protein: '16.5 g',
      healthyFats: '30.7 g',
      carbs: '42.1 g',
      dietaryFiber: '34.4 g',
      keyVitamins: 'Omega-3 ALA (17.8g), Calcium (63% DV), Phosphorus'
    },
    harvestSeason: 'Spring Harvest',
    grading: '99.9% Purity Certified Organic',
    benefits: [
      'Unmatched plant-based Omega-3 ALA content for heart & brain health',
      'High soluble fiber creates long-lasting satiety and digestive regularity',
      '5x more calcium than milk per 100g for bone strength',
      'Triple-winnowed for 99.9% clean purity with zero dust'
    ]
  },
  {
    id: 'bf-jumbo-macadamia-nuts',
    name: 'Royal Roasted Macadamia Nuts',
    hindiName: 'शाही रोस्टेड मैकाडामिया नट्स',
    category: 'dry-fruits',
    origin: 'Highland Volcanic Soil Estates',
    description: 'Creamy, slow-roasted whole jumbo macadamia nut kernels with luxurious velvety texture and healthy monounsaturated fats.',
    longDescription: 'Celebrated as one of the most decadent tree nuts on earth. Our whole jumbo macadamias are carefully cracked, dry-roasted at low temperatures with a whisper of pure sea salt to elevate their silky buttery sweetness and smooth crunch.',
    image: macadamiaImg,
    gallery: [
      macadamiaImg
    ],
    basePrice: 890,
    originalPrice: 1199,
    rating: 4.9,
    reviewsCount: 76,
    badge: '100% Pure',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '200g Jar', price: 890, originalPrice: 1199, discountPercent: 25, popular: true },
      { weight: '400g Jar', price: 1690, originalPrice: 2399, discountPercent: 29 },
      { weight: '800g Box', price: 3200, originalPrice: 4799, discountPercent: 33 }
    ],
    nutrition: {
      calories: '718 kcal',
      protein: '7.9 g',
      healthyFats: '75.8 g',
      carbs: '13.8 g',
      dietaryFiber: '8.6 g',
      keyVitamins: 'Manganese (180% RDA), Thiamine (B1), Magnesium'
    },
    harvestSeason: 'Autumn Harvest',
    grading: 'Style 1 Super Jumbo Whole Kernels',
    benefits: [
      'Over 80% heart-healthy monounsaturated palmitoleic and oleic fats',
      'Luxurious buttery melt-in-mouth texture for gourmet snack platters',
      'Slow roasted without palm oil, additives, or artificial preservatives',
      'Packaged in air-tight nitrogen sealed glass jars'
    ]
  },
  {
    id: 'bf-shahi-festive-wooden-box',
    name: 'Shahi Festive Handcrafted Wooden Dry Fruit Box (4 Jars)',
    hindiName: 'शाही उत्सव 4-जार लकड़ी का उपहार बॉक्स',
    category: 'gifting',
    origin: 'Heritage Artisan Craft, Varanasi',
    description: 'Carved natural teakwood presentation box with antique brass latches, housing 4 airtight glass jars with Mamra Almonds, W-180 Cashews, Iranian Pistachios, and Kashmiri Walnuts.',
    longDescription: 'Crafted by master woodcarvers of Varanasi, this opulent gift chest blends traditional Indian artisanship with world-class dry fruit harvests. Features four 150g airtight gold-accented jars filled with Kashmiri Mamra Almonds, King Cashews W-180, Roasted Iranian Pistachios, and Kupwara Snow Walnuts, finished with a satin ribbon and custom personalized blessing card.',
    image: festiveWoodenBoxImg,
    gallery: [
      festiveWoodenBoxImg,
      '/products/royal-gift-trunk-luxury.jpg'
    ],
    basePrice: 1950,
    originalPrice: 2600,
    rating: 4.9,
    reviewsCount: 68,
    badge: 'Festive Pick',
    inStock: true,
    isOrganic: true,
    packOptions: [
      { weight: '4 Jars Premium (600g Total)', price: 1950, originalPrice: 2600, discountPercent: 25, popular: true },
      { weight: '6 Jars Grand Edition (900g Total)', price: 2850, originalPrice: 3800, discountPercent: 25 }
    ],
    nutrition: {
      calories: 'Assorted Premium Nuts',
      protein: '19.0 g avg',
      healthyFats: '50.0 g avg',
      carbs: '22.0 g avg',
      dietaryFiber: '8.0 g avg',
      keyVitamins: 'Vitamin E, Zinc, Plant Omega-3, Potassium'
    },
    harvestSeason: 'Artisan Festive Edition',
    grading: 'Handcrafted Heritage Wooden Collectible',
    benefits: [
      'Heirloom keepsake teakwood chest with traditional hand-carved motifs',
      'Airtight gold-lid glass jars ensure lingering crunch and aroma',
      'Includes complimentary personalized festive greeting card with wax seal',
      'Ideal for Diwali, wedding shagun, corporate honors, and housewarming'
    ]
  }
];

