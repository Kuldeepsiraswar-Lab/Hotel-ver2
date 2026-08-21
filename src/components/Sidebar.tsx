import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Receipt, 
  Flame, 
  ChefHat, 
  FileText, 
  TrendingDown, 
  TrendingUp, 
  QrCode, 
  Users, 
  Settings, 
  DollarSign, 
  Cloud, 
  Sun, 
  Moon, 
  Lock, 
  KeyRound, 
  LogOut, 
  ChevronRight, 
  X, 
  ShieldAlert
} from 'lucide-react';
import { RestaurantProfile, StaffUser } from '../types';
import { NavTab } from './Navbar';
import { useTheme } from '../context/ThemeContext';
import { 
  isKitchenStaff, 
  canAccessSettings, 
  canAccessStaffManagement, 
  canAccessTableQR, 
  canUserAccessTab, 
  isAdminOrOwner, 
  isManagerOrOwner 
} from '../utils/permissions';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
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
  const isKitchen = isKitchenStaff(currentUser);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggleCollapse();
      }
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCollapse, isMobileOpen, onCloseMobile]);

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

  const mainNavItems = [
    {
      id: 'pos' as NavTab,
      label: 'POS Billing',
      subLabel: 'Cash register & dine-in tables',
      icon: Receipt,
      badge: openOrdersCount > 0 ? `${openOrdersCount}` : undefined,
      badgeFull: openOrdersCount > 0 ? `${openOrdersCount} Open` : undefined,
      badgeColor: 'bg-amber-500 text-slate-950',
      isAllowedForKitchen: false,
    },
    {
      id: 'kitchen' as NavTab,
      label: 'Kitchen Display',
      subLabel: 'Live cooking orders & KOT line',
      icon: Flame,
      badge: activeKitchenOrdersCount > 0 ? `${activeKitchenOrdersCount}` : undefined,
      badgeFull: activeKitchenOrdersCount > 0 ? `${activeKitchenOrdersCount} Active` : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
      isAllowedForKitchen: true,
    },
    {
      id: 'tableqr' as NavTab,
      label: 'Table QR Ordering',
      subLabel: 'Customer digital menu standees',
      icon: QrCode,
      badge: 'QR',
      badgeFull: 'QR Menu',
      badgeColor: 'bg-indigo-500 text-white',
      isAllowedForKitchen: false,
    },
    {
      id: 'menu' as NavTab,
      label: 'Menu & Recipes',
      subLabel: 'Dishes, cost % & categories',
      icon: ChefHat,
      isAllowedForKitchen: false,
    },
    {
      id: 'invoices' as NavTab,
      label: 'Invoices & Reports',
      subLabel: 'Bills history & GST tax receipts',
      icon: FileText,
      isAllowedForKitchen: false,
    },
    {
      id: 'expenses' as NavTab,
      label: 'Expenses & COGS',
      subLabel: 'Vendor stock & ingredient costs',
      icon: TrendingDown,
      badge: unpaidExpensesCount > 0 ? `${unpaidExpensesCount}` : undefined,
      badgeFull: unpaidExpensesCount > 0 ? `${unpaidExpensesCount} Unpaid` : undefined,
      badgeColor: 'bg-red-500 text-white',
      isAllowedForKitchen: false,
    },
    {
      id: 'financials' as NavTab,
      label: 'P&L Health & Analytics',
      subLabel: 'Net profit margins & revenue',
      icon: TrendingUp,
      isAllowedForKitchen: false,
    },
  ];

  const handleTabClick = (tabId: NavTab) => {
    if (isKitchen && tabId !== 'kitchen') return;
    if (!canUserAccessTab(currentUser, tabId)) return;
    onSelectTab(tabId);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        id="app-main-sidebar"
        className={`fixed inset-y-0 left-0 z-50 md:z-30 flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300 ease-in-out select-none shadow-xl ${
          // Mobile state: slide in/out
          isMobileOpen 
            ? 'translate-x-0 w-72 md:w-auto' 
            : '-translate-x-full md:translate-x-0'
        } ${
          // Desktop state: collapsed vs expanded
          isCollapsed ? 'md:w-20' : 'md:w-68'
        }`}
      >
        {/* =========================================================================
            SIDEBAR HEADER: Brand, Logo & Collapse Toggle
           ========================================================================= */}
        <div className="h-16 px-3.5 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-950/90">
          
          {/* Logo & Brand Name */}
          <div 
            className={`flex items-center gap-3 cursor-pointer overflow-hidden transition-all ${
              isCollapsed ? 'justify-center w-full md:w-auto' : 'min-w-0 flex-1'
            }`}
            onClick={() => handleTabClick(isKitchen ? 'kitchen' : 'pos')}
            title={isKitchen ? "Kitchen Display System" : "Go to POS Billing Terminal"}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-slate-950 shadow-md shrink-0 transition-transform hover:scale-105 ${
              isKitchen 
                ? 'bg-gradient-to-tr from-rose-500 to-amber-400' 
                : 'bg-gradient-to-tr from-amber-500 to-amber-400'
            }`}>
              {isKitchen ? <Flame className="w-5 h-5" /> : <UtensilsCrossed className="w-5 h-5" />}
            </div>

            {/* Brand Title (Visible when expanded or on mobile) */}
            <div className={`min-w-0 transition-opacity duration-200 ${isCollapsed ? 'md:hidden' : 'block'}`}>
              <h1 className="text-sm font-black text-white tracking-tight truncate leading-tight">
                {profile.name || 'Restaurant POS'}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                  isKitchen 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                    : 'bg-amber-400/20 text-amber-300'
                }`}>
                  {isKitchen ? 'KDS LINE' : 'PRO POS'}
                </span>
                <span className="text-[10px] text-slate-400 truncate hidden lg:inline">
                  {profile.city || 'Terminal'}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Close Mobile Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =========================================================================
            STAFF USER BANNER
           ========================================================================= */}
        <div className="px-3 py-2.5 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
          {currentUser ? (
            <div className={`bg-slate-950/80 border border-slate-800/90 rounded-xl p-2 flex items-center transition-all ${
              isCollapsed ? 'md:justify-center md:p-1.5' : 'justify-between gap-2.5'
            }`}>
              
              <div 
                className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                onClick={onOpenLogin}
                title={`Signed in as: ${currentUser.displayName} (${roleInfo.label}). Click to switch PIN.`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                  isKitchen ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'
                }`}>
                  {roleInfo.icon}
                </div>

                <div className={`min-w-0 transition-opacity ${isCollapsed ? 'md:hidden' : 'block'}`}>
                  <p className="text-xs font-black text-white truncate leading-tight">
                    {currentUser.displayName}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Lock & Switch Actions (Expanded view only) */}
              <div className={`flex items-center gap-1 shrink-0 ${isCollapsed ? 'md:hidden' : 'flex'}`}>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  title="Switch Staff PIN"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-lg transition-colors cursor-pointer border border-slate-700/60"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if ((isAdminOrOwner(currentUser) || isManagerOrOwner(currentUser)) && onCloseTerminal) {
                      onCloseTerminal();
                    } else {
                      onLockTerminal();
                    }
                  }}
                  title="Lock & Close Terminal"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-lg transition-colors cursor-pointer border border-slate-700/60"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className={`w-full py-2 px-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                isCollapsed ? 'md:p-2' : ''
              }`}
              title="Staff Passcode Login"
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              <span className={isCollapsed ? 'md:hidden' : 'inline'}>Staff Login</span>
            </button>
          )}

          {/* Kitchen notice when expanded */}
          {isKitchen && !isCollapsed && (
            <div className="mt-2 p-2 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-start gap-1.5 text-rose-200">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-[10px] leading-tight">
                <span className="font-bold block text-rose-300">Kitchen Display Station</span>
                <span className="text-slate-300 text-[9px]">
                  Restricted to live cooking line.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            MAIN NAVIGATION ITEMS LIST
           ========================================================================= */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-thin">
          
          {/* Section Header */}
          <div>
            <div className={`px-2 mb-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 ${
              isCollapsed ? 'md:justify-center' : ''
            }`}>
              <span className={isCollapsed ? 'md:hidden' : 'inline'}>Station Modules</span>
              <span className={`text-[9px] text-amber-400/80 ${isCollapsed ? 'md:hidden' : 'inline'}`}>
                {isKitchen ? '1 view' : `${mainNavItems.length} views`}
              </span>
            </div>

            {/* Navigation buttons */}
            <nav className="space-y-1" aria-label="Main Navigation">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isRestricted = isKitchen && !item.isAllowedForKitchen;

                if (isRestricted) {
                  return (
                    <div
                      key={item.id}
                      className={`relative w-full rounded-xl text-left bg-slate-950/40 border border-slate-800/40 flex items-center opacity-35 cursor-not-allowed select-none transition-all ${
                        isCollapsed ? 'md:justify-center md:p-2.5' : 'p-2.5 gap-2.5'
                      }`}
                      title="Restricted for Kitchen Staff"
                    >
                      <div className="p-1 rounded-lg shrink-0 bg-slate-900 text-slate-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className={`min-w-0 flex-1 ${isCollapsed ? 'md:hidden' : 'block'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 line-clamp-1">{item.label}</span>
                          <Lock className="w-3 h-3 text-slate-600" />
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={item.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      onMouseEnter={() => setHoveredTooltip(item.id)}
                      onMouseLeave={() => setHoveredTooltip(null)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full rounded-xl text-left transition-all flex items-center cursor-pointer relative ${
                        isCollapsed 
                          ? 'md:justify-center md:p-2.5' 
                          : 'p-2.5 gap-2.5'
                      } ${
                        isActive
                          ? isKitchen
                            ? 'bg-rose-500 text-white shadow-md font-bold'
                            : 'bg-amber-400 text-slate-950 shadow-md font-bold'
                          : 'text-slate-200 hover:bg-slate-800/90 hover:text-white border border-transparent hover:border-slate-800'
                      }`}
                    >
                      {/* Left Active Accent Pill */}
                      {isActive && (
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${
                          isKitchen ? 'bg-white' : 'bg-slate-950'
                        }`} />
                      )}

                      {/* Icon with Counter Badge in Collapsed Mode */}
                      <div className="relative shrink-0">
                        <div className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? isKitchen
                              ? 'bg-slate-950 text-rose-400 shadow-xs'
                              : 'bg-slate-950 text-amber-400 shadow-xs'
                            : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-amber-400'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Mini floating badge on icon when sidebar is collapsed */}
                        {item.badge && isCollapsed && (
                          <span className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black hidden md:flex items-center justify-center shadow-xs ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Label & Description (Visible when expanded) */}
                      <div className={`min-w-0 flex-1 ${isCollapsed ? 'md:hidden' : 'block'}`}>
                        <div className="flex items-center justify-between gap-1.5">
                          <span className={`text-xs font-bold tracking-tight truncate ${
                            isActive ? (isKitchen ? 'text-white' : 'text-slate-950') : 'text-slate-100'
                          }`}>
                            {item.label}
                          </span>

                          {item.badgeFull && (
                            <span className={`px-2 py-0.2 rounded-full text-[9px] font-black shrink-0 shadow-2xs ${item.badgeColor}`}>
                              {item.badgeFull}
                            </span>
                          )}
                        </div>

                        <p className={`text-[10px] truncate mt-0.5 ${
                          isActive ? (isKitchen ? 'text-rose-100' : 'text-slate-800 font-medium') : 'text-slate-400'
                        }`}>
                          {item.subLabel}
                        </p>
                      </div>

                      {/* Active Indicator Chevron */}
                      {isActive && !isCollapsed && (
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${
                          isKitchen ? 'text-white' : 'text-slate-950'
                        }`} />
                      )}
                    </button>

                    {/* Floating Tooltip in Collapsed Mode (Desktop Only) */}
                    {isCollapsed && hoveredTooltip === item.id && (
                      <div className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-slate-950 text-white border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xl pointer-events-none whitespace-nowrap animate-in fade-in-50 zoom-in-95 duration-150">
                        <div className="flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badgeFull && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${item.badgeColor}`}>
                              {item.badgeFull}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">{item.subLabel}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* =========================================================================
              OPERATIONS & QUICK TOOLS
             ========================================================================= */}
          {!isKitchen && canAccessSettings(currentUser) && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className={`px-2 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 ${
                isCollapsed ? 'md:hidden' : 'block'
              }`}>
                <span>Operations & Tools</span>
              </div>

              <div className={`space-y-1 ${isCollapsed ? 'md:space-y-1' : ''}`}>
                {/* Settings */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      if (isMobileOpen) onCloseMobile();
                      onOpenSettings();
                    }}
                    onMouseEnter={() => setHoveredTooltip('settings')}
                    onMouseLeave={() => setHoveredTooltip(null)}
                    className={`w-full rounded-xl text-left transition-all flex items-center text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700/60 cursor-pointer ${
                      isCollapsed ? 'md:justify-center md:p-2.5' : 'p-2 gap-2.5'
                    }`}
                  >
                    <div className="p-1.5 bg-slate-800 group-hover:bg-amber-400/20 text-amber-400 rounded-lg shrink-0 transition-colors">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className={`min-w-0 flex-1 ${isCollapsed ? 'md:hidden' : 'block'}`}>
                      <span className="text-xs font-bold block">Restaurant Settings</span>
                      <span className="text-[10px] text-slate-400 block">Taxes, GST & profile</span>
                    </div>
                  </button>

                  {isCollapsed && hoveredTooltip === 'settings' && (
                    <div className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-slate-950 text-white border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xl pointer-events-none whitespace-nowrap">
                      Restaurant Settings Hub
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* =========================================================================
            SIDEBAR FOOTER ACTIONS
           ========================================================================= */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950 space-y-1.5 shrink-0">
          
          {/* Theme Mode Switcher */}
          <div className="relative group">
            <button
              type="button"
              onClick={toggleTheme}
              onMouseEnter={() => setHoveredTooltip('theme-toggle')}
              onMouseLeave={() => setHoveredTooltip(null)}
              className={`w-full rounded-xl transition-all flex items-center justify-between bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer ${
                isCollapsed ? 'md:justify-center md:p-2' : 'p-2'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                <span className={isCollapsed ? 'md:hidden' : 'inline'}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <span className={`text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded bg-slate-800 ${isCollapsed ? 'md:hidden' : 'inline'}`}>
                Toggle
              </span>
            </button>

            {isCollapsed && hoveredTooltip === 'theme-toggle' && (
              <div className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-slate-950 text-white border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xl pointer-events-none whitespace-nowrap">
                {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              </div>
            )}
          </div>

          {/* Sign Out / End Shift Button */}
          {currentUser && (
            <div className="relative group">
              <button
                type="button"
                id="sidebar-sign-out-btn"
                onClick={() => {
                  if (isMobileOpen) onCloseMobile();
                  if ((isAdminOrOwner(currentUser) || isManagerOrOwner(currentUser)) && onCloseTerminal) {
                    onCloseTerminal();
                  } else {
                    onLogout();
                  }
                }}
                onMouseEnter={() => setHoveredTooltip('sign-out')}
                onMouseLeave={() => setHoveredTooltip(null)}
                className={`w-full rounded-xl transition-all flex items-center text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer ${
                  isCollapsed ? 'md:justify-center md:p-2' : 'p-2 justify-center gap-2 text-xs font-bold'
                }`}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className={isCollapsed ? 'md:hidden' : 'inline'}>
                  {isAdminOrOwner(currentUser) || isManagerOrOwner(currentUser)
                    ? 'Close POS Terminal'
                    : 'Sign Out'}
                </span>
              </button>

              {isCollapsed && hoveredTooltip === 'sign-out' && (
                <div className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-slate-950 text-white border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xl pointer-events-none whitespace-nowrap">
                  {isAdminOrOwner(currentUser) || isManagerOrOwner(currentUser)
                    ? 'Close Terminal / Sign Out'
                    : 'Sign Out / End Shift'}
                </div>
              )}
            </div>
          )}

        </div>

      </aside>
    </>
  );
};
