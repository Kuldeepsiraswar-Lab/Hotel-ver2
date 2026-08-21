export type OrderType = 'dine-in' | 'takeout' | 'delivery' | 'catering';

export type PaymentStatus = 'paid' | 'pending' | 'partially_paid' | 'refunded' | 'cancelled';

export type PaymentMethod = 
  | 'cash' 
  | 'credit_card' 
  | 'debit_card' 
  | 'upi_qr' 
  | 'bank_transfer' 
  | 'house_account' 
  | 'split';

export type ExpenseCategory = 
  | 'Raw Ingredients & Produce'
  | 'Beverages & Bar'
  | 'Kitchen Equipment & Maintenance'
  | 'Staff Wages & Payroll'
  | 'Utilities & Rent'
  | 'Packaging & Disposables'
  | 'Marketing & Delivery'
  | 'Cleaning & Hygiene'
  | 'General Operations';

export type MenuCategory = 
  | 'All'
  | 'Appetizers & Starters'
  | 'Artisan Pizzas'
  | 'Handcrafted Pastas'
  | 'Main Courses'
  | 'Sides & Salads'
  | 'Desserts & Sweets'
  | 'Beverages & Cocktails'
  | 'Catering Trays & Combos';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number; // COGS for margin calculation
  description: string;
  isVeg?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
  isAvailable: boolean;
  preparationTime?: number; // in mins
  imageUrl?: string;
}

export type KitchenStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  costPrice?: number;
  quantity: number;
  notes?: string;
  modifiers?: string[];
  isCompleted?: boolean;
}

export interface SplitPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface BillOrder {
  id: string;
  invoiceNumber: string;
  orderType: OrderType;
  tableNumber?: string;
  serverName?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerTaxId?: string;
  items: OrderItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxRate: number; // e.g. 5, 8.5, 18
  taxAmount: number;
  serviceChargeRate: number; // e.g. 10 or 0
  serviceChargeAmount: number;
  tipAmount: number;
  total: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  splitDetails?: SplitPayment[];
  notes?: string;
  createdAt: string; // ISO date string
  dueDate?: string; // For B2B / Catering Invoices
  templateStyle?: 'modern' | 'bistro' | 'minimal' | 'classic';
  isArchived?: boolean;
  kitchenStatus?: KitchenStatus;
  isKitchenHold?: boolean;
  kitchenHoldReason?: string;
  kitchenHeldAt?: string;
  kitchenStartedAt?: string;
  kitchenReadyAt?: string;
  kitchenCompletedAt?: string;
  itemPreparedMap?: Record<string, boolean>;
  priority?: 'normal' | 'rush' | 'vip';
}

export interface ExpenseItem {
  name: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
}

export interface Expense {
  id: string;
  invoiceNumber?: string;
  vendorName: string;
  category: ExpenseCategory;
  amount: number;
  taxAmount?: number;
  paymentStatus: 'paid' | 'pending' | 'scheduled';
  paymentMethod: string;
  date: string; // ISO string YYYY-MM-DD
  notes?: string;
  items?: ExpenseItem[];
  receiptImageUrl?: string;
  dueDate?: string;
}

export interface AppNotification {
  id: string;
  type: 'qr_order' | 'call_server' | 'order_update' | 'payment';
  source?: 'pos' | 'table_qr' | 'system';
  targetAudience?: 'kitchen' | 'staff_and_kitchen' | 'all';
  targetRoles?: StaffRole[];
  title: string;
  message: string;
  tableNumber?: string;
  invoiceNumber?: string;
  orderId?: string;
  timestamp: string; // ISO string
  read: boolean;
  amount?: number;
  itemsCount?: number;
  itemsSummary?: string;
  customerName?: string;
  serviceType?: 'drink' | 'bill' | 'waiter' | 'cutlery' | 'custom';
  status?: 'pending' | 'acknowledged' | 'completed';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface RestaurantProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  adminPin?: string;
  adminDesignation?: string;
  website?: string;
  taxId: string; // GSTIN / VAT / EIN / Tax Reg #
  currencySymbol: string;
  currencyCode: string;
  defaultTaxRate: number;
  defaultServiceCharge: number;
  logoUrl?: string;
  paymentQrUrl?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingOrIfsc: string;
  };
  receiptFooterMessage: string;
  invoiceTerms: string;
  invoicePrefix: string;
  receiptPrefix: string;
  autoPrintReceipt?: boolean;
}

export type StaffRole = 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen';

export interface StaffUser {
  id: string;
  email: string;
  displayName: string;
  role: StaffRole;
  photoUrl?: string;
  pin?: string;
  phone?: string;
  employeeCode?: string;
  notes?: string;
  status?: 'active' | 'inactive';
  shiftStartedAt?: string;
  createdAt?: string;
}

