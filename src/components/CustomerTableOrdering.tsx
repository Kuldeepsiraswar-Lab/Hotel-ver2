import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  Wine,
  Receipt,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Smartphone,
  Eye,
  SlidersHorizontal,
  CircleDot
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MenuItem, OrderItem, BillOrder, RestaurantProfile, PaymentMethod, KitchenStatus } from '../types';
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
  onServiceRequest?: (tableNumber: string, requestType: 'waiter' | 'drink' | 'bill' | 'cutlery', note?: string) => void;
  onUpdateOrderStatus?: (order: BillOrder) => void;
}

type ServiceActionType = 'waiter' | 'drink' | 'bill' | 'cutlery';

export const CustomerTableOrdering: React.FC<CustomerTableOrderingProps> = ({
  tableNumber,
  menuItems,
  categories: passedCategories,
  profile,
  existingOrders,
  onPlaceOrder,
  onExitCustomerView,
  onServiceRequest,
  onUpdateOrderStatus,
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
  
  // View & Modal States
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isLiveBillOpen, setIsLiveBillOpen] = useState<boolean>(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceActionType>('waiter');
  const [serviceCustomNote, setServiceCustomNote] = useState<string>('');
  const [serviceAlertToast, setServiceAlertToast] = useState<{ title: string; desc: string; icon: React.ElementType } | null>(null);
  const [isStatusExpanded, setIsStatusExpanded] = useState<boolean>(true);
  const [showSimulationTools, setShowSimulationTools] = useState<boolean>(false);

  // Identify active order for this table from real-time existingOrders
  const activeTableOrders = useMemo(() => {
    return existingOrders.filter(o => 
      o.tableNumber?.trim().toLowerCase() === tableNumber.trim().toLowerCase() && 
      o.paymentStatus === 'pending' && 
      !o.isArchived
    );
  }, [existingOrders, tableNumber]);

  // Latest active order for this table
  const activeOrder = activeTableOrders.length > 0 ? activeTableOrders[activeTableOrders.length - 1] : null;

  // Active kitchen status
  const currentKitchenStatus: KitchenStatus = useMemo(() => {
    if (!activeOrder) return 'pending';
    if (activeOrder.kitchenStatus) return activeOrder.kitchenStatus;
    if (activeOrder.paymentStatus === 'cancelled') return 'cancelled';
    return 'pending';
  }, [activeOrder]);

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

  // Total running bill across all active orders on this table
  const totalRunningBillAmount = activeTableOrders.reduce((sum, ord) => sum + ord.total, 0);
  const totalRunningItemsCount = activeTableOrders.reduce((sum, ord) => sum + ord.items.reduce((s, i) => s + i.quantity, 0), 0);

  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const newOrder: BillOrder = {
      id: generateId('ord'),
      invoiceNumber: generateNextReceiptNumber(existingOrders, profile.receiptPrefix),
      orderType: 'dine-in',
      tableNumber: tableNumber,
      serverName: 'Table QR Self-Order',
      customerName: customerName.trim() || `Guest (${tableNumber})`,
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
    setCart([]);
    setIsCartOpen(false);

    try {
      playOrderChimeSound();
    } catch (e) {}

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });

    triggerServiceToast(
      'Order Sent to Kitchen!',
      `Receipt #${newOrder.invoiceNumber} has been received. Our chefs are preparing your food.`,
      ChefHat
    );
  };

  const triggerServiceToast = (title: string, desc: string, icon: React.ElementType) => {
    setServiceAlertToast({ title, desc, icon });
    try {
      playKitchenBell();
    } catch (e) {}
    setTimeout(() => {
      setServiceAlertToast(null);
    }, 5500);
  };

  const handleTriggerServiceRequest = (type: ServiceActionType, note?: string) => {
    const noteToSend = note || serviceCustomNote;
    
    if (onServiceRequest) {
      onServiceRequest(tableNumber, type, noteToSend);
    }

    if (type === 'drink') {
      triggerServiceToast(
        'Drinks & Water Requested',
        `Waiter alerted for ${tableNumber}. Your drinks/water will be served promptly!`,
        Wine
      );
    } else if (type === 'bill') {
      triggerServiceToast(
        'Bill & Payment Requested',
        `Waiter notified to bring the final invoice & payment terminal to ${tableNumber}.`,
        Receipt
      );
    } else if (type === 'cutlery') {
      triggerServiceToast(
        'Cutlery & Napkins Requested',
        `Your server is bringing extra cutlery, napkins, or condiment supplies to ${tableNumber}.`,
        Utensils
      );
    } else {
      triggerServiceToast(
        'Waiter Summoned',
        `A server has been notified and is coming right over to ${tableNumber}.`,
        BellRing
      );
    }

    setIsServiceModalOpen(false);
    setServiceCustomNote('');
  };

  // Simulation status change helper for staff testing
  const handleSimulateStatus = (nextStatus: KitchenStatus) => {
    if (!activeOrder) return;
    const updated = {
      ...activeOrder,
      kitchenStatus: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(updated);
    } else {
      onPlaceOrder(updated);
    }
    triggerServiceToast(
      `Kitchen Status Changed: ${nextStatus.toUpperCase()}`,
      `Live status updated to "${nextStatus}". Live customer view reacted immediately.`,
      Flame
    );
  };

  // Kitchen stages config
  const statusSteps = [
    {
      id: 'pending',
      label: 'Received',
      subtext: 'Ticket confirmed & sent to kitchen',
      icon: CheckCircle2,
      color: 'emerald',
    },
    {
      id: 'preparing',
      label: 'Cooking Live',
      subtext: 'Chefs actively preparing your dishes',
      icon: Flame,
      color: 'amber',
    },
    {
      id: 'ready',
      label: 'Plated & Ready',
      subtext: 'Hot & ready on expeditor line',
      icon: BellRing,
      color: 'indigo',
    },
    {
      id: 'served',
      label: 'Served to Table',
      subtext: 'Enjoy your meal!',
      icon: Utensils,
      color: 'emerald',
    },
  ];

  const getStepIndex = (status: KitchenStatus) => {
    if (status === 'preparing') return 1;
    if (status === 'ready') return 2;
    if (status === 'served' || status === 'completed') return 3;
    return 0; // pending
  };

  const activeStepIdx = getStepIndex(currentKitchenStatus);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-32 selection:bg-amber-500 selection:text-slate-950 relative">
      
      {/* Dynamic Service Toast Alert */}
      {serviceAlertToast && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-slate-900 border-2 border-amber-400 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 animate-bounce">
            <serviceAlertToast.icon className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-black text-amber-400 text-sm">{serviceAlertToast.title}</p>
            <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">{serviceAlertToast.desc}</p>
          </div>
          <button
            type="button"
            onClick={() => setServiceAlertToast(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full font-black text-xs uppercase shadow-xs">
                  {tableNumber}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{profile.tagline || 'Contactless Table Ordering & Live Bill'}</p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Waiter Call Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                setSelectedServiceType('waiter');
                setIsServiceModalOpen(true);
              }}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Call waiter or request table assistance"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Call Server</span>
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-3 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md hover:brightness-110 transition-all cursor-pointer relative"
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
      <main className="max-w-4xl w-full mx-auto p-3 sm:p-4 space-y-4 flex-1">
        
        {/* Dedicated Live Waiter Service Bar (Drink, Bill, Waiter, Cutlery) */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Table Quick Service</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Instant Staff Alert</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* 1. Drink / Water */}
            <button
              type="button"
              onClick={() => handleTriggerServiceRequest('drink')}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-center transition-all cursor-pointer group flex flex-col items-center justify-center gap-1"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wine className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300">Drinks / Water</span>
            </button>

            {/* 2. Request Bill */}
            <button
              type="button"
              onClick={() => handleTriggerServiceRequest('bill')}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-center transition-all cursor-pointer group flex flex-col items-center justify-center gap-1"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300">Request Bill</span>
            </button>

            {/* 3. Call Server */}
            <button
              type="button"
              onClick={() => handleTriggerServiceRequest('waiter')}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-center transition-all cursor-pointer group flex flex-col items-center justify-center gap-1"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BellRing className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-300">Call Waiter</span>
            </button>

            {/* 4. Cutlery / Extra */}
            <button
              type="button"
              onClick={() => handleTriggerServiceRequest('cutlery')}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-center transition-all cursor-pointer group flex flex-col items-center justify-center gap-1"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Utensils className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-300">Cutlery / Help</span>
            </button>
          </div>
        </div>

        {/* Live Kitchen Food Preparation Status Tracker Card */}
        {activeOrder ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 relative overflow-hidden">
            {/* Ambient Background Accent */}
            <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
              currentKitchenStatus === 'preparing' ? 'bg-amber-500/10' :
              currentKitchenStatus === 'ready' ? 'bg-indigo-500/15' :
              currentKitchenStatus === 'served' ? 'bg-emerald-500/10' : 'bg-slate-700/10'
            }`} />

            {/* Card Header & Live Pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  currentKitchenStatus === 'preparing' ? 'bg-amber-400 text-slate-950 animate-pulse' :
                  currentKitchenStatus === 'ready' ? 'bg-indigo-500 text-white shadow-lg animate-bounce' :
                  currentKitchenStatus === 'served' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-emerald-400'
                }`}>
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-white">Live Kitchen Order Tracker</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                      currentKitchenStatus === 'preparing' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      currentKitchenStatus === 'ready' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                      currentKitchenStatus === 'served' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                      {currentKitchenStatus === 'preparing' ? 'Chefs Cooking' :
                       currentKitchenStatus === 'ready' ? 'Ready to Serve' :
                       currentKitchenStatus === 'served' ? 'Served' : 'Sent to Kitchen'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Receipt #{activeOrder.invoiceNumber} • {activeOrder.items.length} items ordered • Total: {formatCurrency(activeOrder.total, profile.currencySymbol)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsStatusExpanded(!isStatusExpanded)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer"
                title={isStatusExpanded ? "Collapse Tracker" : "Expand Tracker"}
              >
                {isStatusExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Live Progress Bar Steps */}
            {isStatusExpanded && (
              <div className="pt-2 space-y-3 animate-in fade-in duration-200">
                {/* Horizontal Progress Bar */}
                <div className="grid grid-cols-4 gap-1 sm:gap-2 relative">
                  {statusSteps.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isPassed = idx <= activeStepIdx;
                    const isCurrent = idx === activeStepIdx;

                    return (
                      <div key={step.id} className="text-center relative flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 mb-1.5 z-10 ${
                          isCurrent
                            ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 scale-110 shadow-lg'
                            : isPassed
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}>
                          {isPassed && !isCurrent ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <StepIcon className="w-4 h-4" />
                          )}
                        </div>

                        <span className={`text-[10px] sm:text-xs font-black block leading-tight ${
                          isCurrent ? 'text-amber-400' : isPassed ? 'text-white' : 'text-slate-500'
                        }`}>
                          {step.label}
                        </span>

                        <span className="text-[9px] text-slate-400 hidden sm:block mt-0.5">
                          {step.subtext}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Status Message Box */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-slate-200 font-bold text-[11px]">
                        {currentKitchenStatus === 'preparing' ? '🔥 Food is currently being freshly cooked on the kitchen line.' :
                         currentKitchenStatus === 'ready' ? '🛎️ Your dishes are plated and being brought to your table now!' :
                         currentKitchenStatus === 'served' ? '✨ Dishes served! Let us know if you need anything else.' :
                         '📥 Order received by the kitchen. Preparation will begin shortly.'}
                      </p>
                      {activeOrder.notes && (
                        <p className="text-[10px] text-amber-300/80 italic mt-0.5">{activeOrder.notes}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLiveBillOpen(true)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-[11px] font-bold border border-slate-700 transition-all cursor-pointer shrink-0 ml-2"
                  >
                    View Bill ({formatCurrency(totalRunningBillAmount, profile.currencySymbol)})
                  </button>
                </div>

                {/* Simulation Mode Status Switcher for Testing */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSimulationTools(!showSimulationTools)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>{showSimulationTools ? 'Hide Kitchen Simulator Controls' : 'Kitchen Live Simulation Controls (Staff Test Mode)'}</span>
                  </button>

                  {showSimulationTools && (
                    <div className="mt-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150">
                      <span className="text-[10px] font-bold text-slate-400 mr-1">Simulate Kitchen Stage:</span>
                      <button
                        type="button"
                        onClick={() => handleSimulateStatus('pending')}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                          currentKitchenStatus === 'pending' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        1. Received
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateStatus('preparing')}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                          currentKitchenStatus === 'preparing' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        2. Cooking
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateStatus('ready')}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                          currentKitchenStatus === 'ready' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        3. Ready
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateStatus('served')}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                          currentKitchenStatus === 'served' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        4. Served
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}

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

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                dietaryFilter === 'all'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/40'
              }`}
            >
              <Leaf className="w-3 h-3" /> Veg Only
            </button>
            <button
              onClick={() => setDietaryFilter('spicy')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                dietaryFilter === 'spicy'
                  ? 'bg-red-500 text-white'
                  : 'bg-red-950/50 text-red-300 border border-red-800/40 hover:bg-red-900/40'
              }`}
            >
              <Flame className="w-3 h-3" /> Spicy
            </button>
            <button
              onClick={() => setDietaryFilter('gluten-free')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                dietaryFilter === 'gluten-free'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-amber-950/50 text-amber-300 border border-amber-800/40 hover:bg-amber-900/40'
              }`}
            >
              <Wheat className="w-3 h-3" /> Gluten-Free
            </button>
          </div>
        </div>

        {/* Category Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
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
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 text-[9px] font-bold">
                          Veg
                        </span>
                      )}
                      {item.isSpicy && (
                        <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-800 text-red-400 text-[9px] font-bold">
                          Spicy
                        </span>
                      )}
                      {item.isGlutenFree && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400 text-[9px] font-bold">
                          GF
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 pt-0 flex items-center justify-between">
                  <span className="font-mono font-black text-amber-400 text-xs sm:text-sm">
                    {formatCurrency(item.price, profile.currencySymbol)}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(item);
                    }}
                    className="p-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-all font-bold cursor-pointer flex items-center gap-1 text-[11px] shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Bar: Cart Summary & Live Table Actions */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 sm:p-4 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Total / Bill Info */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsLiveBillOpen(true)}
              className="flex flex-col text-left cursor-pointer group"
            >
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1 group-hover:text-amber-400 transition-colors">
                <span>{tableNumber} Running Bill</span>
                <ChevronRight className="w-3 h-3" />
              </span>
              <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
                {formatCurrency(totalRunningBillAmount + totalAmount, profile.currencySymbol)}
              </span>
            </button>
          </div>

          {/* Right: Service Request & Cart Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedServiceType('bill');
                handleTriggerServiceRequest('bill');
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Request Bill</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              disabled={cart.length === 0}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
                cart.length > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Review Order ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Cart Drawer / Review Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Cart Header */}
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Your Order ({tableNumber})</h3>
                  <p className="text-[11px] text-slate-400">Order will be sent straight to Kitchen Display</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <Utensils className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs">Your cart is empty. Tap any dish on the menu to add!</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-white">{item.name}</h4>
                        <span className="font-mono text-amber-400 text-xs">
                          {formatCurrency(item.price * item.quantity, profile.currencySymbol)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Special instructions (e.g. extra crispy, no garlic)..."
                      value={item.notes || ''}
                      onChange={(e) => handleUpdateItemNotes(item.id, e.target.value)}
                      className="w-full px-2.5 py-1 text-[11px] bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                ))
              )}

              {/* Guest Details */}
              {cart.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Your Name / Title (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Kitchen Order Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Serve drinks first with starters..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(subtotal, profile.currencySymbol)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Tax ({profile.defaultTaxRate}%):</span>
                      <span className="font-mono">{formatCurrency(taxAmount, profile.currencySymbol)}</span>
                    </div>
                  )}
                  {serviceChargeAmount > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Service Charge ({profile.defaultServiceCharge}%):</span>
                      <span className="font-mono">{formatCurrency(serviceChargeAmount, profile.currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-white pt-1 border-t border-slate-800">
                    <span>Total For This Order:</span>
                    <span className="text-amber-400 font-mono">{formatCurrency(totalAmount, profile.currencySymbol)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendOrder}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Send Order to Kitchen ({tableNumber})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Table Running Bill Modal */}
      {isLiveBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">{tableNumber} Running Bill</h3>
                  <p className="text-[11px] text-slate-400">Live summary of all orders placed at this table</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLiveBillOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {activeTableOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <Receipt className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs">No active orders yet for {tableNumber}. Order food or drinks to begin!</p>
                </div>
              ) : (
                activeTableOrders.map((ord, idx) => (
                  <div key={ord.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <span className="font-bold text-white">Order #{ord.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-500 block">{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        ord.kitchenStatus === 'preparing' ? 'bg-amber-400 text-slate-950' :
                        ord.kitchenStatus === 'ready' ? 'bg-indigo-500 text-white' :
                        ord.kitchenStatus === 'served' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {ord.kitchenStatus || 'Pending'}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      {ord.items.map((item, iIdx) => (
                        <div key={iIdx} className="flex justify-between text-slate-300 text-[11px]">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-mono text-slate-400">{formatCurrency(item.price * item.quantity, profile.currencySymbol)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex justify-between font-bold text-xs text-white">
                      <span>Order Total:</span>
                      <span className="text-amber-400 font-mono">{formatCurrency(ord.total, profile.currencySymbol)}</span>
                    </div>
                  </div>
                ))
              )}

              {/* Total Summary */}
              {activeTableOrders.length > 0 && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between font-black text-sm text-white">
                    <span>Total Table Balance:</span>
                    <span className="text-amber-400 font-mono text-base">{formatCurrency(totalRunningBillAmount, profile.currencySymbol)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    You can settle your bill with the waiter when you are ready to depart.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsLiveBillOpen(false);
                  handleTriggerServiceRequest('bill');
                }}
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-4 h-4" />
                <span>Call Waiter for Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Request Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm">Table Service Assistance</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-300">
                Choose what you need for <span className="font-bold text-amber-400">{tableNumber}</span>:
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedServiceType('drink')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center gap-1.5 ${
                    selectedServiceType === 'drink'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-400'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Wine className="w-5 h-5 text-cyan-400" />
                  <span>Drinks / Water</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedServiceType('bill')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center gap-1.5 ${
                    selectedServiceType === 'bill'
                      ? 'border-amber-400 bg-amber-950/40 text-amber-300 ring-1 ring-amber-400'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <span>Request Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedServiceType('waiter')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center gap-1.5 ${
                    selectedServiceType === 'waiter'
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-400'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <BellRing className="w-5 h-5 text-emerald-400" />
                  <span>General Server</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedServiceType('cutlery')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center gap-1.5 ${
                    selectedServiceType === 'cutlery'
                      ? 'border-indigo-400 bg-indigo-950/40 text-indigo-300 ring-1 ring-indigo-400'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Utensils className="w-5 h-5 text-indigo-400" />
                  <span>Cutlery / Extra</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Optional Note for Server</label>
                <input
                  type="text"
                  placeholder="e.g. Bring 2 glasses of chilled water..."
                  value={serviceCustomNote}
                  onChange={(e) => setServiceCustomNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="button"
                onClick={() => handleTriggerServiceRequest(selectedServiceType)}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer mt-2"
              >
                Send Request to Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
