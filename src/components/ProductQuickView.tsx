import React, { useState } from 'react';
import { 
  X, 
  Star, 
  ShoppingBag, 
  Heart, 
  Check, 
  Truck, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  ChevronRight, 
  Plus, 
  Minus,
  MessageSquare,
  ThumbsUp,
  Package
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { resolveProductGallery, resolveProductImage } from '../utils/productImageResolver';

interface ProductQuickViewModalProps {
  product: Product;
  onClose: () => void;
}

const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({ product, onClose }) => {
  const {
    formatPrice,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setIsCheckoutOpen,
    t,
    showToast
  } = useApp();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedWeight, setSelectedWeight] = useState(
    product.packOptions[0]?.weight || '250g'
  );
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('221001');
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(
    'Delivery to Varanasi (221001) in 1-2 Business Days • Free Delivery Eligible'
  );
  const [activeTab, setActiveTab] = useState<'details' | 'nutrition' | 'reviews'>('details');

  // Review form state
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewLocation, setReviewLocation] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [localReviews, setLocalReviews] = useState(product.reviews || []);

  const currentOption =
    product.packOptions.find((p) => p.weight === selectedWeight) ||
    product.packOptions[0];

  const inWishlist = isInWishlist(product.id);

  const images = resolveProductGallery(product);

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincode.trim();
    if (!cleanPin || cleanPin.length < 5) {
      setPincodeStatus('Please enter a valid 6-digit postal PIN code.');
      return;
    }
    if (cleanPin.startsWith('22')) {
      setPincodeStatus(`Fast Delivery to Varanasi Zone (${cleanPin}) in 24-48 Hours! Free Express Delivery.`);
    } else if (cleanPin.startsWith('11') || cleanPin.startsWith('40') || cleanPin.startsWith('56')) {
      setPincodeStatus(`Express Air Delivery to Metro (${cleanPin}) in 2 Business Days.`);
    } else {
      setPincodeStatus(`Verified Delivery to PIN ${cleanPin} in 3-4 Business Days via BlueDart Air.`);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, selectedWeight, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedWeight, quantity);
    onClose();
    setIsCheckoutOpen(true);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) {
      showToast('Please fill in your name and review remarks', 'warning');
      return;
    }

    const newRev = {
      id: 'rev-' + Date.now(),
      author: reviewAuthor.trim(),
      location: reviewLocation.trim() || 'India',
      rating: reviewRating,
      date: 'Just now',
      verifiedBuyer: true,
      title: reviewTitle.trim() || 'Verified Harvest Review',
      comment: reviewComment.trim(),
      likes: 1,
    };

    setLocalReviews([newRev, ...localReviews]);
    setReviewAuthor('');
    setReviewComment('');
    setReviewTitle('');
    showToast('Thank you! Your verified review has been published.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0f241a] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#275943] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-[#FAF3E0] dark:bg-[#162f22] border-b border-[#e8dfc8] dark:border-[#275943] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Home</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{product.category}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#012d1d] dark:text-[#fed65b] font-bold truncate max-w-[180px] sm:max-w-xs">
              {product.name}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Left: Image Gallery */}
            <div className="space-y-3">
              {/* Main Image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#162f22] border border-slate-200 dark:border-[#275943]">
                <img
                  src={images[selectedImageIndex] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Brand Packaging Watermark / Seal */}
                <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-[#012d1d]/90 text-[#fed65b] shadow-md border border-[#fed65b]/40 backdrop-blur-sm flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#fed65b]" />
                    BAAGFRESH • {selectedWeight} Royal Pouch
                  </span>
                  {product.badge && (
                    <span className="self-start px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#fed65b] text-[#012d1d] shadow-sm">
                      {product.badge}
                    </span>
                  )}
                </div>

                {currentOption && currentOption.discountPercent > 0 && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-black uppercase bg-[#fed65b] text-[#012d1d] shadow-md">
                    {currentOption.discountPercent}% OFF
                  </span>
                )}

                {/* Bottom Pouch View Indicator */}
                <div className="absolute bottom-3 inset-x-3 bg-black/60 backdrop-blur-md rounded-xl p-2 text-[11px] text-white flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Package className="w-3.5 h-3.5 text-[#fed65b]" />
                    <span>
                      {selectedImageIndex === 0
                        ? `250g Stand-up Zipper Pouch`
                        : selectedImageIndex === 1
                        ? `500g Value Zipper Pouch`
                        : selectedImageIndex === 2
                        ? `1kg Royal Reserve Pouch`
                        : selectedImageIndex === 3
                        ? `Grade W-180 Jumbo Kernels`
                        : `Fresh Harvest Platter`}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#fed65b] font-bold uppercase tracking-wider">
                    Nitrogen Sealed
                  </span>
                </div>
              </div>

              {/* Thumbnails with Pouch Size Labels */}
              {images.length > 1 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium px-1">
                    <span>Available Packaging & Angles:</span>
                    <span className="text-xs text-[#012d1d] dark:text-[#fed65b] font-bold">
                      {images.length} Views
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {images.map((img, idx) => {
                      const pouchLabel = 
                        idx === 0 ? '250g Pouch' :
                        idx === 1 ? '500g Pouch' :
                        idx === 2 ? '1kg Pouch' :
                        idx === 3 ? 'Kernels' : 'Serving';

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedImageIndex(idx);
                            if (idx === 0 && product.packOptions[0]) setSelectedWeight(product.packOptions[0].weight);
                            if (idx === 1 && product.packOptions[1]) setSelectedWeight(product.packOptions[1].weight);
                            if (idx === 2 && product.packOptions[2]) setSelectedWeight(product.packOptions[2].weight);
                          }}
                          className={`group relative rounded-xl overflow-hidden border-2 shrink-0 transition-all flex flex-col items-center bg-white dark:bg-[#162f22] ${
                            selectedImageIndex === idx
                              ? 'border-[#fed65b] ring-2 ring-[#fed65b]/40 scale-105 shadow-md'
                              : 'border-slate-200 dark:border-[#275943] opacity-75 hover:opacity-100'
                          }`}
                        >
                          <div className="w-16 h-14 overflow-hidden">
                            <img
                              src={img}
                              alt={`Pouch ${pouchLabel}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="w-full text-center text-[9px] font-bold py-0.5 bg-[#012d1d] text-[#fed65b] tracking-tight">
                            {pouchLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quality Badges */}
              <div className="p-3 bg-[#FAF3E0] dark:bg-[#162f22] rounded-xl border border-[#e8dfc8] dark:border-[#275943] grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#fed65b]" />
                  <span>100% Pesticide Free</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#fed65b]" />
                  <span>Airtight Nitrogen Seal</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#fed65b]" />
                  <span>Single-Origin Traceable</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#fed65b]" />
                  <span>Lab Tested Grade-AAA</span>
                </div>
              </div>
            </div>

            {/* Right: Product Info & Buy Controls */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                {/* Origin tag */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                    <MapPin className="w-3 h-3" />
                    {product.origin}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Grading: {product.grading}
                  </span>
                </div>

                {/* Main Titles */}
                <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[#012d1d] dark:text-[#FAF3E0] mt-1.5">
                  {product.name}
                </h1>
                <p className="text-sm font-semibold text-[#8a7a5c] dark:text-[#fed65b]">
                  {product.hindiName}
                </p>

                {/* Rating Bar */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? 'fill-[#fed65b] text-[#fed65b]'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {product.rating} / 5.0
                  </span>
                  <span className="text-xs text-slate-400">
                    ({product.reviewsCount} verified harvest reviews)
                  </span>
                </div>

                {/* Price Display */}
                <div className="mt-3 p-3 bg-slate-50 dark:bg-[#162f22] rounded-xl border border-slate-100 dark:border-[#275943]">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-[#012d1d] dark:text-[#fed65b]">
                      {formatPrice(currentOption ? currentOption.price : product.basePrice)}
                    </span>
                    {currentOption && currentOption.originalPrice > currentOption.price && (
                      <span className="text-sm font-semibold text-slate-400 dark:text-slate-400 line-through decoration-slate-400/80 decoration-[1.5px] tabular-nums">
                        {formatPrice(currentOption.originalPrice)}
                      </span>
                    )}
                    {currentOption && (
                      <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-300/80 dark:border-emerald-700/50 shadow-xs">
                        You Save {formatPrice(currentOption.originalPrice - currentOption.price)} ({currentOption.discountPercent}%)
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Price inclusive of all taxes (GST 5%). Free Shipping on orders over ₹999.
                  </span>
                </div>

                {/* Weight Options Selection */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Select Pouch Pack Size:
                    </label>
                    <span className="text-[11px] text-[#012d1d] dark:text-[#fed65b] font-semibold">
                      BAAGFRESH Fresh-Lock Pouch
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {product.packOptions.map((opt, optIdx) => {
                      const isSelected = selectedWeight === opt.weight;
                      return (
                        <button
                          key={opt.weight}
                          onClick={() => {
                            setSelectedWeight(opt.weight);
                            if (optIdx < images.length) {
                              setSelectedImageIndex(optIdx);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-[#012d1d] text-[#fed65b] border-[#fed65b] ring-2 ring-[#fed65b]/40 shadow-sm'
                              : 'bg-white dark:bg-[#162f22] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#275943] hover:border-[#c79a1f]'
                          }`}
                        >
                          <div className="font-bold text-xs sm:text-sm">{opt.weight} Pouch</div>
                          <div className="text-[11px] opacity-90">{formatPrice(opt.price)}</div>
                          {opt.popular && (
                            <span className="block mt-1 text-[9px] font-black uppercase bg-[#fed65b] text-[#012d1d] px-1 py-0.5 rounded">
                              Most Popular
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Pouch Specification Breakdown */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#142d20] border border-slate-200/80 dark:border-[#275943] text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Package className="w-3.5 h-3.5 text-[#012d1d] dark:text-[#fed65b]" />
                      <span>
                        {selectedWeight === '250g'
                          ? '250g Stand-up Pouch (10-12 Daily Servings)'
                          : selectedWeight === '500g'
                          ? '500g Value Zipper Pouch (20-25 Servings)'
                          : selectedWeight === '1kg'
                          ? '1kg Royal Family Reserve Pouch (45-50 Servings)'
                          : `${selectedWeight} BAAGFRESH Fresh-Lock Pack`}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                      Resealable
                    </span>
                  </div>
                </div>

                {/* Quantity & Wishlist */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center border border-slate-300 dark:border-[#275943] rounded-xl bg-white dark:bg-[#162f22] overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f3f2f]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-slate-800 dark:text-slate-100">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f3f2f]"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold ${
                      inWishlist
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 border-red-300'
                        : 'bg-white dark:bg-[#162f22] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#275943] hover:border-[#c79a1f]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current text-red-500' : ''}`} />
                    <span>{inWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
                  </button>
                </div>

                {/* Add to Basket and Buy Now CTA */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="py-3 px-4 rounded-xl bg-[#012d1d] hover:bg-[#144230] text-[#FAF3E0] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all border border-[#fed65b]/40 hover:scale-[1.02]"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#fed65b]" />
                    <span>Add to Basket</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="py-3 px-4 rounded-xl bg-[#fed65b] hover:bg-[#ffe07a] text-[#012d1d] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Buy Now (Instant)</span>
                  </button>
                </div>

                {/* Delivery Pincode Checker */}
                <div className="mt-4 p-3 bg-[#FAF3E0]/70 dark:bg-[#162f22]/70 rounded-xl border border-[#e8dfc8] dark:border-[#275943]">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1.5">
                    <Truck className="w-4 h-4 text-[#012d1d] dark:text-[#fed65b]" />
                    <span>Check Delivery Estimate & Cash on Delivery:</span>
                  </div>
                  <form onSubmit={handlePincodeCheck} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Enter 6-digit PIN code"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f241a] text-slate-800 dark:text-slate-100 rounded-lg border border-slate-300 dark:border-[#275943] focus:outline-none focus:ring-1 focus:ring-[#c79a1f]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] text-xs font-bold rounded-lg shrink-0"
                    >
                      Check
                    </button>
                  </form>
                  {pincodeStatus && (
                    <p className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                      {pincodeStatus}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details & Nutrition & Reviews Tabs */}
          <div className="pt-4 border-t border-slate-200 dark:border-[#275943]">
            {/* Tab navigation */}
            <div className="flex border-b border-slate-200 dark:border-[#275943] gap-4 sm:gap-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2.5 text-xs sm:text-sm font-bold transition-colors relative ${
                  activeTab === 'details'
                    ? 'text-[#012d1d] dark:text-[#fed65b] border-b-2 border-[#012d1d] dark:border-[#fed65b]'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Harvest Story & Benefits
              </button>

              <button
                onClick={() => setActiveTab('nutrition')}
                className={`pb-2.5 text-xs sm:text-sm font-bold transition-colors relative ${
                  activeTab === 'nutrition'
                    ? 'text-[#012d1d] dark:text-[#fed65b] border-b-2 border-[#012d1d] dark:border-[#fed65b]'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Nutritional Facts
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-2.5 text-xs sm:text-sm font-bold transition-colors relative ${
                  activeTab === 'reviews'
                    ? 'text-[#012d1d] dark:text-[#fed65b] border-b-2 border-[#012d1d] dark:border-[#fed65b]'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Customer Reviews ({localReviews.length})
              </button>
            </div>

            {/* Tab 1: Details */}
            {activeTab === 'details' && (
              <div className="py-4 space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>{product.longDescription}</p>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Key Health & Wellness Benefits:
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 bg-[#FAF3E0]/40 dark:bg-[#162f22]/40 p-2 rounded-lg">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-[#fed65b] shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-[#162f22] rounded-lg">
                    <span className="text-slate-400 block">Harvest Season:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {product.harvestSeason}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-[#162f22] rounded-lg">
                    <span className="text-slate-400 block">Packaging:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Food-Grade Nitrogen Sealed
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-[#162f22] rounded-lg">
                    <span className="text-slate-400 block">Storage:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Cool & Dry Place / Airtight
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Nutrition */}
            {activeTab === 'nutrition' && (
              <div className="py-4">
                <div className="max-w-md mx-auto border border-slate-300 dark:border-[#275943] rounded-2xl overflow-hidden bg-white dark:bg-[#162f22] text-xs">
                  <div className="bg-[#012d1d] text-[#fed65b] p-3 font-bold text-center">
                    Nutritional Value (Per 100g serving)
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-[#275943]">
                    <div className="flex justify-between p-2.5">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Calories:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{product.nutrition.calories}</span>
                    </div>
                    <div className="flex justify-between p-2.5">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Proteins:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{product.nutrition.protein}</span>
                    </div>
                    <div className="flex justify-between p-2.5">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Healthy Fats:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{product.nutrition.healthyFats}</span>
                    </div>
                    <div className="flex justify-between p-2.5">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Carbohydrates:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{product.nutrition.carbs}</span>
                    </div>
                    <div className="flex justify-between p-2.5">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Dietary Fiber:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{product.nutrition.dietaryFiber}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-[#0f241a]">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Essential Nutrients:</span>
                      <span className="font-bold text-emerald-700 dark:text-[#fed65b]">{product.nutrition.keyVitamins}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Reviews */}
            {activeTab === 'reviews' && (
              <div className="py-4 space-y-6">
                {/* Reviews List */}
                <div className="space-y-3">
                  {localReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#162f22] border border-slate-200 dark:border-[#275943] text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {rev.author}
                          </span>
                          <span className="text-slate-400">({rev.location})</span>
                          {rev.verifiedBuyer && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                              Verified Buyer
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{rev.date}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? 'fill-[#fed65b] text-[#fed65b]'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>

                      <h5 className="font-bold text-slate-800 dark:text-slate-200">
                        {rev.title}
                      </h5>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Write Review Form */}
                <div className="p-4 bg-[#FAF3E0] dark:bg-[#11241a] rounded-2xl border border-[#e8dfc8] dark:border-[#275943]">
                  <h4 className="font-bold text-sm text-[#012d1d] dark:text-[#FAF3E0] mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#c79a1f]" />
                    <span>Write a Verified Customer Review</span>
                  </h4>
                  <form onSubmit={handleAddReview} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Your Name:
                        </label>
                        <input
                          type="text"
                          required
                          value={reviewAuthor}
                          onChange={(e) => setReviewAuthor(e.target.value)}
                          placeholder="e.g. Ramesh Varma"
                          className="w-full px-3 py-2 bg-white dark:bg-[#0f241a] rounded-lg border border-slate-300 dark:border-[#275943] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c79a1f]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          City / State:
                        </label>
                        <input
                          type="text"
                          value={reviewLocation}
                          onChange={(e) => setReviewLocation(e.target.value)}
                          placeholder="e.g. Varanasi, UP"
                          className="w-full px-3 py-2 bg-white dark:bg-[#0f241a] rounded-lg border border-slate-300 dark:border-[#275943] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c79a1f]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Rating:
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => setReviewRating(num)}
                            className="p-1 text-slate-400 hover:text-[#fed65b]"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                num <= reviewRating
                                  ? 'fill-[#fed65b] text-[#fed65b]'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="font-bold text-slate-700 dark:text-slate-200 ml-2">
                          {reviewRating} Stars
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Review Title:
                      </label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="e.g. Freshness and aroma is extraordinary"
                        className="w-full px-3 py-2 bg-white dark:bg-[#0f241a] rounded-lg border border-slate-300 dark:border-[#275943] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c79a1f]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Your Feedback:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your thoughts on packaging, crunch, taste, and oil content..."
                        className="w-full px-3 py-2 bg-white dark:bg-[#0f241a] rounded-lg border border-slate-300 dark:border-[#275943] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#c79a1f]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold rounded-xl shadow-md transition-all"
                    >
                      Submit Verified Review
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductQuickView: React.FC = () => {
  const { quickViewProduct, setQuickViewProduct } = useApp();

  if (!quickViewProduct) return null;

  return (
    <ProductQuickViewModal
      key={quickViewProduct.id}
      product={quickViewProduct}
      onClose={() => setQuickViewProduct(null)}
    />
  );
};
