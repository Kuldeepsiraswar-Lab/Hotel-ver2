import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Utensils, 
  Receipt, 
  CreditCard, 
  QrCode, 
  DollarSign, 
  Percent, 
  Sparkles, 
  User, 
  Check, 
  Flame, 
  Leaf, 
  Wheat, 
  ChevronRight,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MenuItem, OrderItem, BillOrder, RestaurantProfile, OrderType, PaymentMethod, PaymentStatus } from '../types';
import { formatCurrency, generateId, generateNextReceiptNumber } from '../utils/formatters';

interface POSBillingProps {
  menuItems: MenuItem[];
  existingOrders: BillOrder[];
  profile: RestaurantProfile;
  categories?: string[];
  onSaveOrder: (order: BillOrder) => void;
  onViewInvoice: (order: BillOrder) => void;
  onOpenTableQR?: () => void;
}

const TABLES = [
  'Table 1', 'Table 2', 'Table 3', 'Table 4', 
  'Table 5', 'Table 6', 'Table 7', 'Table 8', 
  'Bar 1', 'Bar 2', 'Patio 1', 'Patio 2'
];

export const POSBilling: React.FC<POSBillingProps> = ({
  menuItems,
  existingOrders,
  profile,
  categories: passedCategories,
  onSaveOrder,
  onViewInvoice,
  onOpenTableQR,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'gluten-free' | 'spicy'>('all');
  
  // Order Configuration State
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableNumber, setTableNumber] = useState<string>('Table 1');
  const [serverName, setServerName] = useState<string>('Marco');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  // Cart Items State
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  // Financial Adjustment State
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(true);
  const [applyServiceCharge, setApplyServiceCharge] = useState<boolean>(orderType === 'dine-in');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Payment Settlement Modal State
  const [isSettling, setIsSettling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [splitGuests, setSplitGuests] = useState<number>(2);

  const [mobileTab, setMobileTab] = useState<'menu' | 'cart'>('menu');

  // Categories list extracted from passed categories + active menu
  const categories = [
    'All', 
    ...Array.from(new Set([
      ...(passedCategories || []),
      ...menuItems.map(item => item.category)
    ])).filter(Boolean)
  ];

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDietary = 
      dietaryFilter === 'all' ? true :
      dietaryFilter === 'veg' ? item.isVeg :
      dietaryFilter === 'gluten-free' ? item.isGlutenFree :
      dietaryFilter === 'spicy' ? item.isSpicy : true;
    
    return matchesCategory && matchesSearch && matchesDietary;
  });

  // Add Item to Cart
  const handleAddToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => 
          i.menuItemId === item.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          id: generateId('item'),
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          costPrice: item.costPrice,
          quantity: 1,
        }
      ];
    });
  };

  // Update Cart Quantity
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(i => {
          if (i.id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as OrderItem[];
    });
  };

  // Update Line Item Notes
  const handleUpdateItemNotes = (itemId: string, notes: string) => {
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, notes } : i));
  };

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discountValue) / 100 
    : Math.min(discountValue, subtotal);
  
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = applyTax ? profile.defaultTaxRate : 0;
  const taxAmount = (taxableAmount * taxRate) / 100;
  
  const serviceChargeRate = applyServiceCharge ? profile.defaultServiceCharge : 0;
  const serviceChargeAmount = (taxableAmount * serviceChargeRate) / 100;
  
  const totalAmount = Math.max(0, taxableAmount + taxAmount + serviceChargeAmount + tipAmount);
  const changeDue = Math.max(0, cashTendered - totalAmount);

  // Clear / Reset Current Bill
  const handleClearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setTipAmount(0);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNotes('');
    setIsSettling(false);
  };

  // Submit & Settle Bill
  const handleCompleteOrder = (status: PaymentStatus = 'paid') => {
    if (cart.length === 0) return;

    const newOrder: BillOrder = {
      id: generateId('ord'),
      invoiceNumber: generateNextReceiptNumber(existingOrders, profile.receiptPrefix),
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      serverName,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items: [...cart],
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxRate,
      taxAmount,
      serviceChargeRate,
      serviceChargeAmount,
      tipAmount,
      total: totalAmount,
      amountPaid: status === 'paid' ? totalAmount : (cashTendered || 0),
      paymentStatus: status,
      paymentMethod,
      kitchenStatus: 'pending',
      notes: orderNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      templateStyle: 'modern',
    };

    onSaveOrder(newOrder);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.8 },
    });

    handleClearCart();
    onViewInvoice(newOrder);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 h-[calc(100vh-5.5rem)] relative">
      
      {/* Mobile Switcher Tab (Visible only on mobile/tablet screens < lg) */}
      <div className="flex lg:hidden bg-slate-200/90 dark:bg-slate-800 p-1 rounded-xl shrink-0 gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('menu')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'menu'
              ? 'bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Dishes Grid ({filteredMenuItems.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${
            mobileTab === 'cart'
              ? 'bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>
            Bill ({cart.reduce((s, i) => s + i.quantity, 0)}) • {formatCurrency(totalAmount, profile.currencySymbol)}
          </span>
          {cart.length > 0 && mobileTab !== 'cart' && (
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1.5 animate-pulse" />
          )}
        </button>
      </div>

      {/* Left Area: Tables & Menu Catalog (Responsive flex-1, 2-column grid mode on mobile) */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden ${
        mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'
      }`}>
        
        {/* Top Control Bar: Order Types & Tables */}
        <div className="p-2.5 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Order Type Tabs */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl gap-1 overflow-x-auto max-w-full">
            {(['dine-in', 'takeout', 'delivery', 'catering'] as OrderType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setOrderType(type);
                  if (type !== 'dine-in') setApplyServiceCharge(false);
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${
                  orderType === type
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Table Selector (If Dine-in) */}
          {orderType === 'dine-in' && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">Table:</span>
              <div className="flex items-center gap-1">
                {TABLES.map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => setTableNumber(tbl)}
                    className={`px-2 sm:px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 transition-all ${
                      tableNumber === tbl
                        ? 'bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
              </div>
              {onOpenTableQR && (
                <button
                  type="button"
                  onClick={onOpenTableQR}
                  title="Generate Table QR Code Standees"
                  className="px-2 py-1 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 rounded-lg text-[10px] font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3 h-3" />
                  <span className="hidden sm:inline">QRs</span>
                </button>
              )}
            </div>
          )}

          {/* Server Attribution */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Server:</span>
            <select
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="Marco">Marco V.</option>
              <option value="Giulia">Giulia R.</option>
              <option value="Chef Antonio">Antonio (Chef)</option>
              <option value="Front Desk">Front Desk</option>
            </select>
          </div>
        </div>

        {/* Search & Dietary Filters Bar */}
        <div className="p-2.5 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 bg-white dark:bg-slate-900">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search dishes, pizzas, drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dietary Filters */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-0.5 sm:pb-0">
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${
                dietaryFilter === 'all'
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition-all ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              }`}
            >
              <Leaf className="w-3 h-3" /> Veg
            </button>
            <button
              onClick={() => setDietaryFilter('spicy')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition-all ${
                dietaryFilter === 'spicy'
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40'
              }`}
            >
              <Flame className="w-3 h-3" /> Spicy
            </button>
            <button
              onClick={() => setDietaryFilter('gluten-free')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition-all ${
                dietaryFilter === 'gluten-free'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              }`}
            >
              <Wheat className="w-3 h-3" /> GF
            </button>
          </div>
        </div>

        {/* Category Selector Tabs */}
        <div className="px-2.5 sm:px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2 overflow-x-auto bg-slate-50/50 dark:bg-slate-900/40">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items Grid: 2 Columns on mobile, 3-4 Columns on desktop */}
        <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/40 pb-20 lg:pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
            {filteredMenuItems.map((item) => {
              const inCartCount = cart.find(i => i.menuItemId === item.id)?.quantity || 0;
              return (
                <div
                  key={item.id}
                  onClick={() => handleAddToCart(item)}
                  className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden active:scale-[0.98]"
                >
                  {inCartCount > 0 && (
                    <div className="absolute top-1.5 right-1.5 z-10 px-1.5 sm:px-2 py-0.5 bg-slate-900/90 dark:bg-amber-500 text-amber-400 dark:text-slate-950 backdrop-blur-xs rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-md">
                      {inCartCount} in bill
                    </div>
                  )}

                  <div>
                    {item.imageUrl ? (
                      <div className="h-20 sm:h-28 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                      </div>
                    ) : null}

                    <div className="p-2 sm:p-3.5">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                          {item.name}
                        </h4>
                      </div>
                      
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-1 mt-1 sm:mt-2">
                        {item.isVeg && (
                          <span className="px-1 py-0.2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded text-[8px] sm:text-[9px] font-bold" title="Vegetarian">
                            VEG
                          </span>
                        )}
                        {item.isSpicy && (
                          <span className="px-1 py-0.2 bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 rounded text-[8px] sm:text-[9px] font-bold" title="Spicy">
                            SPICY
                          </span>
                        )}
                        {item.isGlutenFree && (
                          <span className="px-1 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded text-[8px] sm:text-[9px] font-bold" title="Gluten-Free">
                            GF
                          </span>
                        )}
                        {item.preparationTime && (
                          <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5 ml-auto">
                            <Clock className="w-2.5 h-2.5" /> {item.preparationTime}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-2 sm:px-3.5 pb-2 sm:pb-3 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1">
                    <span className="font-mono font-bold text-slate-900 dark:text-amber-400 text-xs sm:text-sm truncate">
                      {formatCurrency(item.price, profile.currencySymbol)}
                    </span>
                    <button
                      type="button"
                      className="px-2 py-1 bg-amber-500 sm:bg-slate-100 sm:dark:bg-slate-700 sm:group-hover:bg-slate-900 sm:dark:group-hover:bg-amber-500 text-slate-950 sm:text-slate-800 sm:dark:text-slate-200 sm:group-hover:text-white sm:dark:group-hover:text-slate-950 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-0.5 sm:gap-1 shrink-0 shadow-2xs sm:shadow-none"
                    >
                      <Plus className="w-3 h-3" /> <span className="hidden sm:inline">Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMenuItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Utensils className="w-12 h-12 mb-2 stroke-1" />
              <p className="text-sm font-semibold">No menu items found</p>
              <p className="text-xs text-slate-400">Try adjusting your search query or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Cart Bar for Mobile when browsing dishes */}
      {mobileTab === 'menu' && cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="w-full py-3 px-4 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-amber-500/60 flex items-center justify-between font-bold text-xs active:scale-[0.99] transition-transform animate-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center shadow-xs">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <span className="font-semibold text-slate-200">Items in bill</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-amber-400 text-sm font-bold">
                {formatCurrency(totalAmount, profile.currencySymbol)}
              </span>
              <span className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-xs">
                Review & Pay <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Right Area: Interactive Live Bill & Checkout Desk (Fixed width on desktop, full on mobile) */}
      <div className={`w-full lg:w-[420px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden shrink-0 ${
        mobileTab === 'menu' ? 'hidden lg:flex' : 'flex'
      }`}>
        
        {/* Cart Header */}
        <div className="p-3.5 sm:p-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {orderType.toUpperCase()} {orderType === 'dine-in' ? `• ${tableNumber}` : ''}
              </h3>
              <span className="text-[11px] text-slate-300">
                {cart.reduce((s, i) => s + i.quantity, 0)} Items in order
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileTab('menu')}
              className="lg:hidden text-xs text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 bg-slate-800 rounded-lg"
            >
              + Add Dishes
            </button>
            <button
              type="button"
              onClick={handleClearCart}
              disabled={cart.length === 0}
              className="text-xs text-slate-400 hover:text-red-400 font-medium transition-colors disabled:opacity-30 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>

        {/* Customer Info (Optional for Dine-in, helpful for Invoices & Takeout) */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
          <input
            type="text"
            placeholder="Guest Name (Optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-slate-900 dark:focus:ring-amber-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Phone / Email"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-slate-900 dark:focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-4 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 py-12">
              <ShoppingBag className="w-10 h-10 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Your bill cart is empty</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-0.5">
                Click any dish from the menu to start drafting the bill
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</span>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatCurrency(item.price, profile.currencySymbol)} each
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="p-1 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs font-mono text-slate-900 dark:text-white">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="p-1 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="w-16 text-right font-mono font-bold text-xs text-slate-900 dark:text-amber-400">
                    {formatCurrency(item.price * item.quantity, profile.currencySymbol)}
                  </div>
                </div>

                {/* Modifiers / Special Cooking Notes */}
                <input
                  type="text"
                  placeholder="Special instructions (e.g. less salt, dressing on side)"
                  value={item.notes || ''}
                  onChange={(e) => handleUpdateItemNotes(item.id, e.target.value)}
                  className="w-full mt-1.5 px-2 py-0.5 text-[10px] bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-slate-300 dark:focus:border-slate-600 rounded focus:outline-none italic text-slate-600 dark:text-slate-300"
                />
              </div>
            ))
          )}
        </div>

        {/* Financial Adjustments Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          
          {/* Discount & Tax Toggles */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Discount:</span>
              <input
                type="number"
                min="0"
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-12 px-1.5 py-0.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-center font-mono text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setDiscountType(discountType === 'percentage' ? 'fixed' : 'percentage')}
                className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300"
              >
                {discountType === 'percentage' ? '%' : profile.currencySymbol}
              </button>
            </div>

            {/* Quick Tips */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Tip:</span>
              {[0, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTipAmount(pct === 0 ? 0 : (subtotal * pct) / 100)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                    (tipAmount > 0 && Math.round((tipAmount / subtotal) * 100) === pct) || (pct === 0 && tipAmount === 0)
                      ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {pct === 0 ? 'None' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Tax & Service Charge Toggles */}
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={applyTax}
                onChange={(e) => setApplyTax(e.target.checked)}
                className="rounded text-slate-900 dark:text-amber-500 focus:ring-0"
              />
              <span>Sales Tax ({profile.defaultTaxRate}%)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={applyServiceCharge}
                onChange={(e) => setApplyServiceCharge(e.target.checked)}
                className="rounded text-slate-900 dark:text-amber-500 focus:ring-0"
              />
              <span>Gratuity/Service ({profile.defaultServiceCharge}%)</span>
            </label>
          </div>
        </div>

        {/* Calculation Totals Summary */}
        <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white space-y-1.5 text-xs font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal, profile.currencySymbol)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount ({discountValue}{discountType === 'percentage' ? '%' : ''}):</span>
              <span>-{formatCurrency(discountAmount, profile.currencySymbol)}</span>
            </div>
          )}

          {applyTax && (
            <div className="flex justify-between text-slate-300">
              <span>Tax ({taxRate}%):</span>
              <span>{formatCurrency(taxAmount, profile.currencySymbol)}</span>
            </div>
          )}

          {applyServiceCharge && (
            <div className="flex justify-between text-slate-300">
              <span>Service Charge ({serviceChargeRate}%):</span>
              <span>{formatCurrency(serviceChargeAmount, profile.currencySymbol)}</span>
            </div>
          )}

          {tipAmount > 0 && (
            <div className="flex justify-between text-amber-300">
              <span>Tip Amount:</span>
              <span>{formatCurrency(tipAmount, profile.currencySymbol)}</span>
            </div>
          )}

          <div className="border-t border-slate-700 dark:border-slate-800 pt-2 flex justify-between text-base font-black text-white">
            <span>TOTAL:</span>
            <span className="text-amber-400">{formatCurrency(totalAmount, profile.currencySymbol)}</span>
          </div>
        </div>

        {/* Action Buttons: Fast Pay or Settle Modal */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => handleCompleteOrder('pending')}
            className="px-3 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Save as Open Bill</span>
          </button>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => setIsSettling(true)}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay & Settle ({formatCurrency(totalAmount, profile.currencySymbol)})</span>
          </button>
        </div>
      </div>

      {/* Payment Settlement Modal */}
      {isSettling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Settle & Close Bill</h3>
                <p className="text-xs text-slate-400">
                  {orderType.toUpperCase()} • Total Due: <strong className="text-amber-400 font-mono text-sm">{formatCurrency(totalAmount, profile.currencySymbol)}</strong>
                </p>
              </div>
              <button 
                onClick={() => setIsSettling(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Select Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'credit_card', label: 'Credit Card', icon: CreditCard },
                    { id: 'cash', label: 'Cash Tender', icon: DollarSign },
                    { id: 'upi_qr', label: 'QR / Contactless', icon: QrCode },
                    { id: 'bank_transfer', label: 'Bank Transfer', icon: DollarSign },
                    { id: 'house_account', label: 'House Account', icon: User },
                    { id: 'split', label: 'Split Bill', icon: Percent },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? 'border-slate-900 dark:border-amber-500 bg-slate-900 dark:bg-slate-800 text-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${paymentMethod === m.id ? 'text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
                        <span className="text-xs font-bold">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Calculation helper */}
              {paymentMethod === 'cash' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cash Tendered from Customer ({profile.currencySymbol})
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="1"
                      value={cashTendered || ''}
                      onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                      placeholder="Enter amount..."
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500 focus:outline-none"
                    />
                    {[20, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashTendered(val)}
                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-bold font-mono cursor-pointer"
                      >
                        {profile.currencySymbol}{val}
                      </button>
                    ))}
                  </div>

                  {cashTendered > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Change to Return:</span>
                      <span className={`font-mono font-bold text-sm ${changeDue >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {changeDue >= 0 
                          ? formatCurrency(changeDue, profile.currencySymbol)
                          : `Short by ${formatCurrency(Math.abs(changeDue), profile.currencySymbol)}`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Split Bill Calculator */}
              {paymentMethod === 'split' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Number of Guests Splitting:</span>
                    <div className="flex items-center gap-2">
                      {[2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSplitGuests(num)}
                          className={`w-7 h-7 rounded-lg font-bold cursor-pointer ${
                            splitGuests === num 
                              ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950' 
                              : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg flex justify-between items-center text-emerald-900 dark:text-emerald-300 font-medium">
                    <span>Each Guest Pays:</span>
                    <span className="font-mono font-bold text-base">
                      {formatCurrency(totalAmount / splitGuests, profile.currencySymbol)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer requested split slip, corporate card"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSettling(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Back to Cart
              </button>

              <button
                type="button"
                onClick={() => handleCompleteOrder('paid')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Confirm Payment & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
