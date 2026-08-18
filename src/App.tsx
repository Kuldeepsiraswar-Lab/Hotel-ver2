import React, { useState, useEffect, useRef } from 'react';
import { 
  RestaurantProfile, 
  MenuItem, 
  BillOrder, 
  Expense, 
  PaymentStatus,
  AppNotification,
  StaffUser
} from './types';
import { 
  defaultRestaurantProfile, 
  defaultMenuItems, 
  defaultBillOrders, 
  defaultExpenses,
  defaultMenuCategories,
  defaultStaffAccounts
} from './data/defaultData';
import { Navbar, NavTab } from './components/Navbar';
import { POSBilling } from './components/POSBilling';
import { InvoicesList } from './components/InvoicesList';
import { ExpenseTracker } from './components/ExpenseTracker';
import { FinancialDashboard } from './components/FinancialDashboard';
import { MenuManager } from './components/MenuManager';
import { KitchenView } from './components/KitchenView';
import { InvoiceViewer } from './components/InvoiceViewer';
import { AIReceiptScannerModal } from './components/AIReceiptScannerModal';
import { SettingsModal } from './components/SettingsModal';
import { TableQRManagerModal } from './components/TableQRManagerModal';
import { CustomerTableOrdering } from './components/CustomerTableOrdering';
import { LoginModal } from './components/LoginModal';
import { StaffManagementModal } from './components/StaffManagementModal';
import { CloudDatabaseService } from './firebase';
import { playOrderChimeSound } from './utils/sound';
import { CheckCircle2, Cloud, RefreshCw, Bell, QrCode, Volume2, Shield } from 'lucide-react';
import { isKitchenStaff, canUserAccessTab, canAccessSettings, canAccessStaffManagement, canAccessTableQR } from './utils/permissions';

const STORAGE_KEYS = {
  PROFILE: 'ristorante_profile_v1',
  MENU: 'ristorante_menu_v1',
  ORDERS: 'ristorante_orders_v1',
  EXPENSES: 'ristorante_expenses_v1',
  CATEGORIES: 'ristorante_categories_v1',
  NOTIFICATIONS: 'ristorante_notifications_v1',
  CURRENT_USER: 'ristorante_staff_user_v1',
  STAFF: 'ristorante_staff_roster_v1',
};

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('pos');

  const handleSelectTab = (tab: NavTab) => {
    if (isKitchenStaff(currentUser)) {
      setActiveTab('kitchen');
      return;
    }
    if (!canUserAccessTab(currentUser, tab)) {
      return;
    }
    setActiveTab(tab);
  };

  // Customer Table QR Mode (Activated if URL has ?table=... or user initiates simulation)
  const [customerTableMode, setCustomerTableMode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tblFromParam = urlParams.get('table');
      if (tblFromParam) return tblFromParam;

      if (window.location.hash.startsWith('#table=')) {
        return decodeURIComponent(window.location.hash.replace('#table=', ''));
      }
    }
    return null;
  });

  // Table QR Manager Modal State
  const [isTableQROpen, setIsTableQROpen] = useState<boolean>(false);
  const [newOrderAlert, setNewOrderAlert] = useState<{ table: string; invoice: string; itemsCount: number } | null>(null);

  // Restaurant Profile State
  const [profile, setProfile] = useState<RestaurantProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currencyCode === 'USD' || !parsed.currencySymbol || parsed.currencySymbol === '$') {
          parsed.currencySymbol = '₹';
          parsed.currencyCode = 'INR';
          if (parsed.defaultTaxRate === 8.5) parsed.defaultTaxRate = 5.0;
          if (parsed.defaultServiceCharge === 10) parsed.defaultServiceCharge = 5.0;
        }
        return parsed;
      } catch (e) {}
    }
    return defaultRestaurantProfile;
  });

  // Menu Items State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MENU);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return defaultMenuItems;
  });

  // Orders / Invoices State
  const [orders, setOrders] = useState<BillOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return defaultBillOrders;
  });

  // Expenses State
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return defaultExpenses;
  });

  // Menu Categories State
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultMenuCategories;
  });

  // Notifications State (Table QR Orders, live alerts)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'notif-demo-1',
        type: 'qr_order',
        title: 'Table 3 • QR Self-Order',
        message: 'Order received with 3 items • Dine-in Table 3',
        tableNumber: 'Table 3',
        invoiceNumber: 'INV-2026-003',
        orderId: 'ord-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        read: false,
        amount: 880,
        itemsCount: 3,
        itemsSummary: '1x Margherita Pizza, 1x Truffle Pasta, 1x Tiramisu',
        customerName: 'Ananya & Rohan',
      }
    ];
  });

  // Keep track of known order IDs to detect newly arrived orders from Firestore in real-time
  const knownOrderIdsRef = useRef<Set<string>>(new Set(orders.map(o => o.id)));

  // Authentication & Staff User State
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Set to null by default so login screen is displayed upon opening the app
    return null;
  });

  // Staff Roster Accounts
  const [staffList, setStaffList] = useState<StaffUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultStaffAccounts;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(true);
  const [isTerminalLocked, setIsTerminalLocked] = useState<boolean>(false);
  const [isStaffManagementOpen, setIsStaffManagementOpen] = useState<boolean>(false);

  // Cloud Sync States
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudToast, setCloudToast] = useState<string | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const initialCloudSyncDone = useRef(false);

  // Modals & Overlay States
  const [viewingInvoice, setViewingInvoice] = useState<BillOrder | null>(null);
  const [isAIScannerOpen, setIsAIScannerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Sync to LocalStorage (Instant local fallback cache)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      if (isKitchenStaff(currentUser)) {
        setActiveTab('kitchen');
        setIsSettingsOpen(false);
        setIsStaffManagementOpen(false);
        setIsTableQROpen(false);
        setIsAIScannerOpen(false);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
  }, [staffList]);

  // Sync to LocalStorage (Instant local fallback cache)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Trigger Order Arrival Chime and Notification
  const triggerOrderNotification = (order: BillOrder) => {
    // 🔔 Play real-time kitchen bell & acoustic order chime!
    try {
      playOrderChimeSound();
    } catch (e) {
      console.warn('Could not play order chime:', e);
    }

    const itemsSummary = order.items && order.items.length > 0 
      ? order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
      : `${order.items?.length || 1} items`;

    const isQR = order.serverName === 'Table QR Self-Order' || Boolean(order.tableNumber);

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: isQR ? 'qr_order' : 'order_update',
      title: isQR ? `${order.tableNumber || 'Table'} • QR Self-Order` : `New Order #${order.invoiceNumber}`,
      message: `${order.items.length} dishes ordered by ${order.customerName || 'Guest'} (${order.tableNumber || order.orderType})`,
      tableNumber: order.tableNumber,
      invoiceNumber: order.invoiceNumber,
      orderId: order.id,
      timestamp: new Date().toISOString(),
      read: false,
      amount: order.total,
      itemsCount: order.items.length,
      itemsSummary,
      customerName: order.customerName,
    };

    setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);

    // Popup alert toast in top right
    setNewOrderAlert({
      table: order.tableNumber || 'Table',
      invoice: order.invoiceNumber,
      itemsCount: order.items.length,
    });

    setTimeout(() => {
      setNewOrderAlert(null);
    }, 8000);
  };

  // Google Cloud Firestore Real-time Subscriptions & Initial Seeding
  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let unsubMenu: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;
    let unsubExpenses: (() => void) | undefined;
    let unsubCategories: (() => void) | undefined;
    let unsubStaff: (() => void) | undefined;

    const setupCloudDatabase = async () => {
      try {
        setIsCloudSyncing(true);
        // Check if database is empty on Google Cloud
        const isEmpty = await CloudDatabaseService.checkIsDatabaseEmpty();
        
        if (isEmpty && !initialCloudSyncDone.current) {
          initialCloudSyncDone.current = true;
          // Seed all initial restaurant data to Google Cloud Firestore
          await CloudDatabaseService.syncAllToCloud({
            profile,
            menuItems,
            orders,
            expenses,
            categories,
            staff: staffList
          });
          showCloudToast("Seeded all restaurant data into Google Cloud Firestore!");
        } else {
          initialCloudSyncDone.current = true;
        }

        // Subscribe to real-time Cloud updates
        unsubProfile = CloudDatabaseService.subscribeProfile((cloudProfile) => {
          if (cloudProfile) setProfile(cloudProfile);
        });

        unsubMenu = CloudDatabaseService.subscribeMenuItems((cloudItems) => {
          if (cloudItems && cloudItems.length > 0) setMenuItems(cloudItems);
        });

        unsubStaff = CloudDatabaseService.subscribeStaff((cloudStaff) => {
          if (cloudStaff && cloudStaff.length > 0) setStaffList(cloudStaff);
        });

        unsubOrders = CloudDatabaseService.subscribeOrders((cloudOrders) => {
          if (cloudOrders && cloudOrders.length > 0) {
            // Detect newly added orders from other devices/customers
            const previousKnown = knownOrderIdsRef.current;
            const newIncomingOrders = cloudOrders.filter(o => !previousKnown.has(o.id));
            
            if (newIncomingOrders.length > 0) {
              // Trigger notification & sound chime for newly arrived orders
              newIncomingOrders.forEach(ord => {
                triggerOrderNotification(ord);
              });
            }

            // Update known orders set
            knownOrderIdsRef.current = new Set(cloudOrders.map(o => o.id));
            setOrders(cloudOrders);
          }
        });

        unsubExpenses = CloudDatabaseService.subscribeExpenses((cloudExpenses) => {
          if (cloudExpenses && cloudExpenses.length > 0) setExpenses(cloudExpenses);
        });

        unsubCategories = CloudDatabaseService.subscribeCategories((cloudCats) => {
          if (cloudCats && cloudCats.length > 0) setCategories(cloudCats);
        });

        setIsCloudSyncing(false);
      } catch (err) {
        console.error("Cloud DB Initialization error:", err);
        setCloudError("Could not sync with Google Cloud Firestore");
        setIsCloudSyncing(false);
      }
    };

    setupCloudDatabase();

    return () => {
      if (unsubProfile) unsubProfile();
      if (unsubMenu) unsubMenu();
      if (unsubOrders) unsubOrders();
      if (unsubExpenses) unsubExpenses();
      if (unsubCategories) unsubCategories();
      if (unsubStaff) unsubStaff();
    };
  }, []);

  const showCloudToast = (msg: string) => {
    setCloudToast(msg);
    setTimeout(() => {
      setCloudToast(null);
    }, 4000);
  };

  // Manual Trigger: Sync All In-Memory Data to Cloud Firestore
  const handleManualCloudSync = async () => {
    try {
      setIsCloudSyncing(true);
      setCloudError(null);
      await CloudDatabaseService.syncAllToCloud({
        profile,
        menuItems,
        orders,
        expenses,
        categories,
        staff: staffList
      });
      setIsCloudSyncing(false);
      showCloudToast("Successfully synced all data to Google Cloud Database!");
    } catch (err) {
      console.error("Manual cloud sync failed:", err);
      setIsCloudSyncing(false);
      setCloudError("Cloud synchronization failed");
    }
  };

  // Staff User Registration & Roster Handlers
  const handleSaveStaff = (staffMember: StaffUser) => {
    setStaffList(prev => {
      const idx = prev.findIndex(s => s.id === staffMember.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = staffMember;
        return updated;
      }
      return [staffMember, ...prev];
    });

    // Save to Firestore
    CloudDatabaseService.saveStaffMember(staffMember);
    showCloudToast(`Saved staff account: ${staffMember.displayName}`);
  };

  const handleDeleteStaff = (staffId: string) => {
    setStaffList(prev => prev.filter(s => s.id !== staffId));
    CloudDatabaseService.deleteStaffMember(staffId);
    showCloudToast("Staff member removed from roster");
  };

  // Order Handlers
  const handleSaveOrder = (newOrder: BillOrder) => {
    let isNew = false;
    setOrders(prev => {
      const idx = prev.findIndex(o => o.id === newOrder.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newOrder;
        return updated;
      }
      isNew = true;
      return [newOrder, ...prev];
    });

    // Update known orders to avoid double ringing from cloud listener
    knownOrderIdsRef.current.add(newOrder.id);

    // Persist to Google Cloud
    CloudDatabaseService.saveOrder(newOrder);

    // If new order or QR self-order, trigger notification & acoustic sound chime
    if (isNew || newOrder.serverName === 'Table QR Self-Order') {
      triggerOrderNotification(newOrder);
    }
  };

  const handleMarkNotificationAsRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Staff User Auth Handlers
  const handleLoginSuccess = (user: StaffUser) => {
    setCurrentUser(user);
    if (isKitchenStaff(user)) {
      setActiveTab('kitchen');
      setIsSettingsOpen(false);
      setIsStaffManagementOpen(false);
      setIsTableQROpen(false);
      setIsAIScannerOpen(false);
    }
    setIsLoginModalOpen(false);
    setIsTerminalLocked(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  const handleLockTerminal = () => {
    setIsTerminalLocked(true);
  };

  const handleOpenSettings = () => {
    if (!canAccessSettings(currentUser)) return;
    setIsSettingsOpen(true);
  };

  const handleOpenTableQR = () => {
    if (!canAccessTableQR(currentUser)) return;
    setIsTableQROpen(true);
  };

  const handleOpenStaffManagement = () => {
    if (!canAccessStaffManagement(currentUser)) return;
    setIsStaffManagementOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (viewingInvoice?.id === orderId) {
      setViewingInvoice(null);
    }
    // Delete from Google Cloud
    CloudDatabaseService.deleteOrder(orderId);
  };

  const handleUpdatePaymentStatus = (orderId: string, status: PaymentStatus) => {
    let updatedOrder: BillOrder | null = null;
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const mod: BillOrder = {
          ...o,
          paymentStatus: status,
          amountPaid: status === 'paid' ? o.total : o.amountPaid,
        };
        updatedOrder = mod;
        return mod;
      }
      return o;
    }));

    if (updatedOrder) {
      CloudDatabaseService.saveOrder(updatedOrder);
    }

    if (viewingInvoice && viewingInvoice.id === orderId) {
      setViewingInvoice(prev => prev ? {
        ...prev,
        paymentStatus: status,
        amountPaid: status === 'paid' ? prev.total : prev.amountPaid,
      } : null);
    }
  };

  // Expense Handlers
  const handleSaveExpense = (newExp: Expense) => {
    setExpenses(prev => {
      const idx = prev.findIndex(e => e.id === newExp.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newExp;
        return updated;
      }
      return [newExp, ...prev];
    });
    // Persist to Google Cloud
    CloudDatabaseService.saveExpense(newExp);
  };

  const handleDeleteExpense = (expId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expId));
    // Delete from Google Cloud
    CloudDatabaseService.deleteExpense(expId);
  };

  // Menu Handlers
  const handleSaveMenuItem = (item: MenuItem) => {
    setMenuItems(prev => {
      const idx = prev.findIndex(m => m.id === item.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = item;
        return updated;
      }
      return [...prev, item];
    });
    // Persist dish to Google Cloud
    CloudDatabaseService.saveMenuItem(item);

    // Auto add category if it's new
    if (item.category && !categories.some(c => c.toLowerCase() === item.category.toLowerCase())) {
      const newCats = [...categories, item.category];
      setCategories(newCats);
      CloudDatabaseService.saveCategories(newCats);
    }
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
    // Delete dish from Google Cloud
    CloudDatabaseService.deleteMenuItem(id);
  };

  // Category Handlers
  const handleAddCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (!categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...categories, trimmed];
      setCategories(updated);
      CloudDatabaseService.saveCategories(updated);
    }
  };

  const handleDeleteCategory = (catToDelete: string, reassignTo?: string) => {
    const updatedCats = categories.filter(c => c !== catToDelete);
    setCategories(updatedCats);
    CloudDatabaseService.saveCategories(updatedCats);

    if (reassignTo) {
      const updatedItems = menuItems.map(item => {
        if (item.category === catToDelete) {
          const updated = { ...item, category: reassignTo };
          CloudDatabaseService.saveMenuItem(updated);
          return updated;
        }
        return item;
      });
      setMenuItems(updatedItems);
    }
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return;
    const updatedCats = categories.map(c => c === oldName ? trimmed : c);
    setCategories(updatedCats);
    CloudDatabaseService.saveCategories(updatedCats);

    const updatedItems = menuItems.map(item => {
      if (item.category === oldName) {
        const updated = { ...item, category: trimmed };
        CloudDatabaseService.saveMenuItem(updated);
        return updated;
      }
      return item;
    });
    setMenuItems(updatedItems);
  };

  // Profile Handlers
  const handleSaveProfile = (newProfile: RestaurantProfile) => {
    setProfile(newProfile);
    CloudDatabaseService.saveProfile(newProfile);
  };

  // Reset to Defaults
  const handleResetToDefaults = async () => {
    setProfile(defaultRestaurantProfile);
    setMenuItems(defaultMenuItems);
    setOrders(defaultBillOrders);
    setExpenses(defaultExpenses);
    setCategories(defaultMenuCategories);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.MENU);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);

    // Also push fresh default dataset to Google Cloud
    try {
      setIsCloudSyncing(true);
      await CloudDatabaseService.syncAllToCloud({
        profile: defaultRestaurantProfile,
        menuItems: defaultMenuItems,
        orders: defaultBillOrders,
        expenses: defaultExpenses,
        categories: defaultMenuCategories
      });
      setIsCloudSyncing(false);
      showCloudToast("Reset database to sample dataset in Google Cloud!");
    } catch (e) {
      setIsCloudSyncing(false);
    }
  };

  // Export JSON Backup
  const handleExportAllData = () => {
    const data = {
      profile,
      categories,
      menuItems,
      orders,
      expenses,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restaurant-billing-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportData = async (data: any) => {
    if (data.profile) setProfile(data.profile);
    if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
    if (data.menuItems) setMenuItems(data.menuItems);
    if (data.orders) setOrders(data.orders);
    if (data.expenses) setExpenses(data.expenses);

    // Sync imported data to Google Cloud Firestore
    try {
      setIsCloudSyncing(true);
      await CloudDatabaseService.syncAllToCloud({
        profile: data.profile || profile,
        menuItems: data.menuItems || menuItems,
        orders: data.orders || orders,
        expenses: data.expenses || expenses,
        categories: data.categories || categories,
      });
      setIsCloudSyncing(false);
      showCloudToast("Restored backup and synced directly to Google Cloud Firestore!");
    } catch (e) {
      setIsCloudSyncing(false);
    }
  };

  // Badge counters
  const openOrdersCount = orders.filter(o => o.paymentStatus === 'pending').length;
  const unpaidExpensesCount = expenses.filter(e => e.paymentStatus === 'pending').length;
  const activeKitchenOrdersCount = orders.filter(o => {
    if (o.isArchived || o.paymentStatus === 'cancelled') return false;
    const st = o.kitchenStatus || (o.paymentStatus === 'pending' ? 'pending' : (o.paymentStatus === 'paid' && !o.tableNumber ? 'completed' : 'pending'));
    return st === 'pending' || st === 'preparing' || st === 'ready';
  }).length;

  // If in Customer Table QR Self-Ordering Mode (e.g. diner scanned table QR with camera)
  if (customerTableMode) {
    return (
      <CustomerTableOrdering
        tableNumber={customerTableMode}
        menuItems={menuItems}
        categories={categories}
        profile={profile}
        existingOrders={orders}
        onPlaceOrder={(order) => {
          handleSaveOrder(order);
        }}
        onExitCustomerView={() => {
          setCustomerTableMode(null);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 relative transition-colors duration-200">
      
      {/* Real-time Cloud Toast Notification */}
      {cloudToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-950 text-white border border-emerald-500/50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-white">Google Cloud Firestore</p>
            <p className="text-slate-300 text-[11px]">{cloudToast}</p>
          </div>
        </div>
      )}

      {/* Live Table QR Self-Order Notification Alert */}
      {newOrderAlert && (
        <div className="fixed top-20 right-4 z-50 bg-slate-950 border-2 border-amber-400 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 max-w-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 animate-bounce">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-black text-amber-400 text-sm">🔔 New Self-Order from {newOrderAlert.table}!</p>
            <p className="text-slate-300 text-[11px]">
              Receipt #{newOrderAlert.invoice} • {newOrderAlert.itemsCount} dishes ordered
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const ord = orders.find(o => o.invoiceNumber === newOrderAlert.invoice);
              if (ord) setViewingInvoice(ord);
              setNewOrderAlert(null);
            }}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer shrink-0"
          >
            View Bill
          </button>
        </div>
      )}

      {/* Top Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        profile={profile}
        orders={orders}
        notifications={notifications}
        currentUser={currentUser}
        openOrdersCount={openOrdersCount}
        activeKitchenOrdersCount={activeKitchenOrdersCount}
        unpaidExpensesCount={unpaidExpensesCount}
        isCloudSyncing={isCloudSyncing}
        cloudError={cloudError}
        onManualCloudSync={handleManualCloudSync}
        onOpenSettings={handleOpenSettings}
        onOpenTableQR={handleOpenTableQR}
        onOpenStaffManagement={handleOpenStaffManagement}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLockTerminal={handleLockTerminal}
        onLogout={handleLogout}
        onViewOrder={(order) => setViewingInvoice(order)}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onClearAllNotifications={handleClearAllNotifications}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* If Kitchen Staff role, exclusively display Kitchen View */}
        {isKitchenStaff(currentUser) ? (
          <KitchenView
            orders={orders}
            menuItems={menuItems}
            profile={profile}
            currentUser={currentUser}
            onSaveOrder={handleSaveOrder}
            onViewInvoice={(order) => setViewingInvoice(order)}
          />
        ) : (
          <>
            {activeTab === 'pos' && (
              <POSBilling
                menuItems={menuItems}
                existingOrders={orders}
                profile={profile}
                categories={categories}
                onSaveOrder={handleSaveOrder}
                onViewInvoice={(order) => setViewingInvoice(order)}
                onOpenTableQR={handleOpenTableQR}
              />
            )}

            {activeTab === 'kitchen' && (
              <KitchenView
                orders={orders}
                menuItems={menuItems}
                profile={profile}
                currentUser={currentUser}
                onSaveOrder={handleSaveOrder}
                onViewInvoice={(order) => setViewingInvoice(order)}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoicesList
                orders={orders}
                menuItems={menuItems}
                profile={profile}
                currentUser={currentUser}
                onViewInvoice={(order) => setViewingInvoice(order)}
                onSaveOrder={handleSaveOrder}
                onDeleteOrder={handleDeleteOrder}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpenseTracker
                expenses={expenses}
                profile={profile}
                currentUser={currentUser}
                onSaveExpense={handleSaveExpense}
                onDeleteExpense={handleDeleteExpense}
                onOpenAIScanner={() => setIsAIScannerOpen(true)}
              />
            )}

            {activeTab === 'financials' && (
              <FinancialDashboard
                orders={orders}
                expenses={expenses}
                menuItems={menuItems}
                profile={profile}
              />
            )}

            {activeTab === 'menu' && (
              <MenuManager
                menuItems={menuItems}
                categories={categories}
                profile={profile}
                currentUser={currentUser}
                onSaveMenuItem={handleSaveMenuItem}
                onDeleteMenuItem={handleDeleteMenuItem}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onRenameCategory={handleRenameCategory}
              />
            )}
          </>
        )}
      </main>

      {/* Table QR Standee & Code Manager Modal */}
      <TableQRManagerModal
        isOpen={isTableQROpen}
        onClose={() => setIsTableQROpen(false)}
        profile={profile}
        onOpenCustomerView={(tableNum) => {
          setCustomerTableMode(tableNum);
        }}
      />

      {/* Invoice / Thermal Bill Viewer Modal */}
      {viewingInvoice && (
        <InvoiceViewer
          order={viewingInvoice}
          profile={profile}
          onClose={() => setViewingInvoice(null)}
          onUpdateOrder={(updated) => {
            handleSaveOrder(updated);
            setViewingInvoice(updated);
          }}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
        />
      )}

      {/* AI Smart Receipt Scanner Modal */}
      <AIReceiptScannerModal
        isOpen={isAIScannerOpen}
        onClose={() => setIsAIScannerOpen(false)}
        profile={profile}
        onSaveExpense={handleSaveExpense}
      />

      {/* Restaurant Settings & Profile Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
        onResetToDefaults={handleResetToDefaults}
        onExportAllData={handleExportAllData}
        onImportData={handleImportData}
        onSyncToCloud={handleManualCloudSync}
        isCloudSyncing={isCloudSyncing}
        onOpenStaffManagement={() => setIsStaffManagementOpen(true)}
      />

      {/* Staff Management & Registration Center Modal */}
      <StaffManagementModal
        isOpen={isStaffManagementOpen}
        onClose={() => setIsStaffManagementOpen(false)}
        staffList={staffList}
        profile={profile}
        currentUser={currentUser}
        onSaveStaff={handleSaveStaff}
        onDeleteStaff={handleDeleteStaff}
        onSaveProfile={handleSaveProfile}
      />

      {/* Staff Login & Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen || isTerminalLocked || !currentUser}
        onClose={() => {
          if (currentUser && !isTerminalLocked) {
            setIsLoginModalOpen(false);
          }
        }}
        profile={profile}
        staffList={staffList}
        onLoginSuccess={handleLoginSuccess}
        onRegisterStaff={handleSaveStaff}
        onOpenStaffManagement={() => setIsStaffManagementOpen(true)}
        isLocked={isTerminalLocked || !currentUser}
      />
    </div>
  );
}

