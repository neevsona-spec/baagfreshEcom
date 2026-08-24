import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Leaf, 
  Award, 
  CheckCircle2,
  ArrowRight,
  Play,
  Pause,
  Eye,
  ShoppingBag,
  Flame,
  Star
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// High-resolution dry fruit and spice imagery
import mamraAlmondsImg from '../assets/images/regenerated_image_1787259357936.png';
import cashewMainImg from '../assets/images/regenerated_image_1786963261070.png';
import saffronImg from '../assets/images/regenerated_image_1786884474801.png';
import walnutImg from '../assets/images/regenerated_image_1786885051840.png';
import cardamomImg from '../assets/images/regenerated_image_1786885263326.png';
import pistachioImg from '../assets/images/regenerated_image_1786885268290.png';
import medjoolDatesImg from '../assets/images/regenerated_image_1786885958518.png';
import blackPepperImg from '../assets/images/regenerated_image_1786885964083.png';

export interface DryFruitSpiceShowcaseItem {
  id: string;
  name: string;
  hindiName: string;
  category: 'dry-fruits' | 'spices';
  categoryLabel: string;
  tag: string;
  origin: string;
  badge: string;
  highlight: string;
  price: number;
  weight: string;
  rating: number;
  reviewsCount: number;
  image: string;
  colorTone: string;
  aromaProfile: string;
}

const SHOWCASE_ITEMS: DryFruitSpiceShowcaseItem[] = [
  {
    id: 'mamra-almonds',
    name: 'Kashmiri Mamra Almonds',
    hindiName: 'कश्मीरी बादाम मामरा',
    category: 'dry-fruits',
    categoryLabel: '🌰 Royal Dry Fruit',
    tag: 'Single-Origin Kashmir Valley',
    origin: 'Pampore & Pulwama, Kashmir',
    badge: '100% Cold-Cracked • >50% Natural Oil',
    highlight: 'Pure non-fumigated, concaved kernel rich in Vitamin E, riboflavin, and healthy lipids.',
    price: 1180,
    weight: '500g',
    rating: 4.9,
    reviewsCount: 248,
    image: mamraAlmondsImg,
    colorTone: 'from-amber-900/60 to-emerald-950/90',
    aromaProfile: 'Nutty & Rich Natural Almond Oil',
  },
  {
    id: 'kashmiri-saffron',
    name: 'GI-Tagged Pampore Mongra Saffron',
    hindiName: 'कश्मीरी मोंगरा केसर',
    category: 'spices',
    categoryLabel: '🌿 Royal Estate Spice',
    tag: 'GI-Tagged Pampore Plateau',
    origin: 'Pampore Highlands, Kashmir',
    badge: 'Grade A1 Super Negin • 100% Pure Stigmas',
    highlight: 'Sun-cured deep crimson filaments with highest natural crocin for intense color, aroma, and vitality.',
    price: 650,
    weight: '1g Vial',
    rating: 5.0,
    reviewsCount: 312,
    image: saffronImg,
    colorTone: 'from-red-950/70 to-emerald-950/90',
    aromaProfile: 'Floral, Honeyed & Earthy Camphor',
  },
  {
    id: 'king-cashews-w180',
    name: 'Royal King Cashews W-180',
    hindiName: 'रॉयल किंग काजू W-180',
    category: 'dry-fruits',
    categoryLabel: '🌰 Royal Dry Fruit',
    tag: 'Konkan Coastline Harvest',
    origin: 'Sindhudurg Orchards, Konkan',
    badge: 'Grade W-180 Jumbo • The King of Cashews',
    highlight: 'Naturally large whole white kernels with buttery sweet crunch, zero preservatives, and unroasted purity.',
    price: 890,
    weight: '500g',
    rating: 4.8,
    reviewsCount: 184,
    image: cashewMainImg,
    colorTone: 'from-amber-950/60 to-emerald-950/90',
    aromaProfile: 'Creamy, Sweet & Freshly Cracked',
  },
  {
    id: 'green-cardamom',
    name: 'Idukki Bold Green Cardamom (8mm+)',
    hindiName: 'हरी इलायची 8mm+ बोल्ड',
    category: 'spices',
    categoryLabel: '🌿 Royal Estate Spice',
    tag: 'Western Ghats Rainforest',
    origin: 'Cardamom Hills, Idukki, Kerala',
    badge: 'Extra Bold 8mm+ Pods • High Essential Oil',
    highlight: 'Hand-picked vibrant emerald pods packed with dark resinous seeds brimming with natural pinene oils.',
    price: 520,
    weight: '100g',
    rating: 4.9,
    reviewsCount: 162,
    image: cardamomImg,
    colorTone: 'from-emerald-950/80 to-[#012d1d]/90',
    aromaProfile: 'Sweet Minty, Eucalyptus & Citrus Notes',
  },
  {
    id: 'pistachio',
    name: 'Iranian Jumbo Roasted Pistachios',
    hindiName: 'ईरानी रोस्टेड पिस्ता',
    category: 'dry-fruits',
    categoryLabel: '🌰 Royal Dry Fruit',
    tag: 'Sun-Drenched Valley',
    origin: 'Kerman Valley Orchards',
    badge: 'Akbari Jumbo • Himalayan Pink Salt Roasted',
    highlight: 'Slow-roasted with micro-ground Himalayan salt. Naturally open shells with emerald-green crisp cores.',
    price: 760,
    weight: '500g',
    rating: 4.8,
    reviewsCount: 195,
    image: pistachioImg,
    colorTone: 'from-emerald-900/60 to-emerald-950/90',
    aromaProfile: 'Warm Roasted Salt & Savory Nut Essence',
  },
  {
    id: 'black-pepper',
    name: 'Malabar Tellicherry Garbled Extra Bold Pepper',
    hindiName: 'काली मिर्च टेलीचेरी',
    category: 'spices',
    categoryLabel: '🌿 Royal Estate Spice',
    tag: 'Ancient Malabar Spice Route',
    origin: 'Wayanad High Ranges, Kerala',
    badge: 'TGSEB 4.75mm+ • The World’s Finest Black Pepper',
    highlight: 'Vine-ripened bold berries sun-cured on bamboo mats. Exceptional heat balanced by citrus-woody undertones.',
    price: 240,
    weight: '100g',
    rating: 4.9,
    reviewsCount: 142,
    image: blackPepperImg,
    colorTone: 'from-slate-900/80 to-emerald-950/90',
    aromaProfile: 'Pungent, Cedarwood & Citrus Florals',
  },
  {
    id: 'snow-walnuts',
    name: 'Kashmiri Snow Walnut Kernels',
    hindiName: 'कश्मीरी अखरोट गिरी',
    category: 'dry-fruits',
    categoryLabel: '🌰 Royal Dry Fruit',
    tag: 'High Altitude Kupwara',
    origin: 'Kupwara Orchards, Kashmir',
    badge: 'Snow White Halves • 100% Non-Bitter',
    highlight: 'Rich in plant-based Omega-3 ALA, cold-cracked to preserve intact halves with mild milky sweetness.',
    price: 680,
    weight: '500g',
    rating: 4.9,
    reviewsCount: 176,
    image: walnutImg,
    colorTone: 'from-stone-900/70 to-emerald-950/90',
    aromaProfile: 'Milky, Delicate & Subtle Woodsy',
  },
  {
    id: 'medjool-dates',
    name: 'Jordan Valley Royal Medjool Dates',
    hindiName: 'रॉयल मेडजूल खजूर',
    category: 'dry-fruits',
    categoryLabel: '🌰 Royal Dry Fruit',
    tag: 'Fruit of Kings',
    origin: 'Jordan River Valley',
    badge: 'Jumbo Size • Velvety Caramel Sweetness',
    highlight: 'Unrefined natural sweet energy, succulent tender flesh, rich in potassium, iron, and dietary fiber.',
    price: 590,
    weight: '500g',
    rating: 4.8,
    reviewsCount: 210,
    image: medjoolDatesImg,
    colorTone: 'from-amber-950/70 to-emerald-950/90',
    aromaProfile: 'Deep Toffee, Molasses & Vanilla Notes',
  },
];

export const HeroSlider: React.FC = () => {
  const { 
    setSelectedCategory, 
    setIsStoryOpen, 
    products, 
    setQuickViewProduct, 
    addToCart,
    formatPrice 
  } = useApp();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'dry-fruits' | 'spices'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const slideIntervalMs = 5000;
  const progressStepMs = 50;

  // Filter items based on active category filter
  const filteredItems = SHOWCASE_ITEMS.filter((item) => {
    if (activeCategoryFilter === 'all') return true;
    return item.category === activeCategoryFilter;
  });

  // Ensure index stays in bounds when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
  }, [activeCategoryFilter]);

  // Slideshow timer & progress bar
  useEffect(() => {
    if (!isPlaying) return;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((idx) => (idx + 1) % filteredItems.length);
          return 0;
        }
        return prev + (progressStepMs / slideIntervalMs) * 100;
      });
    }, progressStepMs);

    return () => clearInterval(progressTimer);
  }, [isPlaying, filteredItems.length]);

  const activeItem = filteredItems[currentIndex] || filteredItems[0] || SHOWCASE_ITEMS[0];

  const handleNext = () => {
    setProgress(0);
    setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const handlePrev = () => {
    setProgress(0);
    setCurrentIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  };

  const handleSelectSlide = (index: number) => {
    setProgress(0);
    setCurrentIndex(index);
  };

  const handleQuickView = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setQuickViewProduct(prod);
    }
  };

  const handleDirectAddToCart = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      addToCart(prod);
    }
  };

  const handleShopCategory = (cat: 'dry-fruits' | 'spices' | 'all') => {
    setSelectedCategory(cat);
    const catalogElem = document.getElementById('catalog-section');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="hero-showcase-container" className="relative w-full overflow-hidden bg-[#012d1d] text-[#FAF3E0]">
      {/* Background Ambience Layer with Dynamic Gradient */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-soft-light transition-all duration-1000">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#fed65b] rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#1b4332] rounded-full blur-3xl opacity-40" />
      </div>

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
        
        {/* Top Header Strip inside Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fed65b] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#fed65b]"></span>
            </span>
            <span className="text-[11px] sm:text-sm font-bold uppercase tracking-wider sm:tracking-widest text-[#fed65b] font-cinzel">
              Authentic Harvest Showcase • Dry Fruits & Estate Spices
            </span>
          </div>

          {/* Category Filter Switcher */}
          <div className="flex items-center bg-black/40 p-1 rounded-full border border-white/15 backdrop-blur-md overflow-x-auto no-scrollbar self-start sm:self-auto max-w-full">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-full transition-all whitespace-nowrap ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#fed65b] text-[#012d1d] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All Treasures ({SHOWCASE_ITEMS.length})
            </button>
            <button
              onClick={() => setActiveCategoryFilter('dry-fruits')}
              className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-full transition-all whitespace-nowrap ${
                activeCategoryFilter === 'dry-fruits'
                  ? 'bg-[#fed65b] text-[#012d1d] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🌰 Dry Fruits
            </button>
            <button
              onClick={() => setActiveCategoryFilter('spices')}
              className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-full transition-all whitespace-nowrap ${
                activeCategoryFilter === 'spices'
                  ? 'bg-[#fed65b] text-[#012d1d] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🌿 Estate Spices
            </button>
          </div>
        </div>

        {/* Showcase Layout */}
        <div className="relative">
          {/* Mobile Compact Hero Card (Hidden on LG) */}
          <div className="lg:hidden">
             <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = Math.abs(offset.x) * velocity.x;
                  if (swipe < -10000) handleNext();
                  else if (swipe > 10000) handlePrev();
                }}
                className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md"
              >
                <div className="h-[220px] relative">
                  <img src={activeItem.image} alt={activeItem.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-[#fed65b] text-[10px] px-2 py-1 rounded-full font-bold">{activeItem.origin}</div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h2 className="text-lg font-cinzel font-bold text-white leading-tight">{activeItem.name}</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{activeItem.rating} ({activeItem.reviewsCount})</span>
                      <span className="text-[#fed65b] font-bold">₹{activeItem.price}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1">{activeItem.highlight}</p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleQuickView(activeItem.id); }}
                      className="relative z-30 pointer-events-auto cursor-pointer w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
                    >
                      Quick View
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDirectAddToCart(activeItem.id); }}
                      className="relative z-30 pointer-events-auto cursor-pointer w-full py-2.5 rounded-xl bg-[#fed65b] text-[#012d1d] font-bold text-xs"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
             </AnimatePresence>
             {/* Indicators */}
             <div className="flex justify-center gap-2 mt-4">
               {filteredItems.map((_, i) => (
                 <button key={i} onClick={() => handleSelectSlide(i)} className={`w-2 h-2 rounded-full ${i === currentIndex ? 'bg-[#fed65b]' : 'bg-white/20'}`} />
               ))}
             </div>
          </div>

          {/* Desktop Showcase Layout (Hidden on Mobile) */}
          <div className="hidden lg:grid grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Brand Story & Live Slide Information */}
            <div className="col-span-5 space-y-6">
              
              {/* Active Tag & Origin Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fed65b]/15 border border-[#fed65b]/35 text-[#fed65b] text-xs font-semibold tracking-wide backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{activeItem.categoryLabel}</span>
                <span className="text-white/40">•</span>
                <span className="text-white/90">{activeItem.tag}</span>
              </div>

              {/* Main Dynamic Heading */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#fed65b]/90 uppercase tracking-wider font-cinzel">
                  {activeItem.hindiName}
                </div>
                <h1 className="font-cinzel text-5xl font-bold text-white leading-tight tracking-tight drop-shadow-sm">
                  {activeItem.name}
                </h1>
              </div>

              {/* Badge Highlight Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between text-xs text-[#fed65b] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#fed65b]" />
                    {activeItem.badge}
                  </span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {activeItem.rating} ({activeItem.reviewsCount})
                  </span>
                </div>
                <p className="text-sm text-[#e6deca] leading-relaxed font-normal">
                  {activeItem.highlight}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#c9bfa8] pt-1">
                  <Flame className="w-3.5 h-3.5 text-[#fed65b]" />
                  <span><strong>Aroma & Flavor:</strong> {activeItem.aromaProfile}</span>
                </div>
              </div>

              {/* Price & Primary Call to Actions */}
              <div className="flex items-center gap-6 pt-2">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Standard Pack ({activeItem.weight})
                  </div>
                  <div className="font-cinzel text-3xl font-bold text-[#fed65b]">
                    {formatPrice(activeItem.price)}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDirectAddToCart(activeItem.id); }}
                    className="relative z-30 pointer-events-auto cursor-pointer flex-1 inline-flex items-center justify-center gap-2 bg-[#fed65b] hover:bg-[#ffe07a] text-[#012d1d] px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add To Cart</span>
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleQuickView(activeItem.id); }}
                    className="relative z-30 pointer-events-auto cursor-pointer inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-[#FAF3E0] border border-white/25 px-5 py-3.5 rounded-xl font-semibold text-sm backdrop-blur-md transition-all"
                    title="Interactive Quick View"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Quick View</span>
                  </button>
                </div>
              </div>

              {/* Trust Assurances */}
              <div className="grid grid-cols-3 gap-2 pt-4 text-[11px] text-[#dcd1ba] border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#fed65b] shrink-0" />
                  <span>Single-Origin Pure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#fed65b] shrink-0" />
                  <span>Nitrogen Flushed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#fed65b] shrink-0" />
                  <span>Orchard Direct</span>
                </div>
              </div>

            </div>

            {/* Right Column: Animated Slideshow Display Stage */}
            <div 
              className="col-span-7 relative"
              onMouseEnter={() => setIsPlaying(false)}
              onMouseLeave={() => setIsPlaying(true)}
            >
              {/* The Outer Gold Highlight Bezel Frame */}
              <div className="relative rounded-3xl overflow-hidden p-1.5 bg-gradient-to-tr from-[#fed65b]/40 via-emerald-600/30 to-[#fed65b]/20 shadow-2xl border border-white/15">
                
                {/* Slideshow Display Screen */}
                <div className="relative aspect-[4/3] w-full rounded-[22px] overflow-hidden bg-black/60 group">
                  
                  {/* Images Layer with Crossfade Animation & Ken Burns Zoom */}
                  {filteredItems.map((item, idx) => {
                    const isActive = idx === currentIndex;
                    return (
                      <div
                        key={item.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                          isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className={`w-full h-full object-cover object-center transform transition-transform duration-[6000ms] ease-out ${
                            isActive ? 'scale-108' : 'scale-100'
                          }`}
                          referrerPolicy="no-referrer"
                        />

                        {/* Vignette Shadow Overlay for Typography Contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

                        {/* Floating Category Badge inside Image */}
                        <div className="absolute top-4 left-4 z-20">
                          <span className="px-3 py-1 rounded-full bg-black/60 border border-[#fed65b]/50 text-[#fed65b] text-[11px] font-bold tracking-wider backdrop-blur-md uppercase">
                            {item.origin}
                          </span>
                        </div>

                        {/* Floating Tag */}
                        <div className="absolute top-4 right-4 z-20">
                          <span className="px-3 py-1 rounded-full bg-[#012d1d]/80 border border-white/20 text-white text-[11px] font-semibold backdrop-blur-md">
                            Popular in our collection
                          </span>
                        </div>

                        {/* Bottom Caption Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between gap-4">
                          <div className="bg-black/65 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 max-w-[80%]">
                            <div className="text-[11px] text-[#fed65b] font-bold font-cinzel uppercase">
                              {item.hindiName}
                            </div>
                            <div className="text-base font-bold text-white truncate">
                              {item.name}
                            </div>
                          </div>

                          <button
                            onClick={() => handleQuickView(item.id)}
                            className="bg-[#fed65b] hover:bg-[#ffe07a] text-[#012d1d] p-2.5 rounded-xl shadow-lg hover:scale-105 transition-all shrink-0"
                            title="View Full Product Details"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Left/Right Slide Arrows */}
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/50 hover:bg-[#fed65b] text-white hover:text-[#012d1d] backdrop-blur-md border border-white/20 transition-all opacity-80 hover:opacity-100"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/50 hover:bg-[#fed65b] text-white hover:text-[#012d1d] backdrop-blur-md border border-white/20 transition-all opacity-80 hover:opacity-100"
                    aria-label="Next Slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Animated Slide Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
                    <div 
                      className="h-full bg-[#fed65b] transition-all ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                </div>

                {/* Interactive Thumbnail Carousel Strip Below Slide Screen */}
                <div className="mt-3 px-2 py-1 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
                  
                  {/* Play / Pause Toggle Button */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#fed65b] border border-white/15 transition-all shrink-0 flex items-center gap-1 text-[11px] font-bold"
                    title={isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  {/* Mini Thumbnails Selector */}
                  <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                    {filteredItems.map((item, idx) => {
                      const isSelected = idx === currentIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectSlide(idx)}
                          className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-300 ${
                            isSelected
                              ? 'border-[#fed65b] scale-105 shadow-md shadow-[#fed65b]/30 ring-2 ring-[#fed65b]/50'
                              : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                          }`}
                          title={item.name}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-[#fed65b]/20 mix-blend-overlay" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Slide Counter */}
                  <div className="text-[11px] text-slate-300 font-bold px-2 py-1 rounded-lg bg-black/40 border border-white/10 shrink-0">
                    <span className="text-[#fed65b]">{currentIndex + 1}</span> / {filteredItems.length}
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      </div>


      {/* Trust Badges Bar */}
      <div className="bg-[#FAF3E0] dark:bg-[#12281d] border-b border-[#e8dfc8] dark:border-[#1e3f2e] py-4 sm:py-5 text-slate-900 dark:text-[#FAF3E0] transition-colors">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center gap-3 p-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#012d1d] text-[#fed65b] flex items-center justify-center shrink-0 shadow-sm">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                100% Pure & Natural
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Pesticide & chemical-free harvest
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#012d1d] text-[#fed65b] flex items-center justify-center shrink-0 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                Nitrogen Flushed
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Preserves natural essential oils
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#012d1d] text-[#fed65b] flex items-center justify-center shrink-0 shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                Free Express Dispatch
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                On all orders above ₹999
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#012d1d] text-[#fed65b] flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                Varanasi Lineage
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Direct orchard-to-door purity
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
