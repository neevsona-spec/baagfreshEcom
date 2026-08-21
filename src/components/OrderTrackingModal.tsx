import React from 'react';
import { 
  X, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Package, 
  ShieldCheck, 
  Navigation,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resolveProductImage } from '../utils/productImageResolver';

export const OrderTrackingModal: React.FC = () => {
  const { trackingOrder, setTrackingOrder, formatPrice } = useApp();

  if (!trackingOrder) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0f241a] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#275943] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:px-6 bg-[#012d1d] text-[#FAF3E0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1b4332] text-[#fed65b] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel text-base sm:text-lg font-bold text-white">
                  Live Harvest Tracking
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fed65b] text-[#012d1d] uppercase">
                  {trackingOrder.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-[#e6deca]">
                Tracking Ref: <span className="font-mono font-bold text-[#fed65b]">{trackingOrder.orderNumber}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setTrackingOrder(null)}
            className="p-1.5 rounded-full hover:bg-[#1b4332] text-slate-300 hover:text-white transition-colors"
            aria-label="Close tracking"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* Simulated Map View */}
          <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-inner flex items-center justify-center">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fed65b_1px,transparent_1px)] [background-size:16px_16px]" />
            
            {/* SVG Path Route */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 60 120 Q 200 40 380 90 T 680 70"
                fill="none"
                stroke="#fed65b"
                strokeWidth="3"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
            </svg>

            {/* Origin Pin (Varanasi Central Hub) */}
            <div className="absolute left-6 sm:left-12 top-20 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#012d1d] border-2 border-[#fed65b] text-white flex items-center justify-center shadow-lg">
                <span className="text-xs">🌿</span>
              </div>
              <span className="text-[10px] font-bold text-white bg-black/80 px-2 py-0.5 rounded-full mt-1">
                Varanasi Hub
              </span>
            </div>

            {/* Moving Delivery Van */}
            <div className="absolute left-1/2 top-14 -translate-x-1/2 flex flex-col items-center animate-pulse-subtle">
              <div className="w-10 h-10 rounded-full bg-[#fed65b] text-[#012d1d] flex items-center justify-center shadow-2xl ring-4 ring-[#fed65b]/30">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-[#012d1d] bg-[#fed65b] px-2 py-0.5 rounded-full mt-1 shadow-md">
                In Transit
              </span>
            </div>

            {/* Destination Pin */}
            <div className="absolute right-6 sm:right-12 top-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center shadow-lg">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-white bg-black/80 px-2 py-0.5 rounded-full mt-1 truncate max-w-[100px]">
                {trackingOrder.shippingAddress.city}
              </span>
            </div>
          </div>

          {/* Courier Driver & Delivery ETA Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#FAF3E0] dark:bg-[#162f22] rounded-2xl border border-[#e8dfc8] dark:border-[#275943] flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#012d1d] text-[#fed65b] flex items-center justify-center font-bold text-lg shrink-0">
                SV
              </div>
              <div className="text-xs">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Assigned Courier Partner</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">Suresh Verma (BlueDart Air)</div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 mt-0.5">
                  <Phone className="w-3 h-3 text-[#c79a1f]" />
                  <span>+91 98390 12894</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF3E0] dark:bg-[#162f22] rounded-2xl border border-[#e8dfc8] dark:border-[#275943] flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Expected Handover</div>
                <div className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">{trackingOrder.eta}</div>
                <div className="text-slate-600 dark:text-slate-400">Verified Doorstep Delivery</div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Progress Timeline */}
          <div>
            <h4 className="font-cinzel text-sm font-bold text-[#012d1d] dark:text-[#FAF3E0] mb-4">
              Dispatch & Delivery Milestones
            </h4>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-[#275943]">
              {trackingOrder.trackingSteps.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      step.completed
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 bg-slate-50 dark:bg-[#162f22] p-3 rounded-xl border border-slate-200 dark:border-[#275943]/60 text-xs">
                    <div className="flex justify-between items-center mb-0.5">
                      <h5 className="font-bold text-slate-900 dark:text-slate-100">
                        {step.title}
                      </h5>
                      <span className="text-[11px] text-slate-400 font-mono">{step.date}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Package Contents Summary */}
          <div className="p-4 bg-white dark:bg-[#162f22] rounded-2xl border border-slate-200 dark:border-[#275943] text-xs">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#c79a1f]" />
              <span>Consignment Contents ({trackingOrder.items.length} items)</span>
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-[#275943]/60">
              {trackingOrder.items.map((it) => (
                <div key={it.id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={resolveProductImage(it.product)}
                      alt={it.product.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {it.product.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Pack: {it.selectedWeight} • Qty: {it.quantity}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-[#012d1d] dark:text-[#fed65b]">
                    {formatPrice(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
