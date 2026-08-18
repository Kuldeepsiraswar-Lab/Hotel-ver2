import { StaffUser, StaffRole } from '../types';

export const ADMIN_PIN = '8888';

/**
 * Checks if the user has Kitchen role.
 * Kitchen staff are dedicated to the Kitchen Display System (KDS) station
 * and have NO permission to access POS billing, invoices, expenses, financials, menu, or settings.
 */
export const isKitchenStaff = (user: StaffUser | null | undefined): boolean => {
  return user?.role === 'kitchen';
};

/**
 * Checks if the current user has Admin / Owner privileges
 * Owners and Admins have full access to edit and delete records, settings, and staff roster.
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
 * Check if the user is allowed to access a specific navigation tab
 */
export const canUserAccessTab = (user: StaffUser | null | undefined, tab: string): boolean => {
  if (!user) return true; // Unauthenticated default view or initial demo
  
  // Kitchen staff can ONLY access the kitchen tab
  if (user.role === 'kitchen') {
    return tab === 'kitchen';
  }

  // Cashiers and waiters cannot view Financials or Expenses
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
  return user.role === 'owner' || user.role === 'manager';
};

/**
 * Check if the user is permitted to manage Staff Roster
 */
export const canAccessStaffManagement = (user: StaffUser | null | undefined): boolean => {
  if (!user) return true;
  return user.role === 'owner' || user.role === 'manager';
};

/**
 * Check if user can generate/manage Table QR standees
 */
export const canAccessTableQR = (user: StaffUser | null | undefined): boolean => {
  if (!user) return true;
  return user.role !== 'kitchen';
};

/**
 * Validate an admin override PIN
 */
export const verifyAdminPin = (pin: string): boolean => {
  return pin.trim() === ADMIN_PIN;
};

