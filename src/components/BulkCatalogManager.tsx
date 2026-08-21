import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Database, 
  Table, 
  FileText, 
  Check, 
  X, 
  Sparkles, 
  Package, 
  Search, 
  Filter, 
  Layers, 
  Loader2, 
  BadgeCheck, 
  Tag, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Product, CategorySlug, PackOption, NutritionFact } from '../types';
import { useApp } from '../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNavigate?: () => void;
}

type WizardStep = 'upload' | 'mapping' | 'validation' | 'syncing' | 'completed';

interface ColumnMapping {
  id: string;
  name: string;
  hindiName: string;
  category: string;
  basePrice: string;
  originalPrice: string;
  inStock: string;
  origin: string;
  description: string;
  harvestSeason: string;
  grading: string;
  badge: string;
  image: string;
  benefits: string;
  calories: string;
  protein: string;
}

interface ParsedRowValidation {
  rowNumber: number;
  raw: Record<string, any>;
  mappedProduct: Product;
  isExisting: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const DEFAULT_NUTRITION: NutritionFact = {
  calories: '575 kcal',
  protein: '21g',
  healthyFats: '49g',
  carbs: '22g',
  dietaryFiber: '12g',
  keyVitamins: 'Vitamin E, Magnesium, Zinc'
};

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'dry-fruits': 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=600&q=80',
  'spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  'seeds-berries': 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=600&q=80',
  'gifting': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
  'dates-exotics': 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=600&q=80'
};

export const BulkCatalogManager: React.FC<Props> = ({ isOpen, onClose, onSuccessNavigate }) => {
  const { products, bulkUpdateProducts, formatPrice, showToast, addNotification } = useApp();

  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  // Column Mapping state
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    id: '',
    name: '',
    hindiName: '',
    category: '',
    basePrice: '',
    originalPrice: '',
    inStock: '',
    origin: '',
    description: '',
    harvestSeason: '',
    grading: '',
    badge: '',
    image: '',
    benefits: '',
    calories: '',
    protein: ''
  });

  // Mode: Full catalog upsert vs. Stock & Pricing only
  const [importMode, setImportMode] = useState<'full' | 'stock_only'>('full');

  // Ingestion & Progress State
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncStatusText, setSyncStatusText] = useState<string>('');
  const [currentItemName, setCurrentItemName] = useState<string>('');
  const [syncLogs, setSyncLogs] = useState<{ time: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }[]>([]);
  const [syncSummary, setSyncSummary] = useState<{ total: number; created: number; updated: number; failed: number }>({
    total: 0,
    created: 0,
    updated: 0,
    failed: 0
  });

  // Validation filter
  const [validationFilter, setValidationFilter] = useState<'all' | 'valid' | 'updates' | 'new' | 'errors'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // HELPER: Auto-Map Headers
  // -------------------------------------------------------------
  const autoDetectMapping = (headers: string[]): ColumnMapping => {
    const findHeader = (...aliases: string[]) => {
      const found = headers.find(h => 
        aliases.some(alias => h.toLowerCase().trim() === alias.toLowerCase().trim() || h.toLowerCase().replace(/[^a-z0-9]/g, '') === alias.toLowerCase().replace(/[^a-z0-9]/g, ''))
      );
      return found || '';
    };

    return {
      id: findHeader('id', 'sku', 'product_id', 'code', 'item_id', 'product id'),
      name: findHeader('name', 'product_name', 'product name', 'title', 'item name', 'item'),
      hindiName: findHeader('hindiName', 'hindi_name', 'hindi name', 'regional name', 'hindi'),
      category: findHeader('category', 'category_slug', 'group', 'type', 'department'),
      basePrice: findHeader('basePrice', 'price', 'selling_price', 'rate', 'price_inr', 'base price'),
      originalPrice: findHeader('originalPrice', 'mrp', 'original_price', 'regular_price', 'list_price'),
      inStock: findHeader('inStock', 'stock', 'stock_status', 'available', 'is_in_stock', 'inventory'),
      origin: findHeader('origin', 'terroir', 'source', 'harvest_origin', 'location', 'region'),
      description: findHeader('description', 'desc', 'short_description', 'summary', 'about'),
      harvestSeason: findHeader('harvestSeason', 'season', 'harvest_season', 'harvest'),
      grading: findHeader('grading', 'grade', 'quality', 'batch_grade'),
      badge: findHeader('badge', 'tag', 'highlight', 'label'),
      image: findHeader('image', 'image_url', 'photo', 'picture', 'thumbnail'),
      benefits: findHeader('benefits', 'health_benefits', 'uses', 'highlights'),
      calories: findHeader('calories', 'energy', 'cal'),
      protein: findHeader('protein', 'proteins')
    };
  };

  // -------------------------------------------------------------
  // STEP 1: File Parser (.xlsx, .xls, .csv)
  // -------------------------------------------------------------
  const handleFileUpload = (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        setSheetNames(workbook.SheetNames);
        const firstSheet = workbook.SheetNames[0];
        setSelectedSheet(firstSheet);

        const worksheet = workbook.Sheets[firstSheet];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (json.length === 0) {
          showToast('The uploaded sheet is empty.', 'error');
          return;
        }

        // Extract headers
        const headers = Object.keys(json[0] || {});
        setRawHeaders(headers);
        setRawRows(json);

        // Auto-detect mappings
        const detected = autoDetectMapping(headers);
        setColumnMapping(detected);

        showToast(`Loaded ${json.length} rows from "${file.name}"`, 'success');
        setCurrentStep('mapping');
      } catch (err: any) {
        console.error('File parsing error:', err);
        showToast('Failed to parse spreadsheet. Please ensure it is a valid Excel or CSV file.', 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Switch active sheet if multiple exist
  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (!fileInputRef.current?.files?.[0]) return;
    const file = fileInputRef.current.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[sheet];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        if (json.length > 0) {
          const headers = Object.keys(json[0] || {});
          setRawHeaders(headers);
          setRawRows(json);
          setColumnMapping(autoDetectMapping(headers));
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // -------------------------------------------------------------
  // TEMPLATES & SPREADSHEET EXPORTERS
  // -------------------------------------------------------------
  const downloadSampleTemplate = (format: 'xlsx' | 'csv') => {
    const sampleData = [
      {
        'SKU': 'BF-MAMRA-ALM',
        'Product Name': 'Royal Kashmiri Mamra Almonds',
        'Hindi Name': 'कश्मीरी बादाम',
        'Category': 'dry-fruits',
        'Selling Price': 1499,
        'MRP': 1799,
        'Stock Status': 'In Stock',
        'Origin Terroir': 'Kashmir Valley',
        'Description': 'Cold-pressed grade-A royal Mamra almonds packed with organic natural oils.',
        'Harvest Season': 'Autumn 2026',
        'Grading': 'Grade-1 Jumbo Connoisseur',
        'Badge': 'Best Seller',
        'Image URL': 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=600&q=80',
        'Health Benefits': 'Rich in Vitamin E, Boosts cognitive vitality, 100% natural oil content'
      },
      {
        'SKU': 'BF-SAFFRON-MOGRA',
        'Product Name': 'Pampore Mogra Saffron (Grade A++)',
        'Hindi Name': 'केसर मोगरा',
        'Category': 'spices',
        'Selling Price': 749,
        'MRP': 899,
        'Stock Status': 'In Stock',
        'Origin Terroir': 'Pampore, Kashmir',
        'Description': 'Pure crimson stigma filaments hand-harvested at dawn with high crocin potency.',
        'Harvest Season': 'Autumn Flush 2026',
        'Grading': 'Grade A++ Super Negin',
        'Badge': '100% Pure',
        'Image URL': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
        'Health Benefits': 'Antioxidant rich, promotes glowing complexion, royal culinary aroma'
      },
      {
        'SKU': 'BF-CHIA-SEEDS',
        'Product Name': 'Organic Black Chia Seeds',
        'Hindi Name': 'चिया बीज',
        'Category': 'seeds-berries',
        'Selling Price': 399,
        'MRP': 499,
        'Stock Status': 'In Stock',
        'Origin Terroir': 'Madhya Pradesh',
        'Description': 'Premium raw whole black chia seeds loaded with dietary fiber and Omega-3.',
        'HarvestSeason': 'Winter 2026',
        'Grading': 'Triple Cleaned Raw Grade',
        'Badge': 'Organic',
        'Image URL': 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=600&q=80',
        'Health Benefits': 'Rich Omega-3 fatty acids, supports sustained energy and digestion'
      },
      {
        'SKU': 'BF-MEDJOOL-DATES',
        'Product Name': 'King Medjool Jumbo Dates',
        'Hindi Name': 'खजूर मेदजूल',
        'Category': 'dates-exotics',
        'Selling Price': 899,
        'MRP': 1099,
        'Stock Status': 'In Stock',
        'Origin Terroir': 'Jordan Valley',
        'Description': 'Caramel-soft succulent jumbo Medjool dates with natural unrefined sweetness.',
        'Harvest Season': 'Spring 2026',
        'Grading': 'Jumbo Connoisseur Choice',
        'Badge': 'Farm Fresh',
        'Image URL': 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=600&q=80',
        'Health Benefits': 'Immediate natural stamina, potassium rich, zero added sugars'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample_Catalog');

    if (format === 'xlsx') {
      XLSX.writeFile(wb, 'BaagFresh_Sample_Catalog_Template.xlsx');
    } else {
      XLSX.writeFile(wb, 'BaagFresh_Sample_Catalog_Template.csv');
    }

    showToast(`Downloaded sample ${format.toUpperCase()} template`, 'success');
  };

  const exportCurrentCatalog = (format: 'xlsx' | 'csv') => {
    const exportData = products.map((p) => ({
      'SKU / ID': p.id,
      'Product Name': p.name,
      'Hindi Name': p.hindiName || '',
      'Category': p.category,
      'Base Price (INR)': p.basePrice,
      'MRP / Original Price (INR)': p.originalPrice,
      'Stock Status': p.inStock ? 'In Stock' : 'Out of Stock',
      'Origin': p.origin,
      'Badge': p.badge || '',
      'Rating': p.rating,
      'Reviews Count': p.reviewsCount,
      'Harvest Season': p.harvestSeason,
      'Grading': p.grading,
      'Description': p.description,
      'Image URL': p.image,
      'Benefits': (p.benefits || []).join('; ')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Live_Catalog');

    const dateStr = new Date().toISOString().split('T')[0];
    if (format === 'xlsx') {
      XLSX.writeFile(wb, `BaagFresh_Live_Catalog_${dateStr}.xlsx`);
    } else {
      XLSX.writeFile(wb, `BaagFresh_Live_Catalog_${dateStr}.csv`);
    }

    showToast(`Exported ${products.length} live products to ${format.toUpperCase()}`, 'success');
  };

  // -------------------------------------------------------------
  // STEP 2 & 3: Validation Engine
  // -------------------------------------------------------------
  const validatedRecords = useMemo((): ParsedRowValidation[] => {
    if (rawRows.length === 0) return [];

    const existingMap = new Map(products.map(p => [p.id.toLowerCase(), p]));
    const nameMap = new Map(products.map(p => [p.name.toLowerCase().trim(), p]));

    return rawRows.map((raw, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Extract using mapping
      const rawId = String(raw[columnMapping.id] || '').trim();
      const rawName = String(raw[columnMapping.name] || '').trim();
      const rawHindi = String(raw[columnMapping.hindiName] || '').trim();
      const rawCategory = String(raw[columnMapping.category] || '').toLowerCase().trim();
      const rawPrice = Number(raw[columnMapping.basePrice]);
      const rawOriginalPrice = Number(raw[columnMapping.originalPrice]);
      const rawStock = raw[columnMapping.inStock];
      const rawOrigin = String(raw[columnMapping.origin] || '').trim();
      const rawDesc = String(raw[columnMapping.description] || '').trim();
      const rawSeason = String(raw[columnMapping.harvestSeason] || '').trim();
      const rawGrading = String(raw[columnMapping.grading] || '').trim();
      const rawBadge = String(raw[columnMapping.badge] || '').trim();
      const rawImage = String(raw[columnMapping.image] || '').trim();
      const rawBenefits = String(raw[columnMapping.benefits] || '').trim();

      // Check if updating existing
      let matchedExisting: Product | undefined = undefined;
      if (rawId && existingMap.has(rawId.toLowerCase())) {
        matchedExisting = existingMap.get(rawId.toLowerCase());
      } else if (rawName && nameMap.has(rawName.toLowerCase())) {
        matchedExisting = nameMap.get(rawName.toLowerCase());
      }

      const isExisting = Boolean(matchedExisting);

      // Validation 1: Name is required
      if (!rawName && !matchedExisting?.name) {
        errors.push('Product Name is required.');
      }

      // Validation 2: Price must be a positive number
      let basePrice = isNaN(rawPrice) || rawPrice <= 0 
        ? (matchedExisting?.basePrice || 0) 
        : rawPrice;

      if (basePrice <= 0) {
        errors.push('Valid Base Price (> 0) is required.');
      }

      let originalPrice = isNaN(rawOriginalPrice) || rawOriginalPrice < basePrice
        ? (matchedExisting?.originalPrice || Math.round(basePrice * 1.2))
        : rawOriginalPrice;

      // Validation 3: Category Coercion
      let category: Product['category'] = 'dry-fruits';
      if (['dry-fruits', 'spices', 'seeds-berries', 'gifting', 'dates-exotics'].includes(rawCategory)) {
        category = rawCategory as Product['category'];
      } else if (rawCategory.includes('spice')) {
        category = 'spices';
      } else if (rawCategory.includes('seed') || rawCategory.includes('berr')) {
        category = 'seeds-berries';
      } else if (rawCategory.includes('gift') || rawCategory.includes('hamper') || rawCategory.includes('box')) {
        category = 'gifting';
      } else if (rawCategory.includes('date') || rawCategory.includes('exotic')) {
        category = 'dates-exotics';
      } else if (matchedExisting) {
        category = matchedExisting.category;
      } else {
        warnings.push(`Unrecognized category "${rawCategory || 'empty'}", defaulted to "dry-fruits".`);
      }

      // Validation 4: Stock parsing
      let inStock = true;
      if (rawStock !== undefined && rawStock !== '') {
        const strVal = String(rawStock).toLowerCase().trim();
        if (strVal === 'false' || strVal === '0' || strVal === 'out of stock' || strVal === 'no' || strVal === 'sold out') {
          inStock = false;
        } else if (strVal === 'true' || strVal === '1' || strVal === 'in stock' || strVal === 'yes' || strVal === 'active') {
          inStock = true;
        }
      } else if (matchedExisting) {
        inStock = matchedExisting.inStock;
      }

      // Generate Clean ID if missing
      const cleanId = rawId || (matchedExisting?.id || `prod-${rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || Date.now() + '-' + index}`);

      // Benefits array
      let benefits: string[] = matchedExisting?.benefits || [
        '100% natural royal harvest',
        'Rich in authentic essential minerals',
        'Directly sourced from Varanasi connoisseur hub'
      ];
      if (rawBenefits) {
        benefits = rawBenefits.split(/[,;\n|]/).map(b => b.trim()).filter(Boolean);
      }

      // Images
      const image = rawImage || matchedExisting?.image || CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES['dry-fruits'];

      // Pack options
      let packOptions: PackOption[] = matchedExisting?.packOptions || [
        { weight: '250g', price: basePrice, originalPrice: originalPrice, discountPercent: Math.round(((originalPrice - basePrice) / originalPrice) * 100) || 15 },
        { weight: '500g', price: Math.round(basePrice * 1.9), originalPrice: Math.round(originalPrice * 1.9), discountPercent: 18, popular: true },
        { weight: '1kg', price: Math.round(basePrice * 3.6), originalPrice: Math.round(originalPrice * 3.6), discountPercent: 22 }
      ];

      // Build synthesized product object
      const finalProduct: Product = {
        id: cleanId,
        name: rawName || matchedExisting?.name || 'Untitled Harvest Product',
        hindiName: rawHindi || matchedExisting?.hindiName || rawName || 'ताज़ा उत्पाद',
        category,
        origin: rawOrigin || matchedExisting?.origin || 'Varanasi Royal Hub',
        description: rawDesc || matchedExisting?.description || `${rawName || 'Premium item'} harvested under royal standards.`,
        longDescription: matchedExisting?.longDescription || rawDesc || `${rawName || 'This product'} is curated directly from trusted orchards.`,
        image,
        gallery: matchedExisting?.gallery || [image],
        basePrice,
        originalPrice,
        rating: matchedExisting?.rating || 4.9,
        reviewsCount: matchedExisting?.reviewsCount || 110,
        badge: (rawBadge as Product['badge']) || matchedExisting?.badge || 'Farm Fresh',
        inStock,
        isOrganic: matchedExisting?.isOrganic ?? true,
        packOptions,
        nutrition: matchedExisting?.nutrition || DEFAULT_NUTRITION,
        harvestSeason: rawSeason || matchedExisting?.harvestSeason || 'Autumn 2026',
        grading: rawGrading || matchedExisting?.grading || 'Grade-1 Royal Connoisseur',
        benefits,
        reviews: matchedExisting?.reviews || []
      };

      return {
        rowNumber: index + 2, // 1-based + 1 for header row
        raw,
        mappedProduct: finalProduct,
        isExisting,
        isValid: errors.length === 0,
        errors,
        warnings
      };
    });
  }, [rawRows, columnMapping, products]);

  // Filtered preview rows
  const displayedRecords = useMemo(() => {
    return validatedRecords.filter((rec) => {
      // Tab filter
      if (validationFilter === 'valid' && !rec.isValid) return false;
      if (validationFilter === 'updates' && !rec.isExisting) return false;
      if (validationFilter === 'new' && rec.isExisting) return false;
      if (validationFilter === 'errors' && rec.isValid) return false;

      // Search filter
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const matchesName = rec.mappedProduct.name.toLowerCase().includes(query);
        const matchesId = rec.mappedProduct.id.toLowerCase().includes(query);
        const matchesCategory = rec.mappedProduct.category.toLowerCase().includes(query);
        return matchesName || matchesId || matchesCategory;
      }

      return true;
    });
  }, [validatedRecords, validationFilter, searchFilter]);

  const validCount = validatedRecords.filter(r => r.isValid).length;
  const updatesCount = validatedRecords.filter(r => r.isExisting && r.isValid).length;
  const newCount = validatedRecords.filter(r => !r.isExisting && r.isValid).length;
  const errorCount = validatedRecords.filter(r => !r.isValid).length;

  // -------------------------------------------------------------
  // STEP 4: Execution Engine (Batch Firestore Commit + App State Sync)
  // -------------------------------------------------------------
  const handleExecuteBatchIngestion = async () => {
    const validToSync = validatedRecords
      .filter(r => r.isValid)
      .map(r => r.mappedProduct);

    if (validToSync.length === 0) {
      showToast('No valid products to ingest.', 'error');
      return;
    }

    setCurrentStep('syncing');
    setSyncProgress(5);
    setSyncStatusText('Preparing Firestore batch transactions...');
    setSyncLogs([
      { time: new Date().toLocaleTimeString(), msg: `Initiating bulk update of ${validToSync.length} SKUs...`, type: 'info' }
    ]);

    try {
      const result = await bulkUpdateProducts(validToSync, (processed, total, itemName) => {
        const pct = Math.round((processed / total) * 90) + 5;
        setSyncProgress(pct);
        setCurrentItemName(itemName);
        setSyncStatusText(`Committed batch: ${processed}/${total} items to Firestore...`);
        setSyncLogs(prev => [
          ...prev.slice(-15),
          { time: new Date().toLocaleTimeString(), msg: `Synced SKU: ${itemName} (${processed}/${total})`, type: 'info' }
        ]);
      });

      setSyncProgress(100);
      setSyncStatusText('Catalog synchronization completed successfully!');
      setSyncSummary({
        total: validToSync.length,
        created: newCount,
        updated: updatesCount,
        failed: errorCount
      });

      setSyncLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), msg: `Successfully committed ${validToSync.length} items to Cloud Firestore & Master Catalog!`, type: 'success' }
      ]);

      setCurrentStep('completed');
    } catch (err: any) {
      console.error('Batch execution failed:', err);
      setSyncStatusText('Sync finished with errors.');
      setSyncLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), msg: `Error: ${err?.message || 'Transaction aborted'}`, type: 'error' }
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-[#07130d] w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-[#1b4332] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* TOP HEADER */}
        <div className="px-6 py-4 bg-[#012d1d] text-white border-b border-[#1b4332] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fed65b] text-[#012d1d] flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cinzel text-lg font-bold text-white">
                  Bulk Catalog & Stock Ingestion
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#fed65b] text-[#012d1d]">
                  Excel / CSV • Firestore Direct
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Upload .xlsx, .xls, or .csv files with column mapping, automated validation, and live Firestore sync.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#0d2217] border-b border-slate-200 dark:border-[#1b4332] flex items-center justify-between text-xs overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all ${
              currentStep === 'upload' 
                ? 'bg-[#012d1d] text-[#fed65b] dark:bg-[#fed65b] dark:text-[#012d1d]' 
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              <span className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center text-[10px]">1</span>
              <span>Upload File</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all ${
              currentStep === 'mapping' 
                ? 'bg-[#012d1d] text-[#fed65b] dark:bg-[#fed65b] dark:text-[#012d1d]' 
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              <span className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center text-[10px]">2</span>
              <span>Map Columns</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all ${
              currentStep === 'validation' 
                ? 'bg-[#012d1d] text-[#fed65b] dark:bg-[#fed65b] dark:text-[#012d1d]' 
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              <span className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center text-[10px]">3</span>
              <span>Validation ({validatedRecords.length})</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all ${
              currentStep === 'syncing' || currentStep === 'completed'
                ? 'bg-emerald-600 text-white' 
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">4</span>
              <span>Firestore Sync</span>
            </div>
          </div>

          {/* Quick Export Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => exportCurrentCatalog('xlsx')}
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#012d1d] dark:hover:text-[#fed65b] flex items-center gap-1"
              title="Download full existing catalog as Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Live Catalog</span>
            </button>
          </div>
        </div>

        {/* MAIN BODY PER STEP */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: UPLOAD & TEMPLATE SELECTION */}
          {/* ========================================================================= */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* Drag & Drop Zone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-[#fed65b]/60 dark:border-emerald-500/40 hover:border-[#012d1d] dark:hover:border-[#fed65b] bg-[#FAF3E0]/60 dark:bg-[#0d2217]/50 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all hover:bg-[#FAF3E0] dark:hover:bg-[#0d2217] group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-3xl bg-white dark:bg-[#162f22] text-[#012d1d] dark:text-[#fed65b] mx-auto flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-4 border border-slate-200 dark:border-[#275943]">
                  <Upload className="w-8 h-8" />
                </div>

                <h4 className="font-cinzel text-lg font-bold text-[#012d1d] dark:text-[#fed65b] mb-1">
                  Choose Excel or CSV File to Ingest
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-4">
                  Drag and drop your spreadsheet here, or click to browse files from your local device (.xlsx, .xls, .csv).
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#012d1d] text-[#fed65b] text-xs font-bold shadow-md group-hover:bg-[#144230]">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Select Spreadsheet</span>
                </div>
              </div>

              {/* Ingestion Mode Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => setImportMode('full')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    importMode === 'full'
                      ? 'border-[#012d1d] dark:border-[#fed65b] bg-emerald-50/50 dark:bg-[#0d2a1c] ring-1 ring-[#012d1d] dark:ring-[#fed65b]'
                      : 'border-slate-200 dark:border-[#1b4332] bg-white dark:bg-[#0f241a]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#012d1d] dark:text-[#fed65b]" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">Full Catalog Ingestion</span>
                    </div>
                    {importMode === 'full' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Creates brand new product SKUs if not found, and updates existing prices, origin, nutritional facts, and descriptions.
                  </p>
                </div>

                <div 
                  onClick={() => setImportMode('stock_only')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    importMode === 'stock_only'
                      ? 'border-[#012d1d] dark:border-[#fed65b] bg-emerald-50/50 dark:bg-[#0d2a1c] ring-1 ring-[#012d1d] dark:ring-[#fed65b]'
                      : 'border-slate-200 dark:border-[#1b4332] bg-white dark:bg-[#0f241a]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#012d1d] dark:text-[#fed65b]" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">Stock & Pricing Only</span>
                    </div>
                    {importMode === 'stock_only' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Fast update mode. Matches products by SKU/ID or Name and synchronizes availability (In/Out of Stock) and new rates.
                  </p>
                </div>
              </div>

              {/* Sample Templates & Guides */}
              <div className="p-4 bg-slate-50 dark:bg-[#0d2217] rounded-2xl border border-slate-200 dark:border-[#1b4332] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white mb-0.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#fed65b]" />
                    <span>Need a starting spreadsheet?</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Download our formatted template with example Kashmiri Mamra Almonds, Saffron, and Dates.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => downloadSampleTemplate('xlsx')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#162f22] border border-slate-200 dark:border-[#275943] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#012d1d] flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Sample (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => downloadSampleTemplate('csv')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#162f22] border border-slate-200 dark:border-[#275943] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#012d1d] flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Sample (.csv)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: COLUMN MAPPING */}
          {/* ========================================================================= */}
          {currentStep === 'mapping' && (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-3.5 bg-[#FAF3E0] dark:bg-[#0f241a] rounded-2xl border border-[#d6caba] dark:border-[#275943] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="font-bold text-slate-900 dark:text-white">{fileName}</span>
                  <span className="text-slate-400">({fileSize})</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                    {rawRows.length} Rows Detected
                  </span>
                </div>

                {sheetNames.length > 1 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Sheet:</span>
                    <select
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs font-semibold"
                    >
                      {sheetNames.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Column Mapping Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-cinzel text-sm font-bold text-[#012d1d] dark:text-[#fed65b]">
                    Map Spreadsheet Columns to Catalog Fields
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    * Required fields
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {/* SKU / ID */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943]">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Product SKU / Unique ID
                    </label>
                    <select
                      value={columnMapping.id}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, id: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-white"
                    >
                      <option value="">-- Auto generate from name --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">Used to match existing items</div>
                  </div>

                  {/* Product Name */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f241a] rounded-2xl border border-emerald-300 dark:border-emerald-700/60">
                    <label className="block font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                      Product Name *
                    </label>
                    <select
                      value={columnMapping.name}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="">-- Select Column --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">Display title in royal store</div>
                  </div>

                  {/* Hindi Name */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943]">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Hindi / Regional Name
                    </label>
                    <select
                      value={columnMapping.hindiName}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, hindiName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-white"
                    >
                      <option value="">-- Not specified --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">e.g. कश्मीरी बादाम</div>
                  </div>

                  {/* Base Price */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f241a] rounded-2xl border border-emerald-300 dark:border-emerald-700/60">
                    <label className="block font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                      Selling Price (INR) *
                    </label>
                    <select
                      value={columnMapping.basePrice}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, basePrice: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="">-- Select Column --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">Live customer price</div>
                  </div>

                  {/* Original / MRP Price */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943]">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      MRP / Original Price (INR)
                    </label>
                    <select
                      value={columnMapping.originalPrice}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, originalPrice: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-white"
                    >
                      <option value="">-- Default to +20% of Price --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">Strikethrough reference MRP</div>
                  </div>

                  {/* Category */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943]">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Category
                    </label>
                    <select
                      value={columnMapping.category}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="">-- Default to "Dry Fruits" --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">Dry Fruits, Spices, Seeds, etc.</div>
                  </div>

                  {/* Stock Status */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943]">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Stock Availability
                    </label>
                    <select
                      value={columnMapping.inStock}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, inStock: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-white"
                    >
                      <option value="">-- Default to "In Stock" --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">True / False / In Stock / Qty</div>
                  </div>

                  {/* Origin Terroir */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943]">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Origin Terroir
                    </label>
                    <select
                      value={columnMapping.origin}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, origin: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-white"
                    >
                      <option value="">-- Default to "Varanasi Royal Hub" --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">e.g. Kashmir, Pampore, Jordan</div>
                  </div>

                  {/* Description */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943]">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Description / Highlights
                    </label>
                    <select
                      value={columnMapping.description}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-white"
                    >
                      <option value="">-- Auto-generate --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">Short summary for store card</div>
                  </div>

                  {/* Grading / Badge */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943]">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Grading & Badge
                    </label>
                    <select
                      value={columnMapping.grading}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, grading: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-white"
                    >
                      <option value="">-- Default Grade-1 Royal --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">e.g. Grade-1 Jumbo</div>
                  </div>

                  {/* Image URL */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943]">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Image URL (Photo)
                    </label>
                    <select
                      value={columnMapping.image}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-white"
                    >
                      <option value="">-- Fallback to curated image --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">Web URL or CDN link</div>
                  </div>

                  {/* Benefits */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f241a] rounded-2xl border border-slate-200 dark:border-[#275943]">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Health Benefits
                    </label>
                    <select
                      value={columnMapping.benefits}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, benefits: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-white"
                    >
                      <option value="">-- Standard harvest benefits --</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">Comma or semicolon separated</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: VALIDATION & DATA INSPECTION */}
          {/* ========================================================================= */}
          {currentStep === 'validation' && (
            <div className="space-y-4">
              {/* Validation Summary Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f241a] border border-slate-200 dark:border-[#275943] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Valid SKUs</div>
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {validCount} / {validatedRecords.length}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f241a] border border-slate-200 dark:border-[#275943] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Updates Existing</div>
                    <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {updatesCount} Items
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f241a] border border-slate-200 dark:border-[#275943] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">New SKUs to Add</div>
                    <div className="text-base font-bold text-purple-600 dark:text-purple-400">
                      {newCount} Items
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f241a] border border-slate-200 dark:border-[#275943] flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    errorCount > 0 
                      ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {errorCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Errors / Blocked</div>
                    <div className={`text-base font-bold ${errorCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                      {errorCount} Rows
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setValidationFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      validationFilter === 'all'
                        ? 'bg-[#012d1d] text-[#fed65b] dark:bg-[#fed65b] dark:text-[#012d1d]'
                        : 'bg-slate-100 dark:bg-[#162f22] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    All ({validatedRecords.length})
                  </button>

                  <button
                    onClick={() => setValidationFilter('valid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      validationFilter === 'valid'
                        ? 'bg-[#012d1d] text-[#fed65b] dark:bg-[#fed65b] dark:text-[#012d1d]'
                        : 'bg-slate-100 dark:bg-[#162f22] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    Ready ({validCount})
                  </button>

                  <button
                    onClick={() => setValidationFilter('updates')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      validationFilter === 'updates'
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 dark:bg-[#162f22] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    Updates ({updatesCount})
                  </button>

                  <button
                    onClick={() => setValidationFilter('new')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      validationFilter === 'new'
                        ? 'bg-purple-700 text-white'
                        : 'bg-slate-100 dark:bg-[#162f22] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    New SKUs ({newCount})
                  </button>

                  {errorCount > 0 && (
                    <button
                      onClick={() => setValidationFilter('errors')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        validationFilter === 'errors'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      Errors ({errorCount})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search preview rows..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#275943] bg-white dark:bg-[#162f22] text-xs text-slate-800 dark:text-slate-200 w-full sm:w-56"
                  />
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-slate-200 dark:border-[#275943] rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-72 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-[#162f22] text-slate-700 dark:text-slate-300 sticky top-0 z-10 text-[11px] font-bold border-b border-slate-200 dark:border-[#275943]">
                      <tr>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Row</th>
                        <th className="py-2.5 px-3">SKU / ID</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Selling Price</th>
                        <th className="py-2.5 px-3">MRP</th>
                        <th className="py-2.5 px-3">Stock Status</th>
                        <th className="py-2.5 px-3">Origin</th>
                        <th className="py-2.5 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#162f22] text-slate-800 dark:text-slate-200">
                      {displayedRecords.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400">
                            No records match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        displayedRecords.map((rec) => (
                          <tr 
                            key={rec.rowNumber}
                            className={`hover:bg-slate-50/80 dark:hover:bg-[#11291d] transition-colors ${
                              !rec.isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {rec.isValid ? (
                                rec.isExisting ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    <span>Update</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>New</span>
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300" title={rec.errors.join(', ')}>
                                  <XCircle className="w-2.5 h-2.5" />
                                  <span>Error</span>
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                              #{rec.rowNumber}
                            </td>

                            <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-[#012d1d] dark:text-[#fed65b]">
                              {rec.mappedProduct.id}
                            </td>

                            <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white max-w-[180px] truncate" title={rec.mappedProduct.name}>
                              {rec.mappedProduct.name}
                            </td>

                            <td className="py-2.5 px-3 capitalize">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#162f22] text-[10px] font-medium">
                                {rec.mappedProduct.category.replace('-', ' ')}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                              {formatPrice(rec.mappedProduct.basePrice)}
                            </td>

                            <td className="py-2.5 px-3 text-slate-400 line-through text-[11px]">
                              {formatPrice(rec.mappedProduct.originalPrice)}
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {rec.mappedProduct.inStock ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                  In Stock
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                                  Out of Stock
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px] max-w-[120px] truncate">
                              {rec.mappedProduct.origin}
                            </td>

                            <td className="py-2.5 px-3 text-[10px] text-slate-400">
                              {rec.errors.length > 0 ? (
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">{rec.errors[0]}</span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">Ready to Ingest</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: REAL-TIME INGESTION PROGRESS & LOGS */}
          {/* ========================================================================= */}
          {currentStep === 'syncing' && (
            <div className="p-8 bg-[#0f241a] text-white rounded-3xl border border-[#275943] text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-[#fed65b] text-[#012d1d] mx-auto flex items-center justify-center shadow-xl animate-bounce">
                <Database className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-cinzel text-xl font-bold text-[#fed65b] mb-1">
                  Synchronizing with Cloud Firestore...
                </h4>
                <p className="text-xs text-slate-300">
                  {syncStatusText}
                </p>
                {currentItemName && (
                  <div className="text-[11px] text-emerald-400 font-mono mt-1">
                    Current SKU: {currentItemName}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Ingestion Progress</span>
                  <span>{syncProgress}%</span>
                </div>
                <div className="w-full h-3.5 bg-black/40 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-[#fed65b] to-emerald-400 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>

              {/* Live Trace Terminal */}
              <div className="max-w-lg mx-auto bg-black/60 rounded-2xl p-4 border border-white/10 text-left font-mono text-[11px] h-36 overflow-y-auto space-y-1 scrollbar-thin">
                {syncLogs.map((log, idx) => (
                  <div key={idx} className={`leading-relaxed ${
                    log.type === 'success' ? 'text-emerald-400 font-bold' :
                    log.type === 'error' ? 'text-rose-400 font-bold' :
                    log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'
                  }`}>
                    <span className="text-slate-500">[{log.time}]</span> {log.msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: COMPLETION REPORT */}
          {/* ========================================================================= */}
          {currentStep === 'completed' && (
            <div className="p-8 bg-gradient-to-br from-emerald-50 to-white dark:from-[#0d2a1c] dark:to-[#07130d] rounded-3xl border border-emerald-200 dark:border-[#275943] text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-cinzel text-xl font-bold text-[#012d1d] dark:text-[#fed65b] mb-1">
                  Bulk Ingestion & Firestore Sync Complete!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  All valid inventory items and pricing updates have been safely committed into your provisioned Cloud Firestore database.
                </p>
              </div>

              {/* Results metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto">
                <div className="p-3 bg-white dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943]">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total Ingested</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white font-cinzel">{syncSummary.total}</div>
                </div>

                <div className="p-3 bg-white dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943]">
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold">Updated Existing</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400 font-cinzel">{syncSummary.updated}</div>
                </div>

                <div className="p-3 bg-white dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943]">
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-bold">New SKUs Added</div>
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400 font-cinzel">{syncSummary.created}</div>
                </div>

                <div className="p-3 bg-white dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943]">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Firestore Sync</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-cinzel mt-1">100% Active</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <button
                  onClick={() => {
                    onClose();
                    if (onSuccessNavigate) onSuccessNavigate();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  <span>View Updated Royal Catalog</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentStep('upload');
                    setRawRows([]);
                    setFileName('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white dark:bg-[#162f22] border border-slate-200 dark:border-[#275943] text-slate-700 dark:text-slate-200 font-semibold text-xs hover:border-[#012d1d] transition-all flex items-center gap-2 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Ingest Another File</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM STEP CONTROLS */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#0d2217] border-t border-slate-200 dark:border-[#1b4332] flex items-center justify-between">
          <div>
            {currentStep === 'mapping' && (
              <button
                onClick={() => setCurrentStep('upload')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#162f22] transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Upload</span>
              </button>
            )}

            {currentStep === 'validation' && (
              <button
                onClick={() => setCurrentStep('mapping')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#162f22] transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Adjust Mappings</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 'upload' && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#162f22] transition-colors"
              >
                Cancel
              </button>
            )}

            {currentStep === 'mapping' && (
              <button
                onClick={() => {
                  if (!columnMapping.name || !columnMapping.basePrice) {
                    showToast('Please map at least Product Name and Selling Price columns.', 'warning');
                    return;
                  }
                  setCurrentStep('validation');
                }}
                className="px-6 py-2 rounded-xl bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <span>Validate & Inspect Rows ({rawRows.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 'validation' && (
              <button
                onClick={handleExecuteBatchIngestion}
                disabled={validCount === 0}
                className={`px-6 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
                  validCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Ingest & Sync {validCount} SKUs to Firestore</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
