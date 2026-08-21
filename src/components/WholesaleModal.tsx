import React, { useState } from 'react';
import { X, Building2, Phone, Mail, User, PackageCheck, Send, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const WholesaleModal: React.FC = () => {
  const { isWholesaleOpen, setIsWholesaleOpen, addWholesaleInquiry } = useApp();
  const [submitted, setSubmitted] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requirement, setRequirement] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('50kg - 100kg');

  if (!isWholesaleOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactPerson || !phone || !requirement) return;

    addWholesaleInquiry({
      companyName,
      contactPerson,
      email,
      phone,
      requirement,
      estimatedQuantity,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsWholesaleOpen(false);
      setCompanyName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setRequirement('');
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0f241a] rounded-3xl shadow-2xl border border-[#d6caba] dark:border-[#275943] overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-[#012d1d] text-[#FAF3E0] px-6 py-5 flex items-center justify-between border-b border-[#1b4332]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#163a2c] text-[#fed65b] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cinzel text-lg font-bold text-white">
                  Bulk & Wholesale Inquiries
                </h3>
                <span className="text-[10px] bg-[#fed65b] text-[#012d1d] font-bold px-2 py-0.5 rounded-full">
                  B2B Direct
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Direct orchard pricing for hotels, sweetmakers, banquet halls & corporate gifting.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWholesaleOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#163a2c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-cinzel text-xl font-bold text-[#012d1d] dark:text-[#fed65b]">
              Inquiry Dispatched to Varanasi Hub!
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Our B2B trade desk manager will review your requirement and reach out with wholesale tier quotations within 2 business hours.
            </p>
            <div className="text-[11px] text-slate-400">
              Ref: Inq registered in Admin Control Center.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Enterprise / Firm Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Taj Ganges, Kashi Sweets"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#012d1d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Contact Person & Title *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Sanjay Agarwal (Director)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#012d1d]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Contact Phone / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#012d1d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trade@company.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#012d1d]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Estimated Order Volume / Frequency
              </label>
              <select
                value={estimatedQuantity}
                onChange={(e) => setEstimatedQuantity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#012d1d]"
              >
                <option value="25kg - 50kg (Trial Batch)">25kg - 50kg (Trial Batch)</option>
                <option value="50kg - 100kg">50kg - 100kg</option>
                <option value="100kg - 500kg Monthly">100kg - 500kg Monthly Contract</option>
                <option value="500kg+ Bulk Container">500kg+ Bulk Harvest Consignment</option>
                <option value="Custom Gift Trunks (100+ Boxes)">Custom Gift Trunks (100+ Boxes)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Required Products & Specifications *
              </label>
              <textarea
                required
                rows={3}
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="Mention desired dry fruits (e.g. Mamra Almonds, W-180 Jumbo Cashews, Kashmiri Mongra Saffron), customized packaging, or delivery timelines..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#275943] bg-white dark:bg-[#162f22] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#012d1d]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-[#fed65b]" />
                <span>GST Invoicing & FSSAI Lab CoAs Provided</span>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#012d1d] hover:bg-[#144230] text-[#fed65b] font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Wholesale Inquiry</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
