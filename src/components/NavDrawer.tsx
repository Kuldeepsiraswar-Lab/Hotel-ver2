import React, { useEffect } from 'react';
import { 
  X, 
  UtensilsCrossed, 
  Receipt, 
  FileText, 
  TrendingDown, 
  TrendingUp, 
  ChefHat, 
  Flame, 
  Settings, 
  QrCode, 
  Users, 
  Lock, 
  KeyRound, 
  LogOut, 
  Sun, 
  Moon, 
  Cloud, 
  ChevronRight,
  ShieldAlert,
  DollarSign,
  Download
} from 'lucide-react';
import { RestaurantProfile, StaffUser } from '../types';
import { NavTab } from './Navbar';
import { useTheme } from '../context/ThemeContext';
import { usePWA } from '../context/PWAContext';
import { isKitchenStaff, canAccessSettings, canAccessStaffManagement, canAccessTableQR, canUserAccessTab, isManagerOrOwner, isAdminOrOwner } from '../utils/permissions';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: RestaurantProfile;
  currentUser: StaffUser | null;
  openOrdersCount: number;
  activeKitchenOrdersCount: number;
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
}

export const NavDrawer: React.FC<NavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  profile,
  currentUser,
  openOrdersCount,
  activeKitchenOrdersCount,
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
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { canInstall, isInstalled, isStandalone, isIOS, promptInstall, setIsInstallModalOpen } = usePWA();
  const isKitchen = isKitchenStaff(currentUser);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return { label: 'Admin / Owner', icon: '👑', color: 'bg-amber-400/20 text-amber-300 border-amber-400/40' };
      case 'manager':
        return { label: 'Shift Manager', icon: '📋', color: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/40' };
      case 'cashier':
        return { label: 'POS Cashier', icon: '💳', color: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40' };
      case 'kitchen':
        return { label: 'Kitchen Lead', icon: '🔥', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'waiter':
        return { label: 'Dining Captain', icon: '🍽️', color: 'bg-sky-400/20 text-sky-300 border-sky-400/40' };
      default:
        return { label: 'Staff Member', icon: '👤', color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);

  const navItems = [
    {
      id: 'pos' as NavTab,
      label: 'POS Billing Terminal',
      subLabel: 'Dine-in tables, takeout, split bills & cash register',
      icon: Receipt,
      badge: openOrdersCount > 0 ? `${openOrdersCount} Open` : undefined,
      badgeColor: 'bg-amber-500 text-slate-950',
      isAllowedForKitchen: false,
    },
    {
      id: 'kitchen' as NavTab,
      label: 'Kitchen Display (KDS)',
      subLabel: 'Live cooking line, prep summary, timers & KOT',
      icon: Flame,
      badge: activeKitchenOrdersCount > 0 ? `${activeKitchenOrdersCount} Active` : undefined,
      badgeColor: 'bg-amber-400 text-slate-950 animate-pulse font-black',
      isAllowedForKitchen: true,
    },
    {
      id: 'tableqr' as NavTab,
      label: 'Table QR Self-Order',
      subLabel: 'Digital table standees, guest Wi-Fi & customer ordering',
      icon: QrCode,
      badge: 'QR Menu',
      badgeColor: 'bg-indigo-500 text-white font-black',
      isAllowedForKitchen: false,
    },
    {
      id: 'menu' as NavTab,
      label: 'Menu & Recipe Costing',
      subLabel: 'Dishes catalog, food cost % & pricing management',
      icon: ChefHat,
      isAllowedForKitchen: false,
    },
    {
      id: 'invoices' as NavTab,
      label: 'Invoices & Catering',
      subLabel: 'Order history, GST tax invoices & thermal receipts',
      icon: FileText,
      isAllowedForKitchen: false,
    },
    {
      id: 'expenses' as NavTab,
      label: 'Expenses & COGS',
      subLabel: 'Vendor bills, inventory ingredients & raw stock purchases',
      badge: unpaidExpensesCount > 0 ? `${unpaidExpensesCount} Unpaid` : undefined,
      badgeColor: 'bg-red-500 text-white',
      icon: TrendingDown,
      isAllowedForKitchen: false,
    },
    {
      id: 'financials' as NavTab,
      label: 'P&L Health & Analytics',
      subLabel: 'Net profit margins, revenue trends & cost breakdown',
      icon: TrendingUp,
      isAllowedForKitchen: false,
    },
  ];

  const handleItemClick = (tabId: NavTab) => {
    if (isKitchen && tabId !== 'kitchen') {
      return; // Strictly restricted for kitchen staff
    }
    if (!canUserAccessTab(currentUser, tabId)) {
      return;
    }
    onSelectTab(tabId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200" id="navigation-drawer-root">
      
      {/* Dimmed Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900 text-slate-100 h-full shadow-2xl border-r border-slate-800 flex flex-col z-10 animate-in slide-in-from-left duration-250 ease-out overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-slate-950 shadow-md shrink-0 ${
              isKitchen ? 'bg-gradient-to-tr from-rose-500 to-amber-400' : 'bg-gradient-to-tr from-amber-500 to-amber-400'
            }`}>
              {isKitchen ? <Flame className="w-6 h-6" /> : <UtensilsCrossed className="w-6 h-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight truncate">
                  {profile.name}
                </h2>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                  isKitchen ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-400/20 text-amber-300'
                }`}>
                  {isKitchen ? 'KDS TERMINAL' : 'PRO POS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {isKitchen ? 'Live Kitchen Order Display Station' : 'Restaurant & Kitchen Management'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation drawer"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Staff Profile Card (Inside Drawer) */}
        <div className="p-3.5 bg-slate-900 border-b border-slate-800/80">
          {currentUser ? (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                  isKitchen ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'
                }`}>
                  {roleInfo.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-white truncate">
                    {currentUser.displayName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  title="Switch Staff PIN"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-xl transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-700/60"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if ((isAdminOrOwner(currentUser) || isManagerOrOwner(currentUser)) && onCloseTerminal) {
                      onCloseTerminal();
                    } else {
                      onLockTerminal();
                    }
                  }}
                  title="Lock & Close Terminal Screen"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-xl transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-700/60"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Lock</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Staff Login / Switch PIN</span>
            </button>
          )}

          {/* Kitchen Staff Restrictive Notice Banner */}
          {isKitchen && (
            <div className="mt-2.5 p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-start gap-2 text-rose-200">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold block text-rose-300">Kitchen Display Station Only</span>
                <span className="text-slate-300 text-[10px]">
                  Kitchen staff accounts are locked to the live cooking KDS line. POS billing, reports & settings are restricted.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
          
          {/* Main Navigation Modules */}
          <div>
            <div className="px-2.5 mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              <span>Station Views</span>
              <span className="text-[10px] text-amber-400/80 lowercase">
                {isKitchen ? '1 view available' : '7 modules'}
              </span>
            </div>

            <div className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isItemRestricted = isKitchen && !item.isAllowedForKitchen;

                if (isItemRestricted) {
                  return (
                    <div
                      key={item.id}
                      className="w-full p-3 rounded-2xl text-left bg-slate-950/40 border border-slate-800/50 flex items-start gap-3 relative opacity-40 cursor-not-allowed select-none"
                      title="Restricted for Kitchen Staff"
                    >
                      <div className="p-2 rounded-xl shrink-0 bg-slate-900 text-slate-600">
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-slate-400 line-clamp-1">
                            {item.label}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-400 flex items-center gap-1 border border-slate-700">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Locked</span>
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Restricted for Kitchen Lead role
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full p-3 rounded-2xl text-left transition-all flex items-start gap-3 relative cursor-pointer group ${
                      isActive
                        ? isKitchen
                          ? 'bg-rose-500 text-white shadow-md font-bold'
                          : 'bg-amber-400 text-slate-950 shadow-md font-bold'
                        : 'text-slate-200 hover:bg-slate-800/90 hover:text-white border border-transparent hover:border-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                      isActive
                        ? isKitchen
                          ? 'bg-slate-950 text-rose-400 shadow-xs'
                          : 'bg-slate-950 text-amber-400 shadow-xs'
                        : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-amber-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-xs font-black tracking-tight line-clamp-1 ${
                          isActive ? (isKitchen ? 'text-white' : 'text-slate-950') : 'text-slate-100'
                        }`}>
                          {item.label}
                        </span>

                        {item.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 shadow-2xs ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <p className={`text-[11px] line-clamp-1 mt-0.5 ${
                        isActive ? (isKitchen ? 'text-rose-100' : 'text-slate-800 font-medium') : 'text-slate-400'
                      }`}>
                        {item.subLabel}
                      </p>
                    </div>

                    <ChevronRight className={`w-4 h-4 self-center shrink-0 transition-transform ${
                      isActive ? (isKitchen ? 'text-white translate-x-0.5' : 'text-slate-950 translate-x-0.5') : 'text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Operations & Tools */}
          {!isKitchen && canAccessSettings(currentUser) && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="px-2.5 mb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Restaurant Tools
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="p-3 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-800 group-hover:bg-amber-400/20 text-amber-400 rounded-lg shrink-0 transition-colors">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Restaurant Settings Hub</span>
                      <span className="text-[10px] text-slate-400">Taxes, GST, Staff & Cloud Backup</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* Install App on Tablet/Phone */}
                {!isStandalone && !isInstalled && (canInstall || isIOS) && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (isIOS) {
                        setIsInstallModalOpen(true);
                      } else {
                        promptInstall();
                      }
                    }}
                    className="p-3 bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 border border-amber-500/30 rounded-xl text-left transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg shrink-0 font-bold shadow-xs">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-amber-300 block">Install ZookaRestoPos App</span>
                        <span className="text-[10px] text-amber-400/80">Add to Home Screen for Offline POS</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Kitchen Station Quick Switch PIN Button */}
          {isKitchen && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="px-2.5 mb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Station Tools
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="w-full p-2.5 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Switch PIN</span>
                    <span className="text-[10px] text-slate-400">Cashier / Admin</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 space-y-2">
          
          {/* Theme Mode Switcher in Drawer */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              <span>Dark / Light Mode</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 transition-colors cursor-pointer border border-slate-700"
            >
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>

          {/* Sign Out / End Shift / Close POS Terminal */}
          {currentUser && (
            <button
              type="button"
              id="drawer-sign-out-btn"
              onClick={() => {
                onClose();
                if ((isAdminOrOwner(currentUser) || isManagerOrOwner(currentUser)) && onCloseTerminal) {
                  onCloseTerminal();
                } else {
                  onLogout();
                }
              }}
              className="w-full py-2 px-3 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>
                {isAdminOrOwner(currentUser) || isManagerOrOwner(currentUser)
                  ? 'Close POS Terminal / Sign Out'
                  : 'Sign Out / End Shift'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
