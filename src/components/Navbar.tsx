import React, { useState, useEffect } from 'react';
import { 
  Menu,
  UtensilsCrossed, 
  Flame, 
  Cloud, 
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  ChefHat,
  FileText,
  TrendingDown,
  TrendingUp,
  QrCode,
  Clock,
  KeyRound
} from 'lucide-react';
import { RestaurantProfile, AppNotification, BillOrder, StaffUser } from '../types';
import { NotificationMenu } from './NotificationMenu';
import { isKitchenStaff, isAdminOrOwner } from '../utils/permissions';

export type NavTab = 'pos' | 'kitchen' | 'invoices' | 'expenses' | 'financials' | 'menu' | 'tableqr';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: RestaurantProfile;
  orders: BillOrder[];
  notifications: AppNotification[];
  currentUser: StaffUser | null;
  openOrdersCount: number;
  activeKitchenOrdersCount?: number;
  unpaidExpensesCount: number;
  isCloudSyncing?: boolean;
  cloudError?: string | null;
  onManualCloudSync?: () => void;
  onOpenSettings: () => void;
  onOpenTableQR: () => void;
  onOpenStaffManagement?: () => void;
  onOpenLogin: () => void;
  onLockTerminal: () => void;
  onLogout: () => void;
  onOpenDailySummary?: () => void;
  onCloseTerminal?: () => void;
  onViewOrder: (order: BillOrder) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAllNotifications: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onOpenMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  profile,
  orders,
  notifications,
  currentUser,
  openOrdersCount,
  activeKitchenOrdersCount = 0,
  unpaidExpensesCount,
  isCloudSyncing,
  cloudError,
  onManualCloudSync,
  onOpenSettings,
  onOpenTableQR,
  onOpenStaffManagement,
  onOpenLogin,
  onLockTerminal,
  onLogout,
  onOpenDailySummary,
  onCloseTerminal,
  onViewOrder,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAllNotifications,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  onOpenMobileSidebar,
}) => {
  const isKitchen = isKitchenStaff(currentUser);
  
  // Real-time clock for the POS top bar
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTabDetails = (tab: NavTab) => {
    switch (tab) {
      case 'pos':
        return { label: 'POS Billing Terminal', icon: Receipt, badge: openOrdersCount > 0 ? `${openOrdersCount} Open Orders` : 'Ready' };
      case 'kitchen':
        return { label: 'Kitchen Display (KDS)', icon: Flame, badge: activeKitchenOrdersCount > 0 ? `${activeKitchenOrdersCount} Active Cooking` : 'All Caught Up' };
      case 'tableqr':
        return { label: 'Table QR Ordering', icon: QrCode, badge: 'Self-Order' };
      case 'menu':
        return { label: 'Menu & Recipe Costing', icon: ChefHat, badge: 'Catalog' };
      case 'invoices':
        return { label: 'Invoices & Reports', icon: FileText, badge: 'Tax Invoices' };
      case 'expenses':
        return { label: 'Expenses & Stock COGS', icon: TrendingDown, badge: unpaidExpensesCount > 0 ? `${unpaidExpensesCount} Unpaid` : 'Recorded' };
      case 'financials':
        return { label: 'P&L Health & Analytics', icon: TrendingUp, badge: 'Live Metrics' };
      default:
        return { label: 'POS Terminal', icon: Receipt, badge: '' };
    }
  };

  const currentTabInfo = getTabDetails(activeTab);
  const TabIcon = currentTabInfo.icon;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-xs">
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Sidebar Toggle & Current View Breadcrumb */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            
            {/* Mobile Drawer Open Button */}
            <button
              type="button"
              id="mobile-sidebar-toggle-btn"
              onClick={onOpenMobileSidebar}
              aria-label="Open Navigation Sidebar"
              className="md:hidden p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl cursor-pointer shadow-xs"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Collapse / Expand Toggle Shortcut */}
            {onToggleSidebarCollapse && (
              <button
                type="button"
                id="header-sidebar-collapse-btn"
                onClick={onToggleSidebarCollapse}
                title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar into Icon Bar (Ctrl+B)"}
                className="hidden md:flex p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700/70 rounded-xl transition-all cursor-pointer items-center gap-1.5"
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-amber-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-slate-300" />
                )}
                <span className="text-[11px] font-bold hidden lg:inline">
                  {isSidebarCollapsed ? 'Expand' : 'Icon Bar'}
                </span>
              </button>
            )}

            {/* Active View Title & Breadcrumb Indicator */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                isKitchen 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
              }`}>
                <TabIcon className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-sm sm:text-base tracking-tight text-white truncate">
                    {currentTabInfo.label}
                  </h2>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider hidden sm:inline-block ${
                    isKitchen
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {currentTabInfo.badge}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate hidden md:block">
                  {profile.name} • {profile.city || 'POS System'}
                </p>
              </div>
            </div>

          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Live Clock Display */}
            {currentTime && (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">{currentTime}</span>
              </div>
            )}

            {/* Staff User Quick Info Pill */}
            {currentUser && (
              <button
                type="button"
                onClick={onOpenLogin}
                title="Switch Staff PIN"
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold truncate max-w-[100px] lg:max-w-[140px]">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-slate-900 text-amber-300 border border-slate-700">
                  {currentUser.role}
                </span>
              </button>
            )}

            {/* Google Cloud DB Sync Button */}
            {onManualCloudSync && (
              <button
                type="button"
                onClick={onManualCloudSync}
                disabled={isCloudSyncing}
                title="Google Cloud Firestore Real-time Database"
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  cloudError
                    ? 'bg-red-950/60 border-red-700 text-red-300 hover:bg-red-900/60'
                    : 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                }`}
              >
                <Cloud className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-pulse text-amber-300' : 'text-emerald-400'}`} />
                <span className="hidden lg:inline text-[11px]">
                  {isCloudSyncing ? 'Syncing...' : 'Cloud DB'}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${isCloudSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              </button>
            )}

            {/* Notification Bell Menu with Audio Alert & Badges */}
            <NotificationMenu
              notifications={notifications}
              orders={orders}
              profile={profile}
              onViewOrder={onViewOrder}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onClearAll={onClearAllNotifications}
            />

          </div>
        </div>
      </div>
    </header>
  );
};




