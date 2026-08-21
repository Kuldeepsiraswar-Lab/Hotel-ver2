import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  QrCode, 
  Utensils, 
  Receipt, 
  Volume2, 
  VolumeX, 
  Music, 
  ExternalLink,
  Sparkles,
  Clock,
  CircleDot
} from 'lucide-react';
import { AppNotification, BillOrder, RestaurantProfile } from '../types';
import { isSoundEnabled, setSoundEnabled, testChimeSound, playOrderChimeSound } from '../utils/sound';

interface NotificationMenuProps {
  notifications: AppNotification[];
  orders: BillOrder[];
  profile: RestaurantProfile;
  onViewOrder: (order: BillOrder) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectTableInPOS?: (tableNumber: string) => void;
}

export const NotificationMenu: React.FC<NotificationMenuProps> = ({
  notifications,
  orders,
  profile,
  onViewOrder,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectTableInPOS,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'qr' | 'unread'>('all');
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());
  const [justPlayedChime, setJustPlayedChime] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const qrOrdersCount = notifications.filter(n => n.type === 'qr_order').length;

  // Toggle sound alert
  const handleToggleSound = () => {
    const newState = !soundActive;
    setSoundActive(newState);
    setSoundEnabled(newState);
    if (newState) {
      testChimeSound();
    }
  };

  const handleTestChime = (e: React.MouseEvent) => {
    e.stopPropagation();
    setJustPlayedChime(true);
    testChimeSound();
    setTimeout(() => setJustPlayedChime(false), 1200);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'qr') return n.type === 'qr_order';
    return true;
  });

  const formatTimeAgo = (isoDate: string) => {
    try {
      const diffSecs = Math.floor((new Date().getTime() - new Date(isoDate).getTime()) / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Trigger Button */}
      <button
        id="navbar-notification-bell-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Order Notifications"
        title="Table QR Orders & Kitchen Notifications"
        className={`relative p-2 rounded-xl transition-all border cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/30'
            : unreadCount > 0
            ? 'bg-slate-800 text-amber-400 border-amber-400/50 hover:bg-slate-700/80 shadow-xs'
            : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border-slate-700/70'
        }`}
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
        
        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span 
            id="navbar-notification-badge-count"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-md animate-pulse border-2 border-slate-900"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          id="navbar-notification-dropdown-panel"
          className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-12 z-50 w-[calc(100vw-1rem)] sm:w-[420px] max-w-[440px] bg-slate-900 text-slate-100 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  Order Notifications
                  {unreadCount > 0 && (
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">Live QR self-orders & table alerts</p>
              </div>
            </div>

            {/* Sound Mute/Unmute & Test Control */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleTestChime}
                title="Test Chime Sound"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                  justPlayedChime
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 scale-105'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] hidden sm:inline">Test</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSound}
                title={soundActive ? "Mute order sound chime" : "Unmute order sound chime"}
                className={`p-1.5 rounded-lg text-xs transition-all border cursor-pointer ${
                  soundActive 
                    ? 'bg-amber-400/20 border-amber-400/40 text-amber-300 hover:bg-amber-400/30' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Filter Bar & Bulk Actions */}
          <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('qr')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'qr'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <QrCode className="w-3 h-3" />
                <span>QR Orders ({qrOrdersCount})</span>
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('unread')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    activeFilter === 'unread'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    title="Mark all notifications as read"
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span className="hidden sm:inline">Read all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClearAll}
                  title="Clear all notifications"
                  className="text-[11px] text-slate-400 hover:text-red-400 font-medium flex items-center gap-0.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 mx-auto flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-xs font-bold text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  When guests scan table QR codes and submit self-orders, they will chime with an audio bell and appear here.
                </p>
                <button
                  type="button"
                  onClick={handleTestChime}
                  className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Test Audio Bell Chime</span>
                </button>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const targetOrder = orders.find(
                  o => (notification.orderId && o.id === notification.orderId) || 
                       (notification.invoiceNumber && o.invoiceNumber === notification.invoiceNumber)
                );

                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-xl transition-all border text-left relative group ${
                      !notification.read
                        ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400/50'
                        : 'bg-slate-800/50 border-slate-700/40 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {/* Top row: Table Badge + Timestamp + Read Dot */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {notification.tableNumber && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-xs">
                            <QrCode className="w-3 h-3" />
                            {notification.tableNumber}
                          </span>
                        )}
                        <span className="font-extrabold text-xs text-white">
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                    </div>

                    {/* Customer Name or Message */}
                    <p className="text-[11px] text-slate-300 font-medium mt-1">
                      {notification.message}
                    </p>

                    {/* Dishes summary snippet */}
                    {notification.itemsSummary && (
                      <p className="text-[11px] text-amber-300/90 font-medium mt-0.5 bg-slate-950/40 px-2 py-1 rounded-md border border-slate-800/60 line-clamp-2">
                        {notification.itemsSummary}
                      </p>
                    )}

                    {/* Footer Actions & Bill Viewer Button */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-700/40 text-xs">
                      <div className="flex items-center gap-2">
                        {notification.amount !== undefined && (
                          <span className="font-extrabold text-white text-xs">
                            {profile.currencySymbol}{notification.amount.toFixed(2)}
                          </span>
                        )}
                        {notification.invoiceNumber && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            #{notification.invoiceNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => onMarkAsRead(notification.id)}
                            title="Mark as read"
                            className="p-1 hover:bg-slate-700 text-slate-400 hover:text-amber-400 rounded-md transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {targetOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              onMarkAsRead(notification.id);
                              onViewOrder(targetOrder);
                              setIsOpen(false);
                            }}
                            className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-[11px] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>View Bill / Print</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CircleDot className={`w-2.5 h-2.5 ${soundActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              Audio Chimes: {soundActive ? 'Active' : 'Muted'}
            </span>
            <button
              type="button"
              onClick={handleToggleSound}
              className="text-amber-400 hover:underline cursor-pointer font-semibold"
            >
              {soundActive ? 'Mute Chimes' : 'Turn On Chimes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
