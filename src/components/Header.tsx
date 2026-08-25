import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  User, 
  Bell, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  ChevronDown, 
  Sparkles,
  ShieldCheck,
  Check,
  Package
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CURRENCIES, LANGUAGES } from '../data/currencies';
import { CurrencyCode, LanguageCode, CategorySlug } from '../types';
import { CATEGORIES } from '../data/products';
import { BaagfreshLogo } from './BaagfreshLogo';
import { ThemeToggle } from './ThemeToggle';
import { resolveProductImage } from '../utils/productImageResolver';

export const Header: React.FC = () => {
  const {
    isDarkMode,
    toggleDarkMode,
    currency,
    setCurrency,
    formatPrice,
    language,
    setLanguage,
    t,
    cartCount,
    cartSubtotal,
    wishlist,
    unreadNotificationCount,
    setIsCartOpen,
    setIsProfileOpen,
    setIsNotificationsOpen,
    setIsWholesaleOpen,
    setIsStoryOpen,
    setIsAuthOpen,
    setIsAdminOpen,
    setIsChatbotOpen,
    isAdminUser,
    isAdminAuthenticated,
    setIsGmailHubOpen,
    storeSettings,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    products,
    setQuickViewProduct,
    user,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const POPULAR_SEARCH_TERMS = [
    'Mamra Almonds',
    'King Cashews W-180',
    'Mongra Saffron',
    'Green Cardamom',
    'Tellicherry Pepper',
    'Medjool Dates',
    'Walnut Kernels',
    'Gift Trunks',
  ];

  // Close search suggestions & category dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Category matches from search query
  const matchingCategories = searchQuery.trim()
    ? CATEGORIES.filter(
        (c) =>
          c.id !== 'all' &&
          (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.hindiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.id.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Product suggestions matching name, hindi name, origin, or category
  const searchSuggestions = searchQuery.trim()
    ? products
        .filter((p) => {
          const q = searchQuery.toLowerCase();
          const matchesQuery =
            p.name.toLowerCase().includes(q) ||
            p.hindiName.toLowerCase().includes(q) ||
            p.origin.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q);
          const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
          return matchesQuery && matchesCategory;
        })
        .slice(0, 6)
    : [];

  const handleSelectCategoryAndFilter = (catId: CategorySlug) => {
    setSelectedCategory(catId);
    setIsCategoryDropdownOpen(false);
    setIsSearchFocused(false);
    const catalogElem = document.getElementById('catalog-section');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = () => {
    setIsSearchFocused(false);
    const catalogElem = document.getElementById('catalog-section');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavCategoryClick = (cat: CategorySlug) => {
    setSelectedCategory(cat);
    setIsMobileMenuOpen(false);
    setIsStoryOpen(false);
    // Smooth scroll to catalog
    const catalogElem = document.getElementById('catalog-section');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm">
      {/* Top Announcement Bar */}
      <div className="hidden md:flex bg-[#012d1d] text-[#FAF3E0] text-xs py-2 px-4 border-b border-[#1b4332] transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          {/* Left contact info */}
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            <span className="flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity">
              <Mail className="w-3.5 h-3.5 text-[#fed65b]" />
              <a href={`mailto:${storeSettings.supportEmail || 'contact@baagfresh.in'}`} className="hover:text-[#fed65b]">
                {storeSettings.supportEmail || 'contact@baagfresh.in'}
              </a>
            </span>
            <span className="hidden md:inline text-[#396350]">•</span>
            <span className="flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity">
              <Phone className="w-3.5 h-3.5 text-[#fed65b]" />
              <a href={`tel:${storeSettings.supportPhone || '+918707671319'}`} className="hover:text-[#fed65b]">
                {storeSettings.supportPhone || '+91 8707671319'}
              </a>
            </span>
            <span className="hidden lg:inline text-[#396350]">•</span>
            <span className="hidden lg:flex items-center gap-1 text-[#e9c349]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Varanasi Hub</span>
            </span>
          </div>

          {/* Center promotional pill */}
          {storeSettings.announcementActive && (
            <div className="hidden md:flex items-center gap-1.5 bg-[#1b4332] px-3 py-0.5 rounded-full text-[11px] font-medium text-[#fed65b] border border-[#fed65b]/30 shadow-sm max-w-md truncate">
              <Sparkles className="w-3 h-3 text-[#fed65b] shrink-0" />
              <span className="truncate">{storeSettings.announcementText}</span>
            </div>
          )}

          {/* Right Selectors & Toggles */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Admin Console Direct Link */}
            <button
              id="topbar-admin-portal-btn"
              onClick={() => setIsAdminOpen(true)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded bg-[#163a2c] hover:bg-[#275943] text-xs text-[#fed65b] font-bold border border-[#fed65b]/40 transition-colors shadow-sm"
              title="Open Admin Control Center"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#fed65b]" />
              <span>Admin</span>
            </button>

            {/* Currency Selector */}
            <div className="relative">
              <button
                id="currency-selector-btn"
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1b4332] hover:bg-[#275943] text-xs text-[#FAF3E0] font-medium transition-colors"
                title="Change Currency"
              >
                <span>{currency} ({CURRENCIES[currency].symbol})</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isCurrencyDropdownOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#16281e] text-slate-800 dark:text-slate-100 rounded-lg shadow-xl py-1 border border-slate-200 dark:border-[#275943] z-50">
                  {Object.values(CURRENCIES).map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code as CurrencyCode);
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#FAF3E0] dark:hover:bg-[#1f382a] ${
                        currency === c.code ? 'font-bold text-[#012d1d] dark:text-[#fed65b]' : ''
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="text-slate-400 dark:text-slate-300 font-mono">{c.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <button
                id="language-selector-btn"
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1b4332] hover:bg-[#275943] text-xs text-[#FAF3E0] font-medium transition-colors"
                title="Change Language"
              >
                <span>{LANGUAGES.find((l) => l.code === language)?.flag} {LANGUAGES.find((l) => l.code === language)?.label.slice(0, 3)}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isLanguageDropdownOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#16281e] text-slate-800 dark:text-slate-100 rounded-lg shadow-xl py-1 border border-slate-200 dark:border-[#275943] z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code as LanguageCode);
                        setIsLanguageDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#FAF3E0] dark:hover:bg-[#1f382a] ${
                        language === l.code ? 'font-bold text-[#012d1d] dark:text-[#fed65b]' : ''
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </span>
                      {language === l.code && <Check className="w-3 h-3 text-[#012d1d] dark:text-[#fed65b]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            </div>
          </div>
        </div>

      {/* Main Navigation Header */}
      <div className="bg-[#FAF3E0] dark:bg-[#0f241a] border-b border-[#e8dfc8] dark:border-[#1b3d2c] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2.5 sm:py-4">
          <div className="flex items-center justify-between gap-1 sm:gap-3 lg:gap-8">
            {/* Mobile menu button */}
            <button
              id="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22] rounded-lg transition-colors shrink-0"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            {/* Brand Logo */}
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory('all');
                setIsStoryOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center group cursor-pointer shrink-0"
              aria-label="Baagfresh Home"
            >
              <BaagfreshLogo size="md" showTagline={true} />
            </a>

            {/* Live Search Bar with Integrated Category Selector & Suggestion Dropdown */}
            <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl relative items-center">
              <div className="relative flex items-center w-full bg-white dark:bg-[#162f22] rounded-full border border-[#d6caba] dark:border-[#275943] focus-within:border-[#c79a1f] focus-within:ring-2 focus-within:ring-[#c79a1f]/30 shadow-inner transition-all">
                {/* Category Filter Selector Dropdown */}
                <div className="relative shrink-0" ref={categoryDropdownRef}>
                  <button
                    id="header-category-filter-btn"
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="flex items-center gap-1.5 pl-4 pr-3 py-2.5 text-xs font-semibold text-[#012d1d] dark:text-[#FAF3E0] border-r border-[#e2d8c9] dark:border-[#275943] hover:bg-[#FAF3E0] dark:hover:bg-[#1b3d2c] rounded-l-full transition-colors whitespace-nowrap"
                    title="Filter by Category"
                    aria-label="Filter by Category"
                  >
                    <span className="max-w-[110px] truncate text-[#012d1d] dark:text-[#fed65b]">
                      {CATEGORIES.find((c) => c.id === selectedCategory)?.name.split(' ')[0] || 'All'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#8a7a5c] dark:text-[#8cb8a3] transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Category Dropdown Menu */}
                  {isCategoryDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-[#162f22] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#275943] py-2 z-50">
                      <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8a7a5c] dark:text-[#fed65b]/80 border-b border-slate-100 dark:border-[#275943]/40 flex items-center justify-between">
                        <span>Filter Category</span>
                        <span className="text-[9px] text-slate-400 font-normal">Select to filter</span>
                      </div>
                      <div className="py-1">
                        {CATEGORIES.map((cat) => {
                          const isSelected = selectedCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleSelectCategoryAndFilter(cat.id)}
                              className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                                isSelected
                                  ? 'bg-[#012d1d] text-[#fed65b] font-bold'
                                  : 'text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#FAF3E0] dark:hover:bg-[#1f3f2f]'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="truncate">{cat.name}</span>
                                {cat.id !== 'all' && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-400">
                                    ({cat.itemCount})
                                  </span>
                                )}
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#fed65b] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Search Input Field */}
                <div className="relative flex-1 flex items-center">
                  <Search className="w-4 h-4 text-[#8a7a5c] dark:text-[#8cb8a3] absolute left-3.5 pointer-events-none" />
                  <input
                    id="global-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchSubmit();
                      } else if (e.key === 'Escape') {
                        setIsSearchFocused(false);
                      }
                    }}
                    placeholder={
                      selectedCategory === 'all'
                        ? t('searchPlaceholder')
                        : `Search in ${CATEGORIES.find((c) => c.id === selectedCategory)?.name}...`
                    }
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-transparent text-[#012d1d] dark:text-[#FAF3E0] placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      id="clear-search-btn"
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="Clear search"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Suggestions & Live Category Match Dropdown */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#162f22] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#275943] overflow-hidden z-50 divide-y divide-slate-100 dark:divide-[#275943]/40">
                  {/* Category matches if user typed a category name like 'spices', 'dry fruits', 'seeds', etc. */}
                  {matchingCategories.length > 0 && (
                    <div className="p-2.5 bg-[#FAF3E0]/70 dark:bg-[#11281c] border-b border-amber-200/50 dark:border-[#275943]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#635336] dark:text-[#fed65b] mb-1.5 px-1">
                        Matching Categories
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {matchingCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleSelectCategoryAndFilter(cat.id)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#1b3d2c] hover:bg-[#012d1d] hover:text-[#fed65b] text-[#012d1d] dark:text-white rounded-full text-xs font-semibold border border-amber-300 dark:border-[#275943] transition-all shadow-sm group"
                          >
                            <span>Browse {cat.name}</span>
                            <span className="text-[10px] opacity-75 group-hover:text-[#fed65b]">({cat.itemCount})</span>
                            <span className="text-[10px] text-[#c79a1f] group-hover:text-[#fed65b]">→</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If user hasn't typed anything yet, show popular searches & quick category tags */}
                  {!searchQuery.trim() && (
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#fed65b] mb-2 flex items-center justify-between">
                          <span>Quick Category Filter</span>
                          <span className="text-[10px] text-slate-400">Click to filter</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleSelectCategoryAndFilter(cat.id)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                                selectedCategory === cat.id
                                  ? 'bg-[#012d1d] text-[#fed65b] border-[#012d1d]'
                                  : 'bg-slate-50 dark:bg-[#1f3f2f] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#275943] hover:border-[#c79a1f]'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-[#275943]/40">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#fed65b] mb-2">
                          Popular Harvest Searches
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {POPULAR_SEARCH_TERMS.map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => {
                                setSearchQuery(term);
                                handleSearchSubmit();
                              }}
                              className="px-2.5 py-1 bg-amber-50 dark:bg-[#1a3828] hover:bg-amber-100 dark:hover:bg-[#234d37] text-[#012d1d] dark:text-[#FAF3E0] rounded-lg text-xs font-medium border border-amber-200 dark:border-[#275943] transition-colors"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Matching Products List */}
                  {searchQuery.trim() && searchSuggestions.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-[#FAF3E0] dark:bg-[#11241a] text-[11px] font-semibold uppercase tracking-wider text-[#635336] dark:text-[#fed65b] flex items-center justify-between">
                        <span>Direct Product Matches</span>
                        <span>{searchSuggestions.length} items</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-[#275943]/30">
                        {searchSuggestions.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => {
                              setQuickViewProduct(prod);
                              setIsSearchFocused(false);
                            }}
                            className="p-3 hover:bg-[#FAF3E0]/60 dark:hover:bg-[#1f3f2f] cursor-pointer flex items-center gap-3 transition-colors"
                          >
                            <img
                              src={resolveProductImage(prod)}
                              alt={prod.name}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-[#275943] shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-[#012d1d] dark:text-white truncate">
                                  {prod.name}
                                </h4>
                                {prod.badge && (
                                  <span className="text-[10px] bg-[#fed65b] text-[#012d1d] font-bold px-1.5 py-0.5 rounded shrink-0">
                                    {prod.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {prod.origin} • {prod.hindiName}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm font-bold text-[#012d1d] dark:text-[#fed65b]">
                                {formatPrice(prod.basePrice)}
                              </span>
                              <span className="block text-[10px] text-slate-400 line-through">
                                {formatPrice(prod.originalPrice)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No product matches */}
                  {searchQuery.trim() && searchSuggestions.length === 0 && matchingCategories.length === 0 && (
                    <div className="p-6 text-center">
                      <p className="text-sm font-semibold text-[#012d1d] dark:text-[#FAF3E0] mb-1">
                        No harvest matches found for "{searchQuery}"
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Try searching for Mamra Almonds, Saffron, Cardamom, Cashews, or reset category filter.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                        }}
                        className="px-3 py-1.5 bg-[#012d1d] text-[#fed65b] text-xs font-bold rounded-full"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}

                  {/* Footer button to view in catalog */}
                  {searchQuery.trim() && (
                    <div className="p-2.5 text-center bg-slate-50 dark:bg-[#0f241a]">
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="text-xs font-semibold text-[#012d1d] dark:text-[#fed65b] hover:underline"
                      >
                        Filter and view all matching items in catalog →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons (Wishlist, Notifications, Cart, Account) */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <ThemeToggle />
              {/* Wishlist */}
              <button
                id="header-wishlist-btn"
                onClick={() => {
                  setIsProfileOpen(true);
                }}
                className="hidden md:flex relative p-1.5 sm:p-2 text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22] rounded-full transition-colors"
                title="Wishlist"
                aria-label="Wishlist"
              >
                <Heart className="w-4 h-4" />
                {wishlist.length > 0 && (
                  <span className="absolute 0.5 right-0.5 w-3.5 h-3.5 bg-[#c79a1f] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Notifications */}
              <button
                id="header-notifications-btn"
                onClick={() => setIsNotificationsOpen(true)}
                className="hidden md:flex relative p-1.5 sm:p-2 text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22] rounded-full transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute 0.5 right-0.5 w-3.5 h-3.5 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Gmail Hub */}
              <button
                id="header-gmail-hub-btn"
                onClick={() => setIsGmailHubOpen(true)}
                className="hidden md:flex relative p-1.5 sm:p-2 text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22] rounded-full transition-colors"
                title="Gmail Hub & Order Receipts"
                aria-label="Gmail Hub"
              >
                <Mail className="w-4 h-4 text-[#c79a1f]" />
              </button>

              
              {/* Account / Profile / Auth */}
              {user && user.id !== 'usr-guest-00' && user.email ? (
                <button
                  id="header-account-btn"
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22] rounded-full transition-colors border border-[#d6caba]/60 dark:border-[#275943]"
                  title={`Signed in as ${user.name}`}
                  aria-label="Account"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                    alt="Profile"
                    className="w-5 h-5 rounded-full object-cover border border-[#fed65b]"
                    referrerPolicy="no-referrer"
                  />
                  <span className="hidden md:inline text-[11px] font-semibold max-w-[75px] truncate">
                    {user.name.split(' ')[0] || 'Account'}
                  </span>
                </button>
              ) : (
                <button
                  id="header-auth-btn"
                  onClick={() => setIsAuthOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#012d1d] hover:bg-[#1b4332] text-[#fed65b] rounded-full transition-colors border border-[#fed65b]/40 text-[11px] font-bold shadow-xs cursor-pointer"
                  title="Sign In / Register"
                  aria-label="Sign In"
                >
                  <User className="w-3.5 h-3.5 text-[#fed65b]" />
                  <span className="hidden sm:inline">Sign In / Register</span>
                </button>
              )}

              {/* Admin Portal Quick Access */}
              {(isAdminUser || isAdminAuthenticated) && (
                <button
                  id="header-admin-quick-btn"
                  onClick={() => setIsAdminOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#fed65b] hover:bg-[#ffe28a] text-[#012d1d] rounded-full transition-all text-[11px] font-extrabold shadow-sm border border-[#012d1d]/20 animate-fadeIn"
                  title="Open Admin Console"
                  aria-label="Admin Portal"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#012d1d]" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}

              {/* Cart Button with Total Amount Badge */}
              <button
                id="header-cart-btn"
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-1.5 bg-[#012d1d] hover:bg-[#144230] text-[#FAF3E0] px-2.5 py-1 rounded-full shadow-xs transition-all duration-200 border border-[#fed65b]/40 hover:scale-[1.02]"
                title="Open Cart"
                aria-label="Shopping Cart"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 text-[#fed65b]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-[#fed65b] text-[#012d1d] text-[9px] font-black rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-1 text-left">
                  <span className="text-[11px] font-bold text-[#fed65b]">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar with Category Filter */}
          <div className="mt-3 md:hidden">
            <div className="relative flex items-center bg-white dark:bg-[#162f22] rounded-full border border-[#d6caba] dark:border-[#275943] focus-within:border-[#c79a1f] focus-within:ring-2 focus-within:ring-[#c79a1f]/30 shadow-inner">
              {/* Category Quick Select */}
              <div className="relative shrink-0">
                <select
                  id="mobile-category-select"
                  value={selectedCategory}
                  onChange={(e) => handleSelectCategoryAndFilter(e.target.value as CategorySlug)}
                  className="pl-3 pr-6 py-2 text-xs font-semibold bg-transparent text-[#012d1d] dark:text-[#fed65b] border-r border-[#e2d8c9] dark:border-[#275943] focus:outline-none appearance-none cursor-pointer"
                  aria-label="Filter by Category"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-white dark:bg-[#162f22] text-[#012d1d] dark:text-[#FAF3E0]">
                      {cat.id === 'all' ? 'All' : cat.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[#8a7a5c] dark:text-[#8cb8a3] absolute right-1.5 top-2.5 pointer-events-none" />
              </div>

              {/* Search input field */}
              <div className="relative flex-1 flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  id="mobile-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit();
                    }
                  }}
                  placeholder={
                    selectedCategory === 'all'
                      ? t('searchPlaceholder')
                      : `Search in ${CATEGORIES.find((c) => c.id === selectedCategory)?.name}...`
                  }
                  className="w-full pl-8 pr-7 py-2 text-xs bg-transparent text-[#012d1d] dark:text-[#FAF3E0] placeholder-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Clear mobile search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Category Navigation Bar */}
        <nav className="border-t border-[#e8dfc8] dark:border-[#1b3d2c] bg-white/70 dark:bg-[#0c1f16]/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2.5 gap-2 text-xs font-semibold">
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  onClick={() => handleNavCategoryClick('all')}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-[#012d1d] text-[#fed65b] font-bold shadow-sm'
                      : 'text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  {t('shop')}
                </button>

                <button
                  onClick={() => handleNavCategoryClick('dry-fruits')}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    selectedCategory === 'dry-fruits'
                      ? 'bg-[#012d1d] text-[#fed65b] font-bold shadow-sm'
                      : 'text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  {t('dryFruits')}
                </button>

                <button
                  onClick={() => handleNavCategoryClick('spices')}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    selectedCategory === 'spices'
                      ? 'bg-[#012d1d] text-[#fed65b] font-bold shadow-sm'
                      : 'text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  {t('spices')}
                </button>

                <button
                  onClick={() => handleNavCategoryClick('seeds-berries')}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    selectedCategory === 'seeds-berries'
                      ? 'bg-[#012d1d] text-[#fed65b] font-bold shadow-sm'
                      : 'text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  {t('seedsBerries')}
                </button>

                <button
                  onClick={() => handleNavCategoryClick('gifting')}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    selectedCategory === 'gifting'
                      ? 'bg-[#012d1d] text-[#fed65b] font-bold shadow-sm'
                      : 'text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  {t('gifting')}
                </button>

                <button
                  onClick={() => handleNavCategoryClick('dates-exotics')}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    selectedCategory === 'dates-exotics'
                      ? 'bg-[#012d1d] text-[#fed65b] font-bold shadow-sm'
                      : 'text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#FAF3E0] dark:hover:bg-[#162f22]'
                  }`}
                >
                  Dates & Exotics
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0 border-l border-slate-200 dark:border-[#275943] pl-3">
                <button
                  onClick={() => {
                    setIsStoryOpen(true);
                  }}
                  className="px-3 py-1.5 text-[#012d1d] dark:text-[#FAF3E0] hover:text-[#c79a1f] dark:hover:text-[#fed65b] transition-colors"
                >
                  {t('ourStory')}
                </button>

                <button
                  onClick={() => setIsWholesaleOpen(true)}
                  className="px-3 py-1.5 bg-[#fed65b] hover:bg-[#e6bf47] text-[#012d1d] font-bold rounded-full shadow-sm transition-all text-[11px]"
                >
                  {t('bulkOrders')}
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="fixed inset-y-0 left-0 w-full max-w-xs sm:max-w-sm bg-[#FAF3E0] dark:bg-[#0f241a] shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#d6caba] dark:border-[#275943]">
                <BaagfreshLogo size="sm" showTagline={false} />
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              <div className="py-4 space-y-2 border-b border-[#d6caba] dark:border-[#275943]">
                  <div className="text-xs uppercase font-bold tracking-wider text-[#635336] dark:text-[#fed65b] mb-2 px-3">
                    Your Account
                  </div>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setIsProfileOpen(true); }}
                    className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22] flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" /> Wishlist
                  </button>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setIsNotificationsOpen(true); }}
                    className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22] flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" /> Notifications
                  </button>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setIsGmailHubOpen(true); }}
                    className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22] flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" /> Gmail Hub
                  </button>
                </div>

                <div className="py-4 space-y-2">
                <div className="text-xs uppercase font-bold tracking-wider text-[#635336] dark:text-[#fed65b] mb-2">
                  Browse Harvest
                </div>
                <button
                  onClick={() => handleNavCategoryClick('all')}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22]"
                >
                  {t('shop')}
                </button>
                <button
                  onClick={() => handleNavCategoryClick('dry-fruits')}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22]"
                >
                  {t('dryFruits')} (Almonds, Cashews, Walnuts)
                </button>
                <button
                  onClick={() => handleNavCategoryClick('spices')}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22]"
                >
                  {t('spices')} (Kashmiri Saffron, Cardamom)
                </button>
                <button
                  onClick={() => handleNavCategoryClick('seeds-berries')}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22]"
                >
                  {t('seedsBerries')}
                </button>
                <button
                  onClick={() => handleNavCategoryClick('gifting')}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22]"
                >
                  {t('gifting')}
                </button>
                <button
                  onClick={() => handleNavCategoryClick('dates-exotics')}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-[#012d1d] dark:text-[#FAF3E0] hover:bg-[#ece2c9] dark:hover:bg-[#162f22]"
                >
                  Dates & Exotics
                </button>
              </div>

              <div className="pt-4 border-t border-[#d6caba] dark:border-[#275943] space-y-2">
                <button
                  onClick={() => {
                    setIsChatbotOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 bg-gradient-to-r from-[#012d1d] to-[#1b4332] text-[#fed65b] border border-[#fed65b]/50 rounded-lg text-sm font-bold shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#fed65b] animate-pulse" />
                    <span>Ask AI Sommelier</span>
                  </div>
                  <span className="text-[10px] bg-[#fed65b] text-[#012d1d] font-black px-1.5 py-0.5 rounded">Gemini</span>
                </button>
                <button
                  onClick={() => {
                    setIsStoryOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-sm font-semibold text-[#012d1d] dark:text-[#FAF3E0]"
                >
                  {t('ourStory')} & Varanasi Heritage
                </button>
                <button
                  onClick={() => {
                    setIsWholesaleOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 bg-[#fed65b] text-[#012d1d] rounded-lg text-sm font-bold shadow-sm"
                >
                  {t('bulkOrders')} / Corporate Inquiry
                </button>
                <button
                  onClick={() => {
                    setIsAdminOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 bg-[#012d1d] text-[#fed65b] rounded-lg text-sm font-bold shadow-sm flex items-center justify-between"
                >
                  <span>Admin Control Center</span>
                  <ShieldCheck className="w-4 h-4 text-[#fed65b]" />
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-[#d6caba] dark:border-[#275943] text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>📍 Varanasi Hub, UP, India</p>
              <p>📞 {storeSettings.supportPhone || '+91 8707671319'}</p>
              <p>✉️ {storeSettings.supportEmail || 'contact@baagfresh.in'}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
