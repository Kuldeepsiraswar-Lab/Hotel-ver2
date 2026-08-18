import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Leaf, 
  Flame, 
  Wheat, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  ChefHat, 
  CreditCard, 
  DollarSign, 
  QrCode, 
  ChevronRight,
  BellRing,
  Info,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MenuItem, OrderItem, BillOrder, RestaurantProfile, PaymentMethod } from '../types';
import { formatCurrency, generateId, generateNextReceiptNumber } from '../utils/formatters';
import { playOrderChimeSound, playKitchenBell } from '../utils/sound';

interface CustomerTableOrderingProps {
  tableNumber: string;
  menuItems: MenuItem[];
  categories: string[];
  profile: RestaurantProfile;
  existingOrders: BillOrder[];
  onPlaceOrder: (order: BillOrder) => void;
  onExitCustomerView?: () => void;
}

export const CustomerTableOrdering: React.FC<CustomerTableOrderingProps> = ({
  tableNumber,
  menuItems,
  categories: passedCategories,
  profile,
  existingOrders,
  onPlaceOrder,
  onExitCustomerView,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'gluten-free' | 'spicy'>('all');
  
  // Customer Cart State
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [paymentPreference, setPaymentPreference] = useState<PaymentMethod>('cash');
  
  // View states
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [placedOrder, setPlacedOrder] = useState<BillOrder | null>(null);
  const [waiterCalled, setWaiterCalled] = useState<boolean>(false);

  const categories = [
    'All',
    ...Array.from(new Set([
      ...(passedCategories || []),
      ...menuItems.map(item => item.category)
    ])).filter(Boolean)
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.isAvailable) return false;
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

  const handleAddToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => 
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
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

  const handleUpdateItemNotes = (itemId: string, notes: string) => {
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, notes } : i));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * profile.defaultTaxRate) / 100;
  const serviceChargeAmount = (subtotal * profile.defaultServiceCharge) / 100;
  const totalAmount = subtotal + taxAmount + serviceChargeAmount;

  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const newOrder: BillOrder = {
      id: generateId('ord'),
      invoiceNumber: generateNextReceiptNumber(existingOrders, profile.receiptPrefix),
      orderType: 'dine-in',
      tableNumber: tableNumber,
      serverName: 'Table QR Self-Order',
      customerName: customerName.trim() || 'Table Guest',
      ...(customerPhone.trim() ? { customerPhone: customerPhone.trim() } : {}),
      items: [...cart],
      subtotal,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: profile.defaultTaxRate,
      taxAmount,
      serviceChargeRate: profile.defaultServiceCharge,
      serviceChargeAmount,
      tipAmount: 0,
      total: totalAmount,
      amountPaid: 0,
      paymentStatus: 'pending',
      paymentMethod: paymentPreference,
      kitchenStatus: 'pending',
      notes: orderNotes.trim() ? `[QR Self-Order] ${orderNotes.trim()}` : '[QR Self-Order]',
      createdAt: new Date().toISOString(),
      templateStyle: 'modern',
    };

    onPlaceOrder(newOrder);
    setPlacedOrder(newOrder);
    setCart([]);
    setIsCartOpen(false);

    try {
      playOrderChimeSound();
    } catch (e) {}

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleCallWaiter = () => {
    try {
      playKitchenBell();
    } catch (e) {}
    setWaiterCalled(true);
    setTimeout(() => {
      setWaiterCalled(false);
    }, 6000);
  };

  // Confirmation View After Order is Sent
  if (placedOrder) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500">
        <div className="max-w-md w-full bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
          
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
            <ChefHat className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/50 text-emerald-300 rounded-full font-bold text-xs">
              Order Sent to Kitchen 👨‍🍳
            </span>
            <h2 className="text-2xl font-black text-white mt-3">{profile.name}</h2>
            <p className="text-amber-400 font-bold text-sm mt-1">{tableNumber} • Receipt #{placedOrder.invoiceNumber}</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
              <span>Items Ordered ({placedOrder.items.length})</span>
              <span>Price</span>
            </div>
            {placedOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-slate-200">
                <div>
                  <span className="font-bold text-white">{item.quantity}x</span> {item.name}
                  {item.notes && <p className="text-[10px] text-amber-300/80 italic">{item.notes}</p>}
                </div>
                <span className="font-mono font-semibold text-slate-300">
                  {formatCurrency(item.price * item.quantity, profile.currencySymbol)}
                </span>
              </div>
            ))}
            
            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
              <span>Total Payable:</span>
              <span className="text-amber-400 font-mono">
                {formatCurrency(placedOrder.total, profile.currencySymbol)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 text-left flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              Our chefs are preparing your food fresh. Your bill will be updated live on the table POS. Pay when ready to leave!
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => setPlacedOrder(null)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Order More Dishes
            </button>

            <button
              type="button"
              onClick={handleCallWaiter}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <BellRing className="w-4 h-4 text-amber-400" />
              <span>{waiterCalled ? 'Waiter Summoned! Coming right over' : 'Call Server / Request Bill'}</span>
            </button>

            {onExitCustomerView && (
              <button
                type="button"
                onClick={onExitCustomerView}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors pt-2 block mx-auto underline cursor-pointer"
              >
                Return to POS Cashier Admin Mode
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24 selection:bg-amber-500">
      
      {/* Top Diner Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {onExitCustomerView && (
              <button
                onClick={onExitCustomerView}
                title="Exit to POS dashboard"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">{profile.name}</h1>
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full font-black text-[10px] uppercase shadow-xs">
                  {tableNumber}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{profile.tagline || 'Scan & Dine Digital Ordering'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCallWaiter}
              className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                waiterCalled 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{waiterCalled ? 'Waiter Alerted' : 'Call Waiter'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md hover:brightness-110 transition-all cursor-pointer relative"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {cart.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black flex items-center justify-center ml-0.5">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Digital Menu Content */}
      <main className="max-w-4xl w-full mx-auto p-3 sm:p-4 space-y-3.5 flex-1">
        
        {/* Search & Dietary Filters Bar */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-2.5 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search food, drinks, desserts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold whitespace-nowrap transition-all ${
                dietaryFilter === 'all'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/40'
              }`}
            >
              <Leaf className="w-3 h-3" /> Veg Only
            </button>
            <button
              onClick={() => setDietaryFilter('spicy')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
                dietaryFilter === 'spicy'
                  ? 'bg-red-500 text-white'
                  : 'bg-red-950/50 text-red-300 border border-red-800/40 hover:bg-red-900/40'
              }`}
            >
              <Flame className="w-3 h-3" /> Spicy
            </button>
            <button
              onClick={() => setDietaryFilter('gluten-free')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
                dietaryFilter === 'gluten-free'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-amber-950/50 text-amber-300 border border-amber-800/40 hover:bg-amber-900/40'
              }`}
            >
              <Wheat className="w-3 h-3" /> Gluten-Free
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dishes 2-Column Mobile / Multi-column Desktop Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3.5">
          {filteredMenuItems.map((item) => {
            const inCart = cart.find(i => i.menuItemId === item.id);
            const inCartQty = inCart ? inCart.quantity : 0;

            return (
              <div
                key={item.id}
                onClick={() => handleAddToCart(item)}
                className="bg-slate-900 border border-slate-800 hover:border-amber-400/80 rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-all shadow-xs relative"
              >
                {inCartQty > 0 && (
                  <div className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full font-black text-[10px] shadow-lg">
                    {inCartQty} in cart
                  </div>
                )}

                <div>
                  {item.imageUrl ? (
                    <div className="h-24 sm:h-32 w-full overflow-hidden bg-slate-950 relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                    </div>
                  ) : null}

                  <div className="p-2.5 sm:p-3">
                    <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    
                    <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {item.isVeg && (
                        <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded text-[8px] sm:text-[9px] font-bold">
                          VEG
                        </span>
                      )}
                      {item.isSpicy && (
                        <span className="px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-800/60 rounded text-[8px] sm:text-[9px] font-bold">
                          SPICY
                        </span>
                      )}
                      {item.isGlutenFree && (
                        <span className="px-1.5 py-0.2 bg-amber-950 text-amber-400 border border-amber-800/60 rounded text-[8px] sm:text-[9px] font-bold">
                          GF
                        </span>
                      )}
                      {item.preparationTime && (
                        <span className="text-[9px] text-slate-500 flex items-center gap-0.5 ml-auto">
                          <Clock className="w-2.5 h-2.5" /> {item.preparationTime}m
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
                    {formatCurrency(item.price, profile.currencySymbol)}
                  </span>
                  
                  {inCartQty === 0 ? (
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-lg text-xs font-black flex items-center gap-0.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  ) : (
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700"
                    >
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(inCart!.id, -1)}
                        className="p-1 text-slate-300 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center font-mono font-bold text-xs text-white">{inCartQty}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(inCart!.id, 1)}
                        className="p-1 text-amber-400 hover:text-amber-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredMenuItems.length === 0 && (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Utensils className="w-10 h-10 mx-auto stroke-1" />
            <p className="font-semibold text-xs text-slate-400">No matching dishes found</p>
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Review Bar */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-3 left-3 right-3 max-w-lg mx-auto z-40">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 rounded-2xl shadow-2xl flex items-center justify-between font-black text-xs uppercase tracking-wider animate-in slide-in-from-bottom-3 duration-200 active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-950 text-amber-400 text-xs font-black flex items-center justify-center">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <span>Review Table Order</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{formatCurrency(totalAmount, profile.currencySymbol)}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Customer Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200 shadow-2xl">
            
            {/* Drawer Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Review Table Order</h3>
                  <p className="text-[11px] text-slate-400">{tableNumber} • {profile.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <form onSubmit={handleSendOrder} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Itemized List */}
              <div className="divide-y divide-slate-800 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                {cart.map((item) => (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="font-bold text-white text-xs">{item.name}</span>
                        <div className="text-[11px] font-mono text-amber-400/90 mt-0.5">
                          {formatCurrency(item.price, profile.currencySymbol)}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="p-1 text-slate-300 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold text-xs font-mono text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="p-1 text-amber-400 hover:text-amber-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="w-16 text-right font-mono font-bold text-white text-xs">
                        {formatCurrency(item.price * item.quantity, profile.currencySymbol)}
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Special instructions (e.g. less spicy, no cheese)"
                      value={item.notes || ''}
                      onChange={(e) => handleUpdateItemNotes(item.id, e.target.value)}
                      className="w-full px-2.5 py-1 text-[11px] bg-slate-900 border border-slate-800 rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none italic"
                    />
                  </div>
                ))}
              </div>

              {/* Guest Details */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                  Guest Information
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Your Name (e.g. Alex)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (Optional for Bill SMS)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Cooking Notes / Message to Kitchen */}
              <div>
                <label className="block font-bold text-slate-300 text-[11px] uppercase tracking-wider mb-1">
                  Overall Table Note / Requests
                </label>
                <input
                  type="text"
                  placeholder="e.g. Serve starters first, bring extra napkins"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Payment Preference */}
              <div>
                <label className="block font-bold text-slate-300 text-[11px] uppercase tracking-wider mb-1.5">
                  Payment Preference
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Cash at Table', icon: DollarSign },
                    { id: 'upi_qr', label: 'UPI / QR Scan', icon: QrCode },
                    { id: 'credit_card', label: 'Card at Counter', icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentPreference(m.id as PaymentMethod)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          paymentPreference === m.id
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] leading-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bill Breakdown */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 font-mono text-slate-300">
                <div className="flex justify-between text-xs">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal, profile.currencySymbol)}</span>
                </div>
                {profile.defaultTaxRate > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Tax ({profile.defaultTaxRate}%):</span>
                    <span>{formatCurrency(taxAmount, profile.currencySymbol)}</span>
                  </div>
                )}
                {profile.defaultServiceCharge > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Service ({profile.defaultServiceCharge}%):</span>
                    <span>{formatCurrency(serviceChargeAmount, profile.currencySymbol)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>TOTAL BILL:</span>
                  <span className="text-amber-400">{formatCurrency(totalAmount, profile.currencySymbol)}</span>
                </div>
              </div>

              {/* Submit to Kitchen */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Send Order to Kitchen • {formatCurrency(totalAmount, profile.currencySymbol)}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
