import { CurrencyCode, CurrencyConfig, LanguageOption } from '../types';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    rateFromINR: 1.0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rateFromINR: 0.0118,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rateFromINR: 0.0112,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rateFromINR: 0.0094,
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    rateFromINR: 0.0435,
  },
};

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
];

export function formatCurrencyPrice(amountInINR: number, currency: CurrencyConfig): string {
  const converted = amountInINR * currency.rateFromINR;
  if (currency.code === 'INR') {
    return `${currency.symbol}${Math.round(converted).toLocaleString('en-IN')}`;
  }
  return `${currency.symbol}${converted.toFixed(2)}`;
}
