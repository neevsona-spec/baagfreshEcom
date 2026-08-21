import React from 'react';
import { 
  X, 
  Bell, 
  Truck, 
  Tag, 
  Sparkles, 
  ShieldCheck, 
  CheckCheck, 
  Trash2 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotificationsModal: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    setTrackingOrder,
    orders
  } = useApp();

  if (!isNotificationsOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'promo':
        return <Tag className="w-4 h-4 text-[#c79a1f] dark:text-[#fed65b]" />;
      case 'stock':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleNotificationClick = (notifId: string, orderId?: string) => {
    markNotificationAsRead(notifId);
    if (orderId) {
      const match = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
      if (match) {
        setIsNotificationsOpen(false);
        setTrackingOrder(match);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f241a] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#275943] overflow-hidden my-auto max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:px-6 bg-[#FAF3E0] dark:bg-[#162f22] border-b border-[#e8dfc8] dark:border-[#275943] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#012d1d] text-[#fed65b] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="font-cinzel text-base sm:text-lg font-bold text-[#012d1d] dark:text-[#FAF3E0]">
              Notifications & Alerts
            </h2>
          </div>

          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-[#11241a] border-b border-slate-200 dark:border-[#275943] flex justify-between items-center text-xs">
          <button
            onClick={markAllNotificationsAsRead}
            className="text-slate-600 dark:text-slate-400 hover:text-[#012d1d] dark:hover:text-[#fed65b] font-semibold flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>

          <button
            onClick={clearAllNotifications}
            className="text-red-600 dark:text-red-400 hover:underline font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1 text-xs">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>No new notifications right now.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n.id, n.orderId)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  n.read
                    ? 'bg-white dark:bg-[#162f22]/50 border-slate-200 dark:border-[#275943]/40 opacity-80'
                    : 'bg-[#FAF3E0]/70 dark:bg-[#162f22] border-[#e8dfc8] dark:border-[#275943] shadow-sm'
                }`}
              >
                <div className="p-2 rounded-xl bg-white dark:bg-[#0f241a] border border-slate-200 dark:border-[#275943] shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono ml-2">
                      {n.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    {n.message}
                  </p>
                  {n.orderId && (
                    <span className="inline-block mt-1 text-[10px] text-[#012d1d] dark:text-[#fed65b] font-bold hover:underline">
                      Tap to open live courier tracker →
                    </span>
                  )}
                </div>

                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-[#c79a1f] shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
