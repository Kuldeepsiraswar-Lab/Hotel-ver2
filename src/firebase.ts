import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { MenuItem, BillOrder, Expense, RestaurantProfile, StaffUser } from './types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the provisioned database ID
export const db = getFirestore(
  app, 
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' 
    ? firebaseConfig.firestoreDatabaseId 
    : undefined
);

// Collections
export const COLLECTIONS = {
  PROFILE: 'restaurant_profiles',
  MENU_ITEMS: 'menu_items',
  ORDERS: 'orders',
  EXPENSES: 'expenses',
  CATEGORIES: 'menu_categories',
  STAFF: 'staff_accounts',
};

/**
 * Deeply and recursively sanitizes objects for Firestore by removing any keys
 * with `undefined` values, preventing "Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized as T;
  }
  return data;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Firestore Sync and Persistence Service
export const CloudDatabaseService = {
  // ================= PROFILE =================
  async saveProfile(profile: RestaurantProfile) {
    try {
      const cleanData = sanitizeForFirestore(profile);
      const profileRef = doc(db, COLLECTIONS.PROFILE, 'main_profile');
      await setDoc(profileRef, cleanData, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.PROFILE);
      return false;
    }
  },

  async getProfile(): Promise<RestaurantProfile | null> {
    try {
      const profileRef = doc(db, COLLECTIONS.PROFILE, 'main_profile');
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        return snap.data() as RestaurantProfile;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.PROFILE);
      return null;
    }
  },

  subscribeProfile(onUpdate: (profile: RestaurantProfile) => void) {
    const profileRef = doc(db, COLLECTIONS.PROFILE, 'main_profile');
    return onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as RestaurantProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.PROFILE);
    });
  },

  // ================= MENU ITEMS =================
  async saveMenuItem(item: MenuItem) {
    try {
      const cleanData = sanitizeForFirestore(item);
      const itemRef = doc(db, COLLECTIONS.MENU_ITEMS, item.id);
      await setDoc(itemRef, cleanData, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.MENU_ITEMS}/${item.id}`);
      return false;
    }
  },

  async deleteMenuItem(itemId: string) {
    try {
      const itemRef = doc(db, COLLECTIONS.MENU_ITEMS, itemId);
      await deleteDoc(itemRef);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.MENU_ITEMS}/${itemId}`);
      return false;
    }
  },

  subscribeMenuItems(onUpdate: (items: MenuItem[]) => void) {
    const q = query(collection(db, COLLECTIONS.MENU_ITEMS));
    return onSnapshot(q, (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as MenuItem);
      });
      onUpdate(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.MENU_ITEMS);
    });
  },

  // ================= ORDERS / INVOICES =================
  async saveOrder(order: BillOrder) {
    try {
      const cleanData = sanitizeForFirestore(order);
      const orderRef = doc(db, COLLECTIONS.ORDERS, order.id);
      await setDoc(orderRef, cleanData, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.ORDERS}/${order.id}`);
      return false;
    }
  },

  async deleteOrder(orderId: string) {
    try {
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      await deleteDoc(orderRef);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.ORDERS}/${orderId}`);
      return false;
    }
  },

  subscribeOrders(onUpdate: (orders: BillOrder[]) => void) {
    const q = query(collection(db, COLLECTIONS.ORDERS));
    return onSnapshot(q, (snapshot) => {
      const orders: BillOrder[] = [];
      snapshot.forEach((docSnap) => {
        orders.push(docSnap.data() as BillOrder);
      });
      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(orders);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.ORDERS);
    });
  },

  // ================= EXPENSES =================
  async saveExpense(expense: Expense) {
    try {
      const cleanData = sanitizeForFirestore(expense);
      const expenseRef = doc(db, COLLECTIONS.EXPENSES, expense.id);
      await setDoc(expenseRef, cleanData, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.EXPENSES}/${expense.id}`);
      return false;
    }
  },

  async deleteExpense(expenseId: string) {
    try {
      const expenseRef = doc(db, COLLECTIONS.EXPENSES, expenseId);
      await deleteDoc(expenseRef);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.EXPENSES}/${expenseId}`);
      return false;
    }
  },

  subscribeExpenses(onUpdate: (expenses: Expense[]) => void) {
    const q = query(collection(db, COLLECTIONS.EXPENSES));
    return onSnapshot(q, (snapshot) => {
      const expenses: Expense[] = [];
      snapshot.forEach((docSnap) => {
        expenses.push(docSnap.data() as Expense);
      });
      // Sort newest first
      expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(expenses);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.EXPENSES);
    });
  },

  // ================= CATEGORIES =================
  async saveCategories(categories: string[]) {
    try {
      const cleanList = categories.filter((c) => Boolean(c) && typeof c === 'string');
      const docRef = doc(db, COLLECTIONS.CATEGORIES, 'main_categories');
      await setDoc(docRef, { list: cleanList }, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.CATEGORIES);
      return false;
    }
  },

  subscribeCategories(onUpdate: (categories: string[]) => void) {
    const docRef = doc(db, COLLECTIONS.CATEGORIES, 'main_categories');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists() && Array.isArray(snap.data()?.list)) {
        onUpdate(snap.data().list);
      } else {
        onUpdate([]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.CATEGORIES);
    });
  },

  // ================= STAFF & TEAM ACCOUNTS =================
  async saveStaffMember(staff: StaffUser) {
    try {
      const cleanData = sanitizeForFirestore(staff);
      const docRef = doc(db, COLLECTIONS.STAFF, staff.id);
      await setDoc(docRef, cleanData, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.STAFF);
      return false;
    }
  },

  async deleteStaffMember(staffId: string) {
    try {
      const docRef = doc(db, COLLECTIONS.STAFF, staffId);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, COLLECTIONS.STAFF);
      return false;
    }
  },

  subscribeStaff(onUpdate: (staff: StaffUser[]) => void) {
    const q = query(collection(db, COLLECTIONS.STAFF));
    return onSnapshot(q, (snapshot) => {
      const staffList: StaffUser[] = [];
      snapshot.forEach((docSnap) => {
        staffList.push(docSnap.data() as StaffUser);
      });
      onUpdate(staffList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.STAFF);
    });
  },

  // ================= SEED ALL DATA INTO GOOGLE CLOUD =================
  async syncAllToCloud(data: {
    profile: RestaurantProfile;
    menuItems: MenuItem[];
    orders: BillOrder[];
    expenses: Expense[];
    categories: string[];
    staff?: StaffUser[];
  }) {
    try {
      // 1. Profile
      await this.saveProfile(data.profile);

      // 2. Categories
      await this.saveCategories(data.categories);

      // 3. Menu Items (Batch write)
      const menuBatch = writeBatch(db);
      for (const item of data.menuItems) {
        const itemRef = doc(db, COLLECTIONS.MENU_ITEMS, item.id);
        menuBatch.set(itemRef, sanitizeForFirestore(item), { merge: true });
      }
      await menuBatch.commit();

      // 4. Orders (Batch write)
      const ordersBatch = writeBatch(db);
      for (const order of data.orders) {
        const orderRef = doc(db, COLLECTIONS.ORDERS, order.id);
        ordersBatch.set(orderRef, sanitizeForFirestore(order), { merge: true });
      }
      await ordersBatch.commit();

      // 5. Expenses (Batch write)
      const expensesBatch = writeBatch(db);
      for (const expense of data.expenses) {
        const expRef = doc(db, COLLECTIONS.EXPENSES, expense.id);
        expensesBatch.set(expRef, sanitizeForFirestore(expense), { merge: true });
      }
      await expensesBatch.commit();

      // 6. Staff Accounts (Batch write if provided)
      if (data.staff && data.staff.length > 0) {
        const staffBatch = writeBatch(db);
        for (const s of data.staff) {
          const staffRef = doc(db, COLLECTIONS.STAFF, s.id);
          staffBatch.set(staffRef, sanitizeForFirestore(s), { merge: true });
        }
        await staffBatch.commit();
      }

      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'syncAllToCloud');
      throw err;
    }
  },

  // Check if database already has data or is virgin
  async checkIsDatabaseEmpty(): Promise<boolean> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.MENU_ITEMS));
      return snap.empty;
    } catch (err) {
      return false;
    }
  },

  // Clear all data from Google Cloud Firestore
  async clearAllCloudData() {
    try {
      // 1. Delete menu items
      const menuSnap = await getDocs(collection(db, COLLECTIONS.MENU_ITEMS));
      const menuBatch = writeBatch(db);
      menuSnap.forEach(d => menuBatch.delete(d.ref));
      await menuBatch.commit();

      // 2. Delete orders
      const ordersSnap = await getDocs(collection(db, COLLECTIONS.ORDERS));
      const ordersBatch = writeBatch(db);
      ordersSnap.forEach(d => ordersBatch.delete(d.ref));
      await ordersBatch.commit();

      // 3. Delete expenses
      const expSnap = await getDocs(collection(db, COLLECTIONS.EXPENSES));
      const expBatch = writeBatch(db);
      expSnap.forEach(d => expBatch.delete(d.ref));
      await expBatch.commit();

      // 4. Reset categories
      await setDoc(doc(db, COLLECTIONS.CATEGORIES, 'main_categories'), { list: [] });

      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'clearAllCloudData');
      throw err;
    }
  }
};


