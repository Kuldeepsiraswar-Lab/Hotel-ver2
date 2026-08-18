import React, { useState } from 'react';
import { 
  Menu,
  UtensilsCrossed, 
  Flame, 
  Settings, 
  Cloud, 
  Sun,
  Moon
} from 'lucide-react';
import { RestaurantProfile, AppNotification, BillOrder, StaffUser } from '../types';
import { NotificationMenu } from './NotificationMenu';
import { NavDrawer } from './NavDrawer';
import { useTheme } from '../context/ThemeContext';
import { isKitchenStaff, canAccessSettings } from '../utils/permissions';

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
  const { isDark, toggleTheme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isKitchen = isKitchenStaff(currentUser);

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



