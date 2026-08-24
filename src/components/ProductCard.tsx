import React, { useState } from 'react';
import { Heart, Eye, ShoppingBag, Star, Sparkles, Check } from 'lucide-react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { resolveProductImage } from '../utils/productImageResolver';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { formatPrice, addToCart, toggleWishlist, isInWishlist, setQuickViewProduct, t } = useApp();
  
  const [selectedWeight, setSelectedWeight] = useState<string>(
    product.packOptions[0]?.weight || '250g'
  );
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isAddedAnim, setIsAddedAnim] = useState<boolean>(false);

  const currentOption = product.packOptions.find((p) => p.weight === selectedWeight) || product.packOptions[0];
  const inWishlist = isInWishlist(product.id);
  const resolvedImageUrl = resolveProductImage(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, selectedWeight, 1);
    setIsAddedAnim(true);
    setTimeout(() => setIsAddedAnim(false), 1500);
  };

  return (
    <div
      id={'product-card-' + product.id}
      style={{ scrollMarginTop: '80px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white dark:bg-[#12281d] rounded-2xl border border-slate-200 dark:border-[#1e3f2e] hover:border-[#c79a1f] dark:hover:border-[#fed65b] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
    >
      {/* Image & Badges Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-[#162f22]">
        <img
          src={resolvedImageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.badge && (
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-[#012d1d] text-[#fed65b] shadow-md border border-[#fed65b]/30">
              {product.badge}
            </span>
          )}
          {currentOption && currentOption.discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#fed65b] text-[#012d1d] shadow-md">
              {currentOption.discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Action Buttons Top-Right (Wishlist & Quick View) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={`p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
              inWishlist
                ? 'bg-red-500 text-white'
                : 'bg-white/80 dark:bg-[#0f241a]/80 text-slate-700 dark:text-slate-200 hover:bg-[#fed65b] hover:text-[#012d1d]'
            }`}
            title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="p-2 rounded-full bg-white/80 dark:bg-[#0f241a]/80 text-slate-700 dark:text-slate-200 hover:bg-[#fed65b] hover:text-[#012d1d] backdrop-blur-md transition-all shadow-md opacity-90 group-hover:opacity-100"
            title="Quick View"
            aria-label="Quick View"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Quick View banner on hover */}
        <button
          onClick={() => setQuickViewProduct(product)}
          className="absolute bottom-0 inset-x-0 py-2 bg-[#012d1d]/90 text-[#FAF3E0] text-xs font-semibold text-center backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5 text-[#fed65b]" />
          <span>{t('quickView')}</span>
        </button>
      </div>

      {/* Content Body */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Origin & Rating */}
          <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
            <span className="text-[11px] font-semibold text-[#8a7a5c] dark:text-[#a8c9b9] truncate">
              {product.origin}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 fill-[#fed65b] text-[#fed65b]" />
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                {product.rating}
              </span>
              <span className="text-[10px] text-slate-400">
                ({product.reviewsCount})
              </span>
            </div>
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => setQuickViewProduct(product)}
            className="font-display text-sm sm:text-base font-bold text-[#012d1d] dark:text-[#FAF3E0] hover:text-[#c79a1f] dark:hover:text-[#fed65b] cursor-pointer transition-colors line-clamp-1"
          >
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
            {product.hindiName}
          </p>

          {/* Weight Option Selector Pills */}
          <div className="mb-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Pack Size:
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {product.packOptions.map((opt) => (
                <button
                  key={opt.weight}
                  onClick={() => setSelectedWeight(opt.weight)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    selectedWeight === opt.weight
                      ? 'bg-[#012d1d] text-[#fed65b] ring-1 ring-[#fed65b]'
                      : 'bg-slate-100 dark:bg-[#162f22] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1e3f2e]'
                  }`}
                >
                  {opt.weight}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing & Add to Cart Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#1e3f2e]/60 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-black tracking-tight tabular-nums text-[#012d1d] dark:text-[#fed65b]">
                {formatPrice(currentOption ? currentOption.price : product.basePrice)}
              </span>
              {currentOption && currentOption.originalPrice > currentOption.price && (
                <>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 line-through decoration-slate-400/80 decoration-[1.5px] tabular-nums">
                    {formatPrice(currentOption.originalPrice)}
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-300/80 dark:border-emerald-700/50 shadow-xs">
                    {currentOption.discountPercent || Math.round(((currentOption.originalPrice - currentOption.price) / currentOption.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Inclusive of all taxes
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all duration-200 shadow-sm ${
              isAddedAnim
                ? 'bg-emerald-700 text-white scale-105'
                : 'bg-[#012d1d] hover:bg-[#144230] text-[#FAF3E0] hover:scale-102 active:scale-95'
            }`}
            title="Add to Basket"
          >
            {isAddedAnim ? (
              <>
                <Check className="w-4 h-4 text-[#fed65b]" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-[#fed65b]" />
                <span>{t('addToCart')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
