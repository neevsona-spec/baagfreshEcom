import React, { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, 
  ArrowUpDown, 
  X, 
  Check, 
  Sparkles, 
  Grid3X3, 
  LayoutGrid,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { CATEGORIES } from '../data/products';
import { CategorySlug } from '../types';

export const ShopCatalog: React.FC = () => {
  const { 
    products, 
    selectedCategory, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery, 
    formatPrice, 
    t 
  } = useApp();

  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'discount'>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(4500);
  const [selectedPackSizes, setSelectedPackSizes] = useState<string[]>([]);
  const [organicOnly, setOrganicOnly] = useState<boolean>(false);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [gridCols, setGridCols] = useState<3 | 4>(3);

  // Available pack sizes
  const allPackSizes = ['100g', '250g', '500g', '1kg', 'Boxes / Hampers'];

  const togglePackSize = (size: string) => {
    setSelectedPackSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setMaxPrice(4500);
    setSelectedPackSizes([]);
    setOrganicOnly(false);
    setInStockOnly(false);
    setMinRating(0);
    setSortBy('featured');
  };

  // Filter logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          product.name.toLowerCase().includes(q) ||
          product.hindiName.toLowerCase().includes(q) ||
          product.origin.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Price filter
      if (product.basePrice > maxPrice) {
        return false;
      }

      // Organic only
      if (organicOnly && !product.isOrganic) {
        return false;
      }

      // In stock
      if (inStockOnly && !product.inStock) {
        return false;
      }

      // Rating
      if (minRating > 0 && product.rating < minRating) {
        return false;
      }

      // Pack size filter
      if (selectedPackSizes.length > 0) {
        const hasMatchingWeight = product.packOptions.some((opt) => {
          if (selectedPackSizes.includes('100g') && opt.weight.includes('100g')) return true;
          if (selectedPackSizes.includes('250g') && opt.weight.includes('250g')) return true;
          if (selectedPackSizes.includes('500g') && opt.weight.includes('500g')) return true;
          if (selectedPackSizes.includes('1kg') && opt.weight.includes('1kg')) return true;
          if (
            selectedPackSizes.includes('Boxes / Hampers') &&
            (opt.weight.includes('Box') || opt.weight.includes('Trunk') || opt.weight.includes('Vial'))
          )
            return true;
          return false;
        });
        if (!hasMatchingWeight) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.basePrice - b.basePrice;
      if (sortBy === 'price-desc') return b.basePrice - a.basePrice;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'discount') {
        const discA = a.packOptions[0]?.discountPercent || 0;
        const discB = b.packOptions[0]?.discountPercent || 0;
        return discB - discA;
      }
      return 0; // featured default
    });
  }, [products, selectedCategory, searchQuery, maxPrice, organicOnly, inStockOnly, minRating, selectedPackSizes, sortBy]);

  const currentCategoryInfo = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    maxPrice < 4500 ||
    organicOnly ||
    inStockOnly ||
    minRating > 0 ||
    selectedPackSizes.length > 0;

  return (
    <section id="catalog-section" className="py-8 sm:py-12 bg-slate-50/60 dark:bg-[#091710] min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Title & View Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200 dark:border-[#1c3c2b] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#c79a1f] dark:text-[#fed65b] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Varanasi Harvest Vault</span>
            </div>
            <h2 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold text-[#012d1d] dark:text-[#FAF3E0]">
              {currentCategoryInfo.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              {currentCategoryInfo.description}
            </p>
          </div>

          {/* Sort and View Controls */}
          <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden px-3.5 py-2 rounded-xl bg-white dark:bg-[#162f22] border border-slate-200 dark:border-[#275943] text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#c79a1f]" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#c79a1f]" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-white dark:bg-[#162f22] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#275943] shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                Sort By:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="featured" className="dark:bg-[#162f22]">Featured Harvests</option>
                <option value="price-asc" className="dark:bg-[#162f22]">Price: Low to High</option>
                <option value="price-desc" className="dark:bg-[#162f22]">Price: High to Low</option>
                <option value="rating" className="dark:bg-[#162f22]">Highest Rated ★</option>
                <option value="discount" className="dark:bg-[#162f22]">Biggest Discounts</option>
              </select>
            </div>

            {/* Grid density buttons */}
            <div className="hidden sm:flex items-center bg-white dark:bg-[#162f22] p-1 rounded-xl border border-slate-200 dark:border-[#275943] shadow-sm">
              <button
                onClick={() => setGridCols(3)}
                className={`p-1.5 rounded-lg transition-colors ${
                  gridCols === 3
                    ? 'bg-[#012d1d] text-[#fed65b]'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Comfortable Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`p-1.5 rounded-lg transition-colors ${
                  gridCols === 4
                    ? 'bg-[#012d1d] text-[#fed65b]'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Dense Grid"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Filters:
            </span>

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#012d1d] text-[#fed65b]">
                Category: {currentCategoryInfo.name}
                <button onClick={() => setSelectedCategory('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-[#1f3f2f] text-amber-900 dark:text-[#fed65b]">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {maxPrice < 4500 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-[#1f3f2f] text-slate-800 dark:text-slate-200">
                Under {formatPrice(maxPrice)}
                <button onClick={() => setMaxPrice(4500)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {organicOnly && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                100% Organic Only
                <button onClick={() => setOrganicOnly(false)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedPackSizes.map((size) => (
              <span
                key={size}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-[#1f3f2f] text-slate-800 dark:text-slate-200"
              >
                Pack: {size}
                <button onClick={() => togglePackSize(size)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:underline ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        )}

        {/* Main Content Layout: Sidebar + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            {/* Category Filter */}
            <div className="bg-white dark:bg-[#12281d] p-5 rounded-2xl border border-slate-200 dark:border-[#1e3f2e] shadow-sm">
              <h3 className="font-display font-bold text-sm text-[#012d1d] dark:text-[#FAF3E0] uppercase tracking-wider mb-3">
                Categories
              </h3>
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-[#012d1d] text-[#fed65b] font-bold shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162f22]'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1f3f2f] text-slate-600 dark:text-slate-300">
                        {cat.itemCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-white dark:bg-[#12281d] p-5 rounded-2xl border border-slate-200 dark:border-[#1e3f2e] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-sm text-[#012d1d] dark:text-[#FAF3E0] uppercase tracking-wider">
                  Price Limit
                </h3>
                <span className="text-xs font-bold text-[#c79a1f] dark:text-[#fed65b]">
                  {formatPrice(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="4500"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#012d1d] dark:accent-[#fed65b] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                <span>{formatPrice(200)}</span>
                <span>{formatPrice(4500)}</span>
              </div>
            </div>

            {/* Pack Size Checkboxes */}
            <div className="bg-white dark:bg-[#12281d] p-5 rounded-2xl border border-slate-200 dark:border-[#1e3f2e] shadow-sm">
              <h3 className="font-display font-bold text-sm text-[#012d1d] dark:text-[#FAF3E0] uppercase tracking-wider mb-3">
                Pack Sizes
              </h3>
              <div className="space-y-2">
                {allPackSizes.map((size) => {
                  const isChecked = selectedPackSizes.includes(size);
                  return (
                    <label
                      key={size}
                      className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none font-medium hover:text-[#012d1d] dark:hover:text-[#fed65b]"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePackSize(size)}
                        className="rounded border-slate-300 text-[#012d1d] focus:ring-[#c79a1f] w-4 h-4"
                      />
                      <span>{size}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Special Badges Toggles */}
            <div className="bg-white dark:bg-[#12281d] p-5 rounded-2xl border border-slate-200 dark:border-[#1e3f2e] shadow-sm space-y-3">
              <h3 className="font-display font-bold text-sm text-[#012d1d] dark:text-[#FAF3E0] uppercase tracking-wider">
                Harvest Attributes
              </h3>
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none font-medium">
                <input
                  type="checkbox"
                  checked={organicOnly}
                  onChange={(e) => setOrganicOnly(e.target.checked)}
                  className="rounded border-slate-300 text-[#012d1d] focus:ring-[#c79a1f] w-4 h-4"
                />
                <span>100% Certified Organic Only</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none font-medium">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-slate-300 text-[#012d1d] focus:ring-[#c79a1f] w-4 h-4"
                />
                <span>In Stock & Ready for Dispatch</span>
              </label>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-3">
            {/* Products count and status */}
            <div className="flex items-center justify-between mb-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>
                Showing <strong>{filteredProducts.length}</strong> of {products.length} artisan harvests
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                ✓ Free Dispatch Guaranteed
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              /* Empty State */
              <div className="bg-white dark:bg-[#12281d] rounded-3xl p-10 text-center border border-slate-200 dark:border-[#1e3f2e] space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#FAF3E0] dark:bg-[#162f22] text-2xl flex items-center justify-center mx-auto">
                  🌾
                </div>
                <h3 className="font-cinzel text-xl font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                  No Matching Harvest Items Found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Try adjusting your search keywords, raising your price ceiling, or resetting your filter criteria.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 rounded-full bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] text-xs font-bold shadow-md transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              /* Grid of Cards */
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${
                  gridCols === 4 ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-3'
                } gap-5 sm:gap-6`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-[#FAF3E0] dark:bg-[#0f241a] shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#d6caba] dark:border-[#275943]">
                <h3 className="font-cinzel text-lg font-bold text-[#012d1d] dark:text-[#FAF3E0]">
                  Filter Harvests
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-600 dark:text-slate-300"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Categories */}
              <div className="py-4 space-y-2 border-b border-[#d6caba] dark:border-[#275943]">
                <h4 className="text-xs uppercase font-bold text-[#635336] dark:text-[#fed65b]">
                  Category
                </h4>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setIsMobileFilterOpen(false);
                    }}
                    className={`w-full text-left py-1.5 text-xs font-semibold ${
                      selectedCategory === cat.id
                        ? 'text-[#012d1d] dark:text-[#fed65b] font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cat.name} ({cat.itemCount})
                  </button>
                ))}
              </div>

              {/* Price */}
              <div className="py-4 space-y-2 border-b border-[#d6caba] dark:border-[#275943]">
                <div className="flex justify-between text-xs font-bold">
                  <span>Max Price:</span>
                  <span>{formatPrice(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="4500"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#012d1d]"
                />
              </div>

              {/* Attributes */}
              <div className="py-4 space-y-3">
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={organicOnly}
                    onChange={(e) => setOrganicOnly(e.target.checked)}
                  />
                  <span>100% Organic Certified</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[#d6caba] dark:border-[#275943] flex gap-2">
              <button
                onClick={clearAllFilters}
                className="w-1/2 py-2.5 bg-slate-200 dark:bg-[#162f22] text-xs font-bold rounded-xl text-slate-800 dark:text-slate-200"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-1/2 py-2.5 bg-[#012d1d] text-[#fed65b] text-xs font-bold rounded-xl"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
