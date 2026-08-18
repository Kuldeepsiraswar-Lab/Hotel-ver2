import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu,
  UtensilsCrossed, 
  Receipt, 
  FileText, 
  TrendingDown, 
  TrendingUp, 
  ChefHat, 
  Flame, 
  Settings, 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  QrCode, 
  Lock, 
  User, 
  LogOut, 
  ChevronDown, 
  KeyRound, 
  ShieldCheck,
  Users,
  Crown,
  Sun,
  Moon,
  ShieldAlert
} from 'lucide-react';
import { RestaurantProfile, AppNotification, BillOrder, StaffUser } from '../types';
import { NotificationMenu } from './NotificationMenu';
import { NavDrawer } from './NavDrawer';
import { useTheme } from '../context/ThemeContext';
import { isKitchenStaff, canAccessSettings, canAccessStaffManagement } from '../utils/permissions';

export type NavTab = 'pos' | 'kitchen' | 'invoices' | 'expenses' | 'financials' | 'menu';

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
  onViewOrder: (order: BillOrder) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAllNotifications: () => void;
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
  onViewOrder,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAllNotifications,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isKitchen = isKitchenStaff(currentUser);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return { label: 'Admin', icon: '👑', color: 'bg-amber-400/20 text-amber-300 border-amber-400/30' };
      case 'manager':
        return { label: 'Manager', icon: '📋', color: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/30' };
      case 'cashier':
        return { label: 'Cashier', icon: '💳', color: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' };
      case 'kitchen':
        return { label: 'Kitchen Lead', icon: '🔥', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'waiter':
        return { label: 'Waiter', icon: '🍽️', color: 'bg-sky-400/20 text-sky-300 border-sky-400/30' };
      default:
        return { label: 'Staff', icon: '👤', color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);

  const tabsConfig: Record<NavTab, { label: string; icon: React.ElementType; badge?: number; badgeColor?: string }> = {
    pos: { label: 'POS Billing', icon: Receipt, badge: openOrdersCount > 0 ? openOrdersCount : undefined, badgeColor: 'bg-amber-500 text-slate-950' },
    kitchen: { label: 'Kitchen View', icon: Flame, badge: activeKitchenOrdersCount > 0 ? activeKitchenOrdersCount : undefined, badgeColor: 'bg-amber-400 text-slate-950 animate-pulse' },
    invoices: { label: 'Invoices & Catering', icon: FileText },
    expenses: { label: 'Expenses & COGS', icon: TrendingDown, badge: unpaidExpensesCount > 0 ? unpaidExpensesCount : undefined, badgeColor: 'bg-red-500 text-white' },
    financials: { label: 'P&L Health', icon: TrendingUp },
    menu: { label: 'Menu & Costing', icon: ChefHat },
  };

  const activeTabMeta = tabsConfig[activeTab] || tabsConfig.kitchen;
  const ActiveIcon = activeTabMeta.icon;

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Left: Navigation Drawer Toggle & Restaurant Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              
              {/* Navigation Drawer Trigger Button */}
              <button
                type="button"
                id="nav-drawer-toggle-btn"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open navigation drawer menu"
                title={isKitchen ? "Kitchen Station Menu" : "Open Navigation Menu Drawer"}
                className={`p-2 sm:px-3 sm:py-2 border rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs group ${
                  isKitchen 
                    ? 'bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border-rose-800/80' 
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700/80'
                }`}
              >
                <Menu className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-black text-slate-200">
                  {isKitchen ? 'Station' : 'Menu'}
                </span>
                {(activeKitchenOrdersCount > 0 || (!isKitchen && openOrdersCount > 0)) && (
                  <span className={`w-2 h-2 rounded-full animate-ping hidden sm:inline-block ${isKitchen ? 'bg-rose-400' : 'bg-amber-400'}`} />
                )}
              </button>

              {/* Brand Identity */}
              <div 
                className="flex items-center gap-2.5 cursor-pointer" 
                onClick={() => onSelectTab(isKitchen ? 'kitchen' : 'pos')}
                title={isKitchen ? "Kitchen Display System" : "Go to POS Billing Terminal"}
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-slate-950 shadow-md shrink-0 ${
                  isKitchen 
                    ? 'bg-gradient-to-tr from-rose-500 to-amber-400' 
                    : 'bg-gradient-to-tr from-amber-500 to-amber-400'
                }`}>
                  {isKitchen ? <Flame className="w-5 h-5" /> : <UtensilsCrossed className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm sm:text-base tracking-tight text-white line-clamp-1">
                      {profile.name}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider hidden md:inline ${
                      isKitchen 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : 'bg-amber-400/20 text-amber-300'
                    }`}>
                      {isKitchen ? 'KDS TERMINAL' : 'PRO POS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden lg:block">
                    {isKitchen ? 'Live Kitchen Order Display & Expeditor Line' : 'Billing, Kitchen Display & Financials'}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Current Active View Breadcrumb Indicator */}
            <div 
              onClick={() => setIsDrawerOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl cursor-pointer transition-all ${
                isKitchen 
                  ? 'bg-rose-950/40 hover:bg-rose-900/40 border-rose-800/60' 
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
              }`}
              title="Click to view navigation station status"
            >
              <ActiveIcon className={`w-4 h-4 ${isKitchen ? 'text-rose-400' : 'text-amber-400'}`} />
              <span className="text-xs font-bold text-slate-100 hidden sm:inline">
                {isKitchen ? 'Kitchen Display (KDS Only)' : activeTabMeta.label}
              </span>
              {activeTabMeta.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isKitchen ? 'bg-rose-500 text-white animate-pulse' : (activeTabMeta.badgeColor || 'bg-amber-400 text-slate-950')
                }`}>
                  {activeTabMeta.badge} Active
                </span>
              )}
              {isKitchen && (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold hidden md:inline">
                  Station Locked
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Right Action Tools */}
            <div className="flex items-center gap-1.5 sm:gap-2">
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

              {/* Global Theme Toggle Button */}
              <button
                type="button"
                id="global-theme-toggle-btn"
                onClick={toggleTheme}
                className="p-2 text-slate-300 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-all border border-slate-700/50 cursor-pointer relative group"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle Theme Mode"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-300" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-300 animate-in spin-in-90 duration-300" />
                )}
                <span className="sr-only">Toggle Theme</span>
              </button>

              {/* Settings button - Hidden or disabled for kitchen staff */}
              {!isKitchen && canAccessSettings(currentUser) && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/50 cursor-pointer"
                  title="Restaurant & Cloud DB Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              {/* Staff User / Login Profile Button */}
              <div className="relative" ref={userMenuRef}>
                {currentUser ? (
                  <button
                    type="button"
                    id="navbar-staff-profile-button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`px-2.5 py-1.5 border rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                      isKitchen 
                        ? 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-800/80 text-rose-200' 
                        : 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isKitchen ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'
                    }`}>
                      {roleInfo.icon}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-extrabold text-white leading-none truncate max-w-[100px]">
                        {currentUser.displayName.split(' ')[0]}
                      </p>
                      <span className={`text-[10px] font-medium ${isKitchen ? 'text-rose-300' : 'text-amber-300/90'}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ) : (
                  <button
                    type="button"
                    id="navbar-login-button"
                    onClick={onOpenLogin}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Login</span>
                  </button>
                )}

                {/* User Dropdown Menu */}
                {isUserMenuOpen && currentUser && (
                  <div className="absolute right-0 top-12 z-50 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-2 animate-in fade-in zoom-in-95 duration-150 text-slate-100">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                          isKitchen ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'
                        }`}>
                          {roleInfo.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-white truncate">
                            {currentUser.displayName}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {currentUser.email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Station Role</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold border ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </div>
                      {isKitchen && (
                        <div className="mt-2 p-1.5 bg-rose-950/50 border border-rose-800/60 rounded-lg text-[10px] text-rose-300 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Dedicated Kitchen Display Station • Other tabs locked</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-1">
                      {!isKitchen && canAccessStaffManagement(currentUser) && onOpenStaffManagement && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenStaffManagement();
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-amber-400" />
                          <span>Staff Roster & Admin</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLockTerminal();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>Lock Terminal Screen</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenLogin();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-indigo-400" />
                        <span>Switch Staff / Enter PIN</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          toggleTheme();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                          <span>Theme Mode</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 capitalize font-mono">
                          {isDark ? 'Dark' : 'Light'}
                        </span>
                      </button>

                      <div className="pt-1 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out / End Shift</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer */}
      <NavDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        profile={profile}
        currentUser={currentUser}
        openOrdersCount={openOrdersCount}
        activeKitchenOrdersCount={activeKitchenOrdersCount}
        unpaidExpensesCount={unpaidExpensesCount}
        isCloudSyncing={isCloudSyncing}
        cloudError={cloudError}
        onManualCloudSync={onManualCloudSync}
        onOpenSettings={onOpenSettings}
        onOpenTableQR={onOpenTableQR}
        onOpenStaffManagement={onOpenStaffManagement}
        onOpenLogin={onOpenLogin}
        onLockTerminal={onLockTerminal}
        onLogout={onLogout}
      />
    </>
  );
};



