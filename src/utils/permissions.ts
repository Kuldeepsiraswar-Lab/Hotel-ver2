import { StaffUser, StaffRole, AppModule, StaffPermissions, StationPreset } from '../types';

export const ADMIN_PIN = '8888';

export interface ModuleMeta {
  id: AppModule;
  label: string;
  shortLabel: string;
  category: 'operations' | 'kitchen_tables' | 'management' | 'admin';
  icon: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}

export const APP_MODULES: ModuleMeta[] = [
  {
    id: 'dashboard',
    label: 'Sales Dashboard & Analytics',
    shortLabel: 'Dashboard',
    category: 'management',
    icon: 'BarChart3',
    description: 'Real-time sales revenue, top selling dishes, daily KPIs & payment stats',
    badge: 'Sales',
    badgeColor: 'bg-emerald-500 text-slate-950',
  },
  {
    id: 'pos',
    label: 'POS Billing & Table Terminal',
    shortLabel: 'POS Billing',
    category: 'operations',
    icon: 'Receipt',
    description: 'Cash register, dine-in tables, order punch, split payments & rapid checkout',
    badge: 'Register',
    badgeColor: 'bg-amber-500 text-slate-950',
  },
  {
    id: 'kitchen',
    label: 'Kitchen Display System (KDS)',
    shortLabel: 'Kitchen KDS',
    category: 'kitchen_tables',
    icon: 'Flame',
    description: 'Live cooking orders, KOT tickets, prep timers & station dispatching',
    badge: 'Live KOT',
    badgeColor: 'bg-rose-500 text-white',
  },
  {
    id: 'tableqr',
    label: 'Table QR Digital Ordering',
    shortLabel: 'Table QR',
    category: 'kitchen_tables',
    icon: 'QrCode',
    description: 'Contactless QR table standees, self-order menu & instant call waiter chimes',
    badge: 'QR Menu',
    badgeColor: 'bg-indigo-500 text-white',
  },
  {
    id: 'menu',
    label: 'Menu Catalog & Recipe Costing',
    shortLabel: 'Menu & Recipes',
    category: 'management',
    icon: 'ChefHat',
    description: 'Dishes catalog, pricing, cost margins %, dietary flags, and recipe tags',
  },
  {
    id: 'invoices',
    label: 'Invoices, Receipts & Tax Bills',
    shortLabel: 'Invoices',
    category: 'operations',
    icon: 'FileText',
    description: 'Billing history, GST/tax invoices, reprinting receipts, refunds & export',
  },
  {
    id: 'expenses',
    label: 'Expenses & Vendor Stock COGS',
    shortLabel: 'Expenses',
    category: 'management',
    icon: 'TrendingDown',
    description: 'Vendor bills, ingredient purchases, raw material costs & operational expenses',
  },
  {
    id: 'financials',
    label: 'P&L Health & Financial Reports',
    shortLabel: 'P&L Health',
    category: 'management',
    icon: 'TrendingUp',
    description: 'Net profit margins, gross profit, revenue trends & financial break-even',
  },
  {
    id: 'settings',
    label: 'System & Restaurant Settings',
    shortLabel: 'Settings',
    category: 'admin',
    icon: 'Settings',
    description: 'Restaurant profile, tax/GST rates, currency, billing templates & cloud sync',
  },
  {
    id: 'staff',
    label: 'Staff Roster & Station Setup',
    shortLabel: 'Staff Center',
    category: 'admin',
    icon: 'Users',
    description: 'Employee roster, PIN security passcodes, station setup & visibility permissions',
  },
];

export const STATION_PRESETS: StationPreset[] = [
  {
    id: 'counter_pos',
    name: 'Counter POS Terminal #1',
    code: 'STN-POS-01',
    icon: '💳',
    description: 'Front billing counter register for table bills, takeaway, and customer payments.',
    defaultRole: 'cashier',
    defaultModules: ['pos', 'invoices', 'dashboard', 'tableqr'],
    defaultPermissions: {
      canApplyDiscounts: true,
      canVoidCancelOrders: false,
      canModifyMenuPricing: false,
      canManageExpenses: false,
      canAccessFinancials: false,
      canManageStaffRoster: false,
      canAccessSystemSettings: false,
      canReprintInvoices: true,
    },
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'kitchen_kds',
    name: 'Main Kitchen KDS Line',
    code: 'STN-KIT-01',
    icon: '🔥',
    description: 'Dedicated cooking station display for Chef and prep line tickets.',
    defaultRole: 'kitchen',
    defaultModules: ['kitchen'],
    defaultPermissions: {
      canApplyDiscounts: false,
      canVoidCancelOrders: false,
      canModifyMenuPricing: false,
      canManageExpenses: false,
      canAccessFinancials: false,
      canManageStaffRoster: false,
      canAccessSystemSettings: false,
      canReprintInvoices: false,
    },
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  {
    id: 'floor_waiter',
    name: 'Dining Floor Server Station',
    code: 'STN-FLR-01',
    icon: '🍽️',
    description: 'Handheld or mobile tablet station for taking table orders and customer service.',
    defaultRole: 'waiter',
    defaultModules: ['pos', 'tableqr', 'kitchen'],
    defaultPermissions: {
      canApplyDiscounts: false,
      canVoidCancelOrders: false,
      canModifyMenuPricing: false,
      canManageExpenses: false,
      canAccessFinancials: false,
      canManageStaffRoster: false,
      canAccessSystemSettings: false,
      canReprintInvoices: false,
    },
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  {
    id: 'manager_desk',
    name: 'Floor Supervisor & Manager Desk',
    code: 'STN-MGR-01',
    icon: '📋',
    description: 'Shift manager station for operational supervision, menu status, and table management.',
    defaultRole: 'manager',
    defaultModules: ['dashboard', 'pos', 'kitchen', 'tableqr', 'menu', 'invoices', 'expenses'],
    defaultPermissions: {
      canApplyDiscounts: true,
      canVoidCancelOrders: true,
      canModifyMenuPricing: true,
      canManageExpenses: true,
      canAccessFinancials: false,
      canManageStaffRoster: true,
      canAccessSystemSettings: false,
      canReprintInvoices: true,
    },
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  {
    id: 'back_office',
    name: 'Executive Back-Office & Owner Suite',
    code: 'STN-ADM-01',
    icon: '👑',
    description: 'Full master command station with unhindered visibility to all financial reports and admin settings.',
    defaultRole: 'owner',
    defaultModules: ['dashboard', 'pos', 'kitchen', 'tableqr', 'menu', 'invoices', 'expenses', 'financials', 'settings', 'staff'],
    defaultPermissions: {
      canApplyDiscounts: true,
      canVoidCancelOrders: true,
      canModifyMenuPricing: true,
      canManageExpenses: true,
      canAccessFinancials: true,
      canManageStaffRoster: true,
      canAccessSystemSettings: true,
      canReprintInvoices: true,
    },
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'bar_counter',
    name: 'Bar & Beverage Counter Terminal',
    code: 'STN-BAR-01',
    icon: '🍸',
    description: 'Dedicated bar dispensing terminal for drink orders, cocktail prep, and beverage tabs.',
    defaultRole: 'cashier',
    defaultModules: ['pos', 'kitchen', 'invoices', 'tableqr'],
    defaultPermissions: {
      canApplyDiscounts: true,
      canVoidCancelOrders: false,
      canModifyMenuPricing: false,
      canManageExpenses: false,
      canAccessFinancials: false,
      canManageStaffRoster: false,
      canAccessSystemSettings: false,
      canReprintInvoices: true,
    },
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  {
    id: 'accounts_inventory',
    name: 'Accounts & Stock Desk',
    code: 'STN-ACC-01',
    icon: '📊',
    description: 'Back-office accounting workstation for vendor expense entry, invoices, and P&L monitoring.',
    defaultRole: 'manager',
    defaultModules: ['dashboard', 'invoices', 'expenses', 'financials', 'menu'],
    defaultPermissions: {
      canApplyDiscounts: false,
      canVoidCancelOrders: false,
      canModifyMenuPricing: true,
      canManageExpenses: true,
      canAccessFinancials: true,
      canManageStaffRoster: false,
      canAccessSystemSettings: false,
      canReprintInvoices: true,
    },
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  }
];

export const getDefaultModulesForRole = (role: StaffRole): AppModule[] => {
  switch (role) {
    case 'owner':
      return ['dashboard', 'pos', 'kitchen', 'tableqr', 'menu', 'invoices', 'expenses', 'financials', 'settings', 'staff'];
    case 'manager':
      return ['dashboard', 'pos', 'kitchen', 'tableqr', 'menu', 'invoices', 'expenses', 'staff'];
    case 'cashier':
      return ['pos', 'invoices', 'dashboard', 'tableqr'];
    case 'waiter':
      return ['pos', 'tableqr', 'kitchen'];
    case 'kitchen':
      return ['kitchen'];
    default:
      return ['pos', 'invoices'];
  }
};

export const getDefaultPermissionsForRole = (role: StaffRole): StaffPermissions => {
  switch (role) {
    case 'owner':
      return {
        canApplyDiscounts: true,
        canVoidCancelOrders: true,
        canModifyMenuPricing: true,
        canManageExpenses: true,
        canAccessFinancials: true,
        canManageStaffRoster: true,
        canAccessSystemSettings: true,
        canReprintInvoices: true,
      };
    case 'manager':
      return {
        canApplyDiscounts: true,
        canVoidCancelOrders: true,
        canModifyMenuPricing: true,
        canManageExpenses: true,
        canAccessFinancials: false,
        canManageStaffRoster: true,
        canAccessSystemSettings: false,
        canReprintInvoices: true,
      };
    case 'cashier':
      return {
        canApplyDiscounts: true,
        canVoidCancelOrders: false,
        canModifyMenuPricing: false,
        canManageExpenses: false,
        canAccessFinancials: false,
        canManageStaffRoster: false,
        canAccessSystemSettings: false,
        canReprintInvoices: true,
      };
    case 'waiter':
      return {
        canApplyDiscounts: false,
        canVoidCancelOrders: false,
        canModifyMenuPricing: false,
        canManageExpenses: false,
        canAccessFinancials: false,
        canManageStaffRoster: false,
        canAccessSystemSettings: false,
        canReprintInvoices: false,
      };
    case 'kitchen':
      return {
        canApplyDiscounts: false,
        canVoidCancelOrders: false,
        canModifyMenuPricing: false,
        canManageExpenses: false,
        canAccessFinancials: false,
        canManageStaffRoster: false,
        canAccessSystemSettings: false,
        canReprintInvoices: false,
      };
    default:
      return {};
  }
};

/**
 * Checks if the user has Kitchen role.
 */
export const isKitchenStaff = (user: StaffUser | null | undefined): boolean => {
  if (!user) return false;
  if (user.role === 'kitchen') return true;
  if (user.allowedModules && user.allowedModules.length === 1 && user.allowedModules[0] === 'kitchen') {
    return true;
  }
  return false;
};

/**
 * Checks if the current user has Admin / Owner privileges
 */
export const isAdminOrOwner = (user: StaffUser | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'owner';
};

/**
 * Checks if the current user has Manager or Owner privileges
 */
export const isManagerOrOwner = (user: StaffUser | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'owner' || user.role === 'manager';
};

/**
 * Helper to check if user can edit or delete critical data
 */
export const canModifyData = (user: StaffUser | null | undefined): boolean => {
  return isAdminOrOwner(user);
};

/**
 * Check if the user is allowed to access a specific navigation tab/module
 */
export const canUserAccessTab = (user: StaffUser | null | undefined, tab: string): boolean => {
  if (!user) return true; // Default view or initial demo
  
  // If user has explicit customized allowedModules configured by Admin, use it strictly
  if (Array.isArray(user.allowedModules) && user.allowedModules.length > 0) {
    return user.allowedModules.includes(tab as AppModule);
  }

  // Fallback to role-based default permissions
  if (user.role === 'kitchen') {
    return tab === 'kitchen';
  }

  if (user.role === 'waiter' || user.role === 'cashier') {
    if (tab === 'financials' || tab === 'expenses') return false;
  }

  return true;
};

/**
 * Check if the user is permitted to open Admin / Restaurant Settings
 */
export const canAccessSettings = (user: StaffUser | null | undefined): boolean => {
  if (!user) return true;
  if (user.role === 'owner') return true;
  if (user.permissions?.canAccessSystemSettings) return true;
  if (Array.isArray(user.allowedModules) && user.allowedModules.includes('settings')) return true;
  return user.role === 'manager';
};

/**
 * Check if the user is permitted to manage Staff Roster
 */
export const canAccessStaffManagement = (user: StaffUser | null | undefined): boolean => {
  if (!user) return true;
  if (user.role === 'owner') return true;
  if (user.permissions?.canManageStaffRoster) return true;
  if (Array.isArray(user.allowedModules) && user.allowedModules.includes('staff')) return true;
  return user.role === 'manager';
};

/**
 * Check if user can generate/manage Table QR standees
 */
export const canAccessTableQR = (user: StaffUser | null | undefined): boolean => {
  if (!user) return true;
  if (Array.isArray(user.allowedModules)) {
    return user.allowedModules.includes('tableqr');
  }
  return user.role !== 'kitchen';
};

/**
 * Check a granular permission capability on a user
 */
export const hasStaffPermission = (
  user: StaffUser | null | undefined, 
  permissionKey: keyof StaffPermissions
): boolean => {
  if (!user) return true;
  if (user.role === 'owner') return true;
  if (user.permissions && user.permissions[permissionKey] !== undefined) {
    return Boolean(user.permissions[permissionKey]);
  }
  const defaultPerms = getDefaultPermissionsForRole(user.role);
  return Boolean(defaultPerms[permissionKey]);
};

/**
 * Validate an admin override PIN
 */
export const verifyAdminPin = (pin: string): boolean => {
  return pin.trim() === ADMIN_PIN;
};


