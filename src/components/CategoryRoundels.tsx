import React from 'react';
import { CATEGORIES } from '../data/products';
import { useApp } from '../context/AppContext';
import { CategorySlug } from '../types';

export const CategoryRoundels: React.FC = () => {
  const { selectedCategory, setSelectedCategory, t } = useApp();

  const handleCategorySelect = (id: CategorySlug) => {
    setSelectedCategory(id);
    const catalogElem = document.getElementById('catalog-section');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8 sm:py-12 bg-white dark:bg-[#0c1c14] border-b border-slate-200 dark:border-[#1c3c2b] transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="text-xs uppercase font-bold tracking-widest text-[#c79a1f] dark:text-[#fed65b]">
            Direct From The Orchards
          </span>
          <h2 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold text-[#012d1d] dark:text-[#FAF3E0] mt-1">
            Explore Handpicked Collections
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
            Select a category to discover natural grade-1 dry fruits, spices, and royal bespoke hampers.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`group cursor-pointer flex flex-col items-center text-center p-3 rounded-2xl transition-all duration-300 ${
                  isSelected
                    ? 'bg-[#FAF3E0] dark:bg-[#162f22] ring-2 ring-[#c79a1f] dark:ring-[#fed65b] shadow-md scale-105'
                    : 'hover:bg-slate-50 dark:hover:bg-[#11241a] hover:scale-102'
                }`}
              >
                {/* Roundel Image */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 border-2 border-amber-200 dark:border-[#275943] shadow-md group-hover:border-[#fed65b] transition-colors">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>

                <h3 className="font-display text-xs sm:text-sm font-bold text-[#012d1d] dark:text-[#FAF3E0] group-hover:text-[#c79a1f] dark:group-hover:text-[#fed65b] transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {cat.hindiName}
                </span>
                <span className="mt-1 text-[10px] bg-slate-100 dark:bg-[#1f3f2f] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                  {cat.itemCount} items
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
