import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChefHat, 
  Clock, 
  Flame, 
  CheckCircle2, 
  Utensils, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Search, 
  RefreshCw, 
  Bell, 
  Layers, 
  Printer, 
  Check, 
  RotateCcw, 
  Sparkles,
  Smartphone,
  Filter,
  ShoppingBag,
  Truck,
  Building,
  Timer,
  Pause,
  Play,
  PauseCircle,
  PlayCircle,
  X,
  History,
  FileText,
  Eye,
  Receipt
} from 'lucide-react';
import { BillOrder, MenuItem, KitchenStatus, RestaurantProfile, StaffUser } from '../types';
import { 
  playKitchenBell, 
  isKitchenChimeEnabled, 
  setKitchenChimeEnabled, 
  playKitchenOrderChime 
} from '../utils/sound';

interface KitchenViewProps {
  orders: BillOrder[];
  menuItems: MenuItem[];
  profile: RestaurantProfile;
  currentUser: StaffUser | null;
  onSaveOrder: (order: BillOrder) => void;
  onViewInvoice?: (order: BillOrder) => void;
}

type KitchenTabFilter = 'active' | 'pending' | 'preparing' | 'ready' | 'hold' | 'completed';
type OrderTypeFilter = 'all' | 'dine-in' | 'takeout' | 'delivery' | 'catering';

export const KitchenView: React.FC<KitchenViewProps> = ({
  orders,
  menuItems,
  profile,
  currentUser,
  onSaveOrder,
  onViewInvoice
}) => {
  // Filter States
  const [tabFilter, setTabFilter] = useState<KitchenTabFilter>('active');
  const [typeFilter, setTypeFilter] = useState<OrderTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPrepSummary, setShowPrepSummary] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [kitchenChimeOn, setKitchenChimeOn] = useState<boolean>(() => isKitchenChimeEnabled());
  const [justTestedChime, setJustTestedChime] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [density, setDensity] = useState<'normal' | 'compact' | 'large'>('normal');

  // Track known orders to sound acoustic chime on new incoming tickets
  const initialOrdersLoadedRef = React.useRef(false);
  const knownOrderIdsRef = React.useRef<Set<string>>(new Set());

  // Hold Modal State
  const [holdingOrder, setHoldingOrder] = useState<BillOrder | null>(null);
  const [selectedHoldReason, setSelectedHoldReason] = useState<string>('Guest Requested Delay');
  const [customHoldNote, setCustomHoldNote] = useState<string>('');

  const holdReasonPresets = [
    'Guest Requested Delay',
    'Hold for Mains / Next Course',
    'Dessert on Standby',
    'Waiting for Table Seating',
    'Takeout / Driver Pickup Standby',
    'Table requested staggered firing',
  ];

  // Real-time ticking clock for calculating minutes elapsed on tickets
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000); // update every 5 seconds
    return () => clearInterval(timer);
  }, []);

  // Listen to fullscreen change
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleToggleKitchenChime = () => {
    const next = !kitchenChimeOn;
    setKitchenChimeOn(next);
    setKitchenChimeEnabled(next);
    if (next) {
      playKitchenOrderChime(true);
    }
  };

  const handleTestKitchenChime = (e: React.MouseEvent) => {
    e.stopPropagation();
    setJustTestedChime(true);
    playKitchenOrderChime(true);
    setTimeout(() => setJustTestedChime(false), 1200);
  };

  // Helper to determine order kitchen status
  const getOrderKitchenStatus = (order: BillOrder): KitchenStatus => {
    if (order.kitchenStatus) return order.kitchenStatus;
    if (order.paymentStatus === 'cancelled') return 'cancelled';
    if (order.paymentStatus === 'paid' && !order.tableNumber) {
      // Completed historic order if old
      const ageMs = Date.now() - new Date(order.createdAt).getTime();
      if (ageMs > 1000 * 60 * 60 * 2) return 'completed';
    }
    return 'pending';
  };

  const isOrderFinalizedOrServed = (order: BillOrder): boolean => {
    const status = getOrderKitchenStatus(order);
    return (
      status === 'completed' ||
      status === 'served' ||
      order.kitchenStatus === 'completed' ||
      order.kitchenStatus === 'served' ||
      order.paymentStatus === 'paid'
    );
  };

  // Acoustic Alert for New Incoming Orders arriving in Kitchen View
  useEffect(() => {
    if (!initialOrdersLoadedRef.current) {
      initialOrdersLoadedRef.current = true;
      orders.forEach(o => knownOrderIdsRef.current.add(o.id));
      return;
    }

    const hasNewIncomingOrder = orders.some(o => {
      if (!knownOrderIdsRef.current.has(o.id)) {
        knownOrderIdsRef.current.add(o.id);
        const status = getOrderKitchenStatus(o);
        return status === 'pending' || status === 'preparing';
      }
      return false;
    });

    if (hasNewIncomingOrder && kitchenChimeOn) {
      playKitchenOrderChime();
    }
  }, [orders, kitchenChimeOn]);

  // Filter Active / Selected Kitchen Orders
  const filteredOrders = useMemo(() => {
    const matched = orders.filter(order => {
      if (order.isArchived) return false;
      if (order.paymentStatus === 'cancelled') return false;

      const status = getOrderKitchenStatus(order);
      const isHold = Boolean(order.isKitchenHold);
      const isCompleted = isOrderFinalizedOrServed(order);

      // Tab filter
      if (tabFilter === 'active') {
        if (isCompleted || status === 'cancelled') return false;
      } else if (tabFilter === 'hold') {
        if (!isHold || isCompleted) return false;
      } else if (tabFilter === 'pending') {
        if (status !== 'pending' || isHold || isCompleted) return false;
      } else if (tabFilter === 'preparing') {
        if (status !== 'preparing' || isHold || isCompleted) return false;
      } else if (tabFilter === 'ready') {
        if (status !== 'ready' || isHold || isCompleted) return false;
      } else if (tabFilter === 'completed') {
        if (!isCompleted) return false;
      }

      // Order type filter
      if (typeFilter !== 'all' && order.orderType !== typeFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTable = order.tableNumber?.toLowerCase().includes(q);
        const matchesInvoice = order.invoiceNumber.toLowerCase().includes(q);
        const matchesCustomer = order.customerName?.toLowerCase().includes(q);
        const matchesItems = order.items.some(i => i.name.toLowerCase().includes(q));
        const matchesReason = order.kitchenHoldReason?.toLowerCase().includes(q);
        if (!matchesTable && !matchesInvoice && !matchesCustomer && !matchesItems && !matchesReason) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Completed tab: Sort newest finalized / served first
      if (tabFilter === 'completed') {
        const timeA = new Date(a.kitchenCompletedAt || a.kitchenReadyAt || a.createdAt).getTime();
        const timeB = new Date(b.kitchenCompletedAt || b.kitchenReadyAt || b.createdAt).getTime();
        return timeB - timeA;
      }

      // Priority: Active (non-hold) first in 'active' view, then Rush orders, then FIFO
      if (tabFilter === 'active') {
        if (a.isKitchenHold !== b.isKitchenHold) {
          return a.isKitchenHold ? 1 : -1; // Non-hold tickets appear before held tickets in active view
        }
      }

      const aPriority = a.priority === 'rush' ? 2 : (a.priority === 'vip' ? 1 : 0);
      const bPriority = b.priority === 'rush' ? 2 : (b.priority === 'vip' ? 1 : 0);
      if (aPriority !== bPriority) return bPriority - aPriority;

      // Oldest created first (FIFO for kitchen tickets)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Review the last 10 finalized or served orders on the Completed tab
    if (tabFilter === 'completed') {
      return matched.slice(0, 10);
    }

    return matched;
  }, [orders, tabFilter, typeFilter, searchQuery]);

  // Summary counts for badge indicators
  const counts = useMemo(() => {
    let pending = 0;
    let preparing = 0;
    let ready = 0;
    let completed = 0;
    let hold = 0;

    orders.forEach(ord => {
      if (ord.isArchived || ord.paymentStatus === 'cancelled') return;
      const isFin = isOrderFinalizedOrServed(ord);
      const st = getOrderKitchenStatus(ord);
      const isHold = Boolean(ord.isKitchenHold);

      if (isFin) {
        completed++;
        return;
      }

      if (isHold) {
        hold++;
      }

      if (st === 'pending') {
        if (!isHold) pending++;
      } else if (st === 'preparing') {
        if (!isHold) preparing++;
      } else if (st === 'ready') {
        if (!isHold) ready++;
      }
    });

    return {
      active: pending + preparing + ready + hold,
      pending,
      preparing,
      ready,
      hold,
      completed
    };
  }, [orders]);

  // Aggregated Prep Summary across all ACTIVE NON-HOLD orders (Pending + Preparing)
  const prepSummary = useMemo(() => {
    const activeOrders = orders.filter(ord => {
      if (ord.isArchived || ord.paymentStatus === 'cancelled') return false;
      if (ord.isKitchenHold) return false; // Held orders are excluded from active prep requirements
      const st = getOrderKitchenStatus(ord);
      return st === 'pending' || st === 'preparing';
    });

    const map = new Map<string, { name: string; quantity: number; notes: string[]; tables: string[] }>();

    activeOrders.forEach(ord => {
      const tableRef = ord.tableNumber || ord.orderType;
      const preparedMap = ord.itemPreparedMap || {};

      ord.items.forEach(item => {
        // Only count if item is not checked off
        if (preparedMap[item.id]) return;

        const existing = map.get(item.name);
        if (existing) {
          existing.quantity += item.quantity;
          if (item.notes) existing.notes.push(item.notes);
          if (!existing.tables.includes(tableRef)) existing.tables.push(tableRef);
        } else {
          map.set(item.name, {
            name: item.name,
            quantity: item.quantity,
            notes: item.notes ? [item.notes] : [],
            tables: [tableRef]
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  // Update order status handler
  const handleUpdateStatus = (order: BillOrder, nextStatus: KitchenStatus) => {
    const updated: BillOrder = {
      ...order,
      kitchenStatus: nextStatus,
      isKitchenHold: false, // Transitioning active status releases any hold
      kitchenHoldReason: undefined,
      kitchenStartedAt: nextStatus === 'preparing' && !order.kitchenStartedAt ? new Date().toISOString() : order.kitchenStartedAt,
      kitchenReadyAt: nextStatus === 'ready' ? new Date().toISOString() : order.kitchenReadyAt,
      kitchenCompletedAt: (nextStatus === 'completed' || nextStatus === 'served') ? new Date().toISOString() : order.kitchenCompletedAt,
    };

    onSaveOrder(updated);

    if (nextStatus === 'ready' || nextStatus === 'completed') {
      playKitchenBell();
    }
  };

  // Toggle Hold / Resume for an order
  const handleResumeOrder = (order: BillOrder) => {
    const updated: BillOrder = {
      ...order,
      isKitchenHold: false,
      kitchenHoldReason: undefined,
      kitchenHeldAt: undefined,
      kitchenStatus: order.kitchenStatus || 'pending'
    };

    onSaveOrder(updated);
    playKitchenOrderChime();
  };

  const handleOpenHoldModal = (order: BillOrder) => {
    setHoldingOrder(order);
    setSelectedHoldReason(holdReasonPresets[0]);
    setCustomHoldNote('');
  };

  const handleConfirmHold = () => {
    if (!holdingOrder) return;

    const reasonText = customHoldNote.trim() 
      ? customHoldNote.trim() 
      : selectedHoldReason;

    const updated: BillOrder = {
      ...holdingOrder,
      isKitchenHold: true,
      kitchenHoldReason: reasonText,
      kitchenHeldAt: new Date().toISOString(),
    };

    onSaveOrder(updated);
    setHoldingOrder(null);
  };

  // Toggle prepared status for single item on a ticket
  const handleToggleItemPrepared = (order: BillOrder, itemId: string) => {
    const currentMap = { ...(order.itemPreparedMap || {}) };
    currentMap[itemId] = !currentMap[itemId];

    // Check if all items on the order are now prepared
    const allPrepared = order.items.every(item => currentMap[item.id]);

    const updated: BillOrder = {
      ...order,
      itemPreparedMap: currentMap,
      isKitchenHold: false,
      kitchenStatus: allPrepared ? 'ready' : (order.kitchenStatus === 'pending' ? 'preparing' : order.kitchenStatus),
      kitchenReadyAt: allPrepared && !order.kitchenReadyAt ? new Date().toISOString() : order.kitchenReadyAt,
    };

    onSaveOrder(updated);
    if (allPrepared) {
      playKitchenBell();
    }
  };

  // Calculate elapsed time formatted string and severity level
  // Color-coded thresholds: Green for < 10min, Yellow for 10-20min, Red for > 20min
  const getElapsedInfo = (createdAtIso: string) => {
    const createdTime = new Date(createdAtIso).getTime();
    const diffSeconds = Math.max(0, Math.floor((currentTime.getTime() - createdTime) / 1000));
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;

    let timeText = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      timeText = `${hours}h ${remMins}m`;
    }

    let colorCategory: 'green' | 'yellow' | 'red' = 'green';
    let badgeClasses = 'bg-emerald-600 text-white border-emerald-400/80 shadow-xs';
    let statusLabel = '< 10m';
    let urgency: 'normal' | 'warning' | 'urgent' = 'normal';

    if (mins >= 20) {
      colorCategory = 'red';
      urgency = 'urgent';
      badgeClasses = 'bg-red-600 text-white font-black border-red-400 shadow-sm animate-pulse';
      statusLabel = '> 20m Overdue';
    } else if (mins >= 10) {
      colorCategory = 'yellow';
      urgency = 'warning';
      badgeClasses = 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-xs';
      statusLabel = '10-20m Attention';
    } else {
      colorCategory = 'green';
      urgency = 'normal';
      badgeClasses = 'bg-emerald-600 text-white font-bold border-emerald-400 shadow-xs';
      statusLabel = '< 10m Fresh';
    }

    return { timeText, mins, secs, colorCategory, badgeClasses, statusLabel, urgency };
  };

  // Print Kitchen Order Ticket (KOT) helper
  const handlePrintKOT = (order: BillOrder) => {
    const printWindow = window.open('', '_blank', 'width=420,height=600');
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => `
      <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin: 8px 0; border-bottom: 1px dashed #ccc; padding-bottom: 4px;">
        <span><strong style="font-size: 18px;">${item.quantity}x</strong> ${item.name}</span>
      </div>
      ${item.notes ? `<div style="font-size: 14px; font-style: italic; color: #d97706; margin-left: 24px; margin-bottom: 6px;">*** ${item.notes} ***</div>` : ''}
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KOT #${order.invoiceNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; color: #000; }
            h1 { font-size: 24px; margin: 0 0 5px 0; text-align: center; }
            .meta { font-size: 14px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .table-badge { font-size: 26px; font-weight: 900; text-align: center; margin: 10px 0; background: #eee; padding: 6px; }
            .hold-tag { background: #000; color: #fff; padding: 4px 8px; text-align: center; font-weight: bold; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <h1>${profile.name} - KITCHEN TICKET</h1>
          ${order.isKitchenHold ? `<div class="hold-tag">** ON HOLD: ${order.kitchenHoldReason || 'STANDBY'} **</div>` : ''}
          <div class="table-badge">${order.tableNumber ? order.tableNumber.toUpperCase() : order.orderType.toUpperCase()}</div>
          <div class="meta">
            <div>Order: #${order.invoiceNumber}</div>
            <div>Time: ${new Date(order.createdAt).toLocaleTimeString()}</div>
            <div>Server: ${order.serverName || 'QR Order'}</div>
            <div>Type: ${order.orderType.toUpperCase()}</div>
            ${order.customerName ? `<div>Guest: ${order.customerName}</div>` : ''}
          </div>
          <div style="margin-top: 10px;">
            ${itemsHtml}
          </div>
          ${order.notes ? `
            <div style="margin-top: 15px; border-top: 1px solid #000; padding-top: 8px; font-size: 14px;">
              <strong>Special Instructions:</strong><br/>
              ${order.notes}
            </div>
          ` : ''}
          <div style="margin-top: 20px; text-align: center; font-size: 12px;">
            -- KITCHEN DISPLAY COPY --
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Top Header Bar & Tablet Display Controls */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Title & Live Shift Stats */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Kitchen Display System (KDS)
              </h1>
              <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold px-2.5 py-0.5 rounded-full animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                LIVE
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-mono text-slate-300 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span>•</span>
              <span className="text-amber-400 font-bold">
                {counts.active} Active Ticket{counts.active !== 1 ? 's' : ''}
              </span>
              {counts.hold > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-300 font-extrabold flex items-center gap-1 bg-amber-400/20 px-2 py-0.5 rounded-md">
                    <PauseCircle className="w-3 h-3 text-amber-400" />
                    {counts.hold} on Standby
                  </span>
                </>
              )}
              {/* Color-Coded Time Elapsed SLA Legend */}
              <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-700 text-[11px]">
                <span className="text-slate-400 font-medium">Elapsed SLA:</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> &lt;10m
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> 10-20m
                </span>
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> &gt;20m
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons (Tablet Touch Ready) */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* Prep Summary Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowPrepSummary(prev => !prev)}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              showPrepSummary 
                ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-400/50' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Prep Summary ({prepSummary.reduce((acc, i) => acc + i.quantity, 0)})</span>
          </button>

          {/* Acoustic Kitchen Order Chime Toggle (Independent local audio alert) */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 shadow-xs">
            <button
              id="kitchen-acoustic-chime-toggle-btn"
              type="button"
              onClick={handleToggleKitchenChime}
              title={kitchenChimeOn 
                ? 'Kitchen Acoustic Order Chime: ENABLED. Chimes for incoming tickets independently of other app sounds. Click to mute.' 
                : 'Kitchen Acoustic Order Chime: MUTED. Click to enable independent acoustic chime.'}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                kitchenChimeOn 
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs ring-1 ring-amber-300' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              {kitchenChimeOn ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-slate-950" />
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping inline-block" />
                    <span>Chime ON</span>
                  </span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chime Muted</span>
                </>
              )}
            </button>

            {/* Test Kitchen Chime Acoustic Tone */}
            <button
              id="kitchen-test-chime-btn"
              type="button"
              onClick={handleTestKitchenChime}
              title="Test kitchen acoustic chime speaker volume"
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                justTestedChime
                  ? 'bg-emerald-500 text-slate-950 font-black scale-105'
                  : 'text-slate-300 hover:text-amber-400 hover:bg-slate-700/80'
              }`}
            >
              <Bell className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Test</span>
            </button>

            {/* Manual Counter Service Bell Ding */}
            <button
              id="kitchen-ring-bell-btn"
              type="button"
              onClick={() => playKitchenBell()}
              title="Ring counter service desk bell"
              className="px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg cursor-pointer"
            >
              🔔
            </button>
          </div>

          {/* Card Density Toggle */}
          <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                density === 'compact' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setDensity('normal')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                density === 'normal' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setDensity('large')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                density === 'large' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Large
            </button>
          </div>

          {/* Fullscreen Kitchen Tablet Mode */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title="Toggle Kitchen Fullscreen Mode"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Kitchen Prep Sheet Summary (Aggregated Dish Cooking Requirements) */}
      {showPrepSummary && prepSummary.length > 0 && (
        <div className="bg-amber-500/10 dark:bg-amber-500/5 border-2 border-amber-400/40 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-sm">
              <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>Consolidated Kitchen Cook List (Excluding tickets on standby)</span>
            </div>
            <div className="flex items-center gap-2">
              {counts.hold > 0 && (
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md">
                  {counts.hold} ticket{counts.hold > 1 ? 's' : ''} on hold
                </span>
              )}
              <span className="text-xs font-bold bg-amber-200/80 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                {prepSummary.reduce((acc, i) => acc + i.quantity, 0)} Active Portions
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {prepSummary.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-900 border border-amber-300/60 dark:border-amber-400/30 p-2.5 rounded-2xl shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                    {item.name}
                  </span>
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {item.quantity}
                  </span>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">{item.tables.join(', ')}</span>
                  {item.notes.length > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-bold" title={item.notes.join(' | ')}>
                      ⚠️ Mod
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setTabFilter('active')}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              tabFilter === 'active'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Active</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
              {counts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabFilter('pending')}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              tabFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-400/50'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>New / Pending</span>
            {counts.pending > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-900 text-amber-100 font-black">
                {counts.pending}
              </span>
            )}
          </button>

          {/* Standby / Hold Filter Tab */}
          <button
            type="button"
            onClick={() => setTabFilter('hold')}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              tabFilter === 'hold'
                ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400/50'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20'
            }`}
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>On Hold / Standby</span>
            {counts.hold > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-900 text-amber-100 font-black">
                {counts.hold}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTabFilter('preparing')}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              tabFilter === 'preparing'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/50'
                : 'bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>In Oven / Cooking</span>
            {counts.preparing > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-900 text-blue-100 font-black">
                {counts.preparing}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTabFilter('ready')}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              tabFilter === 'ready'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/50'
                : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready on Pass</span>
            {counts.ready > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-900 text-emerald-100 font-black">
                {counts.ready}
              </span>
            )}
          </button>

          <button
            id="kitchen-tab-completed"
            type="button"
            onClick={() => setTabFilter('completed')}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              tabFilter === 'completed'
                ? 'bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md ring-2 ring-emerald-400/50'
                : 'bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Completed (Last 10)</span>
            {counts.completed > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                tabFilter === 'completed'
                  ? 'bg-slate-800 dark:bg-emerald-950 text-emerald-300 dark:text-emerald-200'
                  : 'bg-emerald-900 dark:bg-emerald-400 text-emerald-100 dark:text-slate-950'
              }`}>
                {Math.min(counts.completed, 10)}
              </span>
            )}
          </button>
        </div>

        {/* Right Filter Controls: Order Type & Search */}
        <div className="flex items-center gap-2">
          
          {/* Order Type Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['all', 'dine-in', 'takeout'] as OrderTypeFilter[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                  typeFilter === t
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[140px] sm:min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Table, note or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Completed Orders Reference Banner (When Completed tab is active) */}
      {tabFilter === 'completed' && filteredOrders.length > 0 && (
        <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-400/40 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-300 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black truncate">
                Last 10 Finalized & Served Orders
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                Quick reference view to inspect dish preparations, order notes, or recall tickets without returning to POS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-300/60 dark:border-emerald-500/40">
              Showing {filteredOrders.length} of {counts.completed} finalized
            </span>
          </div>
        </div>
      )}

      {/* Kitchen Ticket Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {tabFilter === 'active' 
              ? 'All Kitchen Orders Cleared!' 
              : tabFilter === 'hold' 
              ? 'No Orders on Standby' 
              : tabFilter === 'completed'
              ? 'No Finalized Orders Yet'
              : `No ${tabFilter} orders found`}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            {tabFilter === 'active'
              ? 'The kitchen queue is currently clear. New dine-in tickets and QR self-orders will appear here in real-time with an acoustic alert.'
              : tabFilter === 'hold'
              ? 'All pending orders are actively cooking. Use the "Hold" button on any pending ticket to place it on standby.'
              : tabFilter === 'completed'
              ? 'Finalized and served tickets will appear here for quick kitchen reference and verification.'
              : 'Try changing the status tab or search filter to see other orders.'}
          </p>
          {tabFilter !== 'active' && (
            <button
              type="button"
              onClick={() => { setTabFilter('active'); setTypeFilter('all'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold rounded-xl cursor-pointer shadow-xs"
            >
              Reset to All Active
            </button>
          )}
        </div>
      ) : (
        <div className={`grid gap-4 ${
          density === 'large'
            ? 'grid-cols-1 md:grid-cols-2'
            : density === 'compact'
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {filteredOrders.map((order) => {
            const status = getOrderKitchenStatus(order);
            const isHold = Boolean(order.isKitchenHold);
            const isFinalized = isOrderFinalizedOrServed(order);
            const elapsed = getElapsedInfo(order.createdAt);
            const preparedMap = order.itemPreparedMap || {};
            const totalItemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
            const preparedItemsCount = order.items.reduce((acc, i) => acc + (preparedMap[i.id] ? i.quantity : 0), 0);
            const isAllItemsPrepared = preparedItemsCount === totalItemsCount && totalItemsCount > 0;
            const isQR = order.serverName === 'Table QR Self-Order' || (!order.serverName && order.tableNumber);

            // Border and Header Color styling by status / urgency / hold
            let cardBorder = 'border-slate-200 dark:border-slate-800';
            let headerBg = 'bg-slate-900 text-white';
            let statusBadgeColor = 'bg-amber-400 text-slate-950';

            if (isFinalized) {
              cardBorder = 'border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10';
              headerBg = 'bg-slate-900 dark:bg-slate-950 text-emerald-300 border-b border-emerald-500/30';
              statusBadgeColor = 'bg-emerald-500 text-slate-950 font-black';
            } else if (isHold) {
              cardBorder = 'border-amber-500/80 dark:border-amber-500/70 border-dashed ring-4 ring-amber-400/20';
              headerBg = 'bg-slate-950 text-amber-200 border-b border-amber-500/40';
              statusBadgeColor = 'bg-amber-500 text-slate-950 font-black';
            } else if (status === 'ready') {
              cardBorder = 'border-emerald-500 dark:border-emerald-500/80 ring-2 ring-emerald-500/20';
              headerBg = 'bg-emerald-900 dark:bg-emerald-950 text-emerald-50';
              statusBadgeColor = 'bg-emerald-400 text-slate-950';
            } else if (status === 'preparing') {
              cardBorder = elapsed.colorCategory === 'red' 
                ? 'border-red-500 dark:border-red-500 ring-2 ring-red-500/30 shadow-red-500/10' 
                : elapsed.colorCategory === 'yellow'
                ? 'border-amber-500/80 dark:border-amber-400/80 ring-2 ring-amber-400/20'
                : 'border-blue-500/80 dark:border-blue-500/80 ring-1 ring-blue-500/20';
              headerBg = elapsed.colorCategory === 'red' 
                ? 'bg-red-950 text-red-100' 
                : 'bg-blue-950 text-blue-100';
              statusBadgeColor = 'bg-blue-400 text-slate-950';
            } else if (status === 'pending') {
              cardBorder = elapsed.colorCategory === 'red'
                ? 'border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-500/10'
                : elapsed.colorCategory === 'yellow'
                ? 'border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/30'
                : 'border-emerald-500/50 dark:border-emerald-500/40 ring-1 ring-emerald-500/20';
              headerBg = elapsed.colorCategory === 'red'
                ? 'bg-red-950 text-red-100'
                : 'bg-slate-900 text-white';
              statusBadgeColor = 'bg-amber-400 text-slate-950 animate-pulse';
            }

            return (
              <div
                key={order.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border-2 ${cardBorder} shadow-md flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  isHold ? 'bg-amber-50/20 dark:bg-amber-950/10' : isFinalized ? 'opacity-95' : ''
                }`}
              >
                {/* Hold / Standby Banner on Top if Held */}
                {isHold && (
                  <div className="bg-amber-500 text-slate-950 px-3.5 py-1.5 flex items-center justify-between gap-2 text-xs font-black tracking-wide shadow-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5">
                      <PauseCircle className="w-4 h-4 fill-slate-950 text-amber-400" />
                      <span>ON STANDBY (HELD)</span>
                    </div>
                    {order.kitchenHoldReason && (
                      <span className="text-[11px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full font-bold truncate max-w-[170px]">
                        {order.kitchenHoldReason}
                      </span>
                    )}
                  </div>
                )}

                {/* Finalized Reference Banner if Completed */}
                {isFinalized && (
                  <div className="bg-emerald-600 text-white px-3.5 py-1 flex items-center justify-between gap-2 text-[11px] font-black tracking-wide shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>FINALIZED & SERVED</span>
                    </div>
                    <span className="opacity-90 font-mono text-[10px]">
                      {order.kitchenCompletedAt 
                        ? `At ${new Date(order.kitchenCompletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : order.paymentStatus === 'paid' ? 'Paid / Settled' : 'Completed'}
                    </span>
                  </div>
                )}

                {/* Ticket Card Header */}
                <div className={`p-3.5 sm:p-4 ${headerBg} flex flex-col gap-2`}>
                  
                  {/* Top Header Row: Table badge + Live Timer / Completed Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-white text-slate-950 rounded-xl font-black text-sm sm:text-base tracking-wide shadow-xs flex items-center gap-1.5">
                        {order.orderType === 'dine-in' ? (
                          <Utensils className="w-4 h-4 text-amber-600" />
                        ) : order.orderType === 'takeout' ? (
                          <ShoppingBag className="w-4 h-4 text-blue-600" />
                        ) : order.orderType === 'delivery' ? (
                          <Truck className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Building className="w-4 h-4 text-indigo-600" />
                        )}
                        <span>{order.tableNumber ? order.tableNumber.toUpperCase() : order.orderType.toUpperCase()}</span>
                      </div>

                      {order.priority === 'rush' && (
                        <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[10px] rounded-full uppercase tracking-wider animate-bounce">
                          🔥 RUSH
                        </span>
                      )}

                      {isHold && (
                        <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider">
                          PAUSED
                        </span>
                      )}
                    </div>

                    {/* Right Header Status: Finalized or Elapsed Live Timer */}
                    {isFinalized ? (
                      <div
                        title="Finalized / Served Reference Ticket"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Served</span>
                      </div>
                    ) : (
                      <div
                        title={`Time Elapsed: ${elapsed.timeText} (${elapsed.mins} mins since placed) • Threshold: ${elapsed.statusLabel}`}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-black border transition-all ${
                          isHold 
                            ? 'bg-amber-950 text-amber-300 border-amber-700/60'
                            : elapsed.colorCategory === 'red'
                            ? 'bg-red-600 text-white border-red-400 shadow-md animate-pulse'
                            : elapsed.colorCategory === 'yellow'
                            ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-xs'
                            : 'bg-emerald-600 text-white font-bold border-emerald-400/80 shadow-xs'
                        }`}
                      >
                        {isHold ? (
                          <Pause className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Timer className={`w-3.5 h-3.5 ${elapsed.colorCategory === 'red' ? 'animate-spin' : ''}`} />
                        )}
                        <span>{isHold ? `Held (${elapsed.timeText})` : elapsed.timeText}</span>
                      </div>
                    )}
                  </div>

                  {/* Secondary Header Row: Invoice # + Placement Time + Server / QR Origin */}
                  <div className="flex items-center justify-between text-xs opacity-90 pt-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-amber-300">#{order.invoiceNumber}</span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-300 font-mono" title="Order placed time">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-[110px] font-medium">
                        {order.customerName || 'Walk-in'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px]">
                      {isQR ? (
                        <span className="flex items-center gap-1 bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-semibold">
                          <Smartphone className="w-3 h-3" /> QR
                        </span>
                      ) : (
                        <span className="text-slate-300 font-medium truncate max-w-[100px]">
                          {order.serverName || 'Staff'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ticket Items Checklist Body */}
                <div className={`p-3.5 sm:p-4 flex-1 space-y-2.5 ${
                  isHold ? 'bg-amber-50/10 dark:bg-slate-950/60' : 'bg-slate-50/50 dark:bg-slate-950/40'
                }`}>
                  
                  {/* Items List (Touch to Mark Prepared) */}
                  <div className="space-y-2">
                    {order.items.map((item) => {
                      const isPrepared = Boolean(preparedMap[item.id]);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItemPrepared(order, item.id)}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-2.5 ${
                            isPrepared
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 opacity-60'
                              : isHold
                              ? 'bg-white dark:bg-slate-900/90 border-amber-300/40 dark:border-amber-500/20 hover:border-amber-400 shadow-2xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 shadow-2xs'
                          }`}
                        >
                          {/* Left: Quantity Badge & Item Details */}
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {/* Quantity Pill */}
                            <div className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                              isPrepared
                                ? 'bg-emerald-500 text-white'
                                : isHold
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
                                : 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950'
                            }`}>
                              {item.quantity}x
                            </div>

                            <div className="flex-1 min-w-0">
                              <span className={`text-xs sm:text-sm font-bold block leading-snug ${
                                isPrepared 
                                  ? 'line-through text-slate-500 dark:text-slate-400 font-medium' 
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}>
                                {item.name}
                              </span>

                              {/* Special Cooking Modifiers / Notes */}
                              {item.notes && (
                                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100/90 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 text-[11px] font-bold rounded-lg border border-amber-300/80 dark:border-amber-500/30">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span>{item.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Touch Checkbox */}
                          <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isPrepared
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-transparent hover:border-amber-400'
                          }`}>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Customer General Instructions / Allergy Alert */}
                  {order.notes && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl text-xs text-amber-900 dark:text-amber-300">
                      <div className="font-extrabold flex items-center gap-1 mb-0.5 text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Ticket Notes & Preferences</span>
                      </div>
                      <p className="font-medium leading-relaxed">{order.notes}</p>
                    </div>
                  )}
                </div>

                {/* Ticket Card Footer & Tablet Action Buttons */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  
                  {/* Print KOT Button */}
                  <button
                    type="button"
                    onClick={() => handlePrintKOT(order)}
                    title="Print Thermal Kitchen Ticket (KOT)"
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* Dynamic Action Buttons: Hold / Resume & Cooking Controls */}
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    
                    {/* If ticket is currently on Hold: Show prominent Resume / Fire button */}
                    {isHold ? (
                      <button
                        type="button"
                        onClick={() => handleResumeOrder(order)}
                        title="Resume and fire ticket to active cooking line"
                        className="flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer animate-in zoom-in-95"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Resume & Fire Order</span>
                      </button>
                    ) : (
                      <>
                        {/* Hold button for pending / preparing orders */}
                        {(status === 'pending' || status === 'preparing') && (
                          <button
                            type="button"
                            onClick={() => handleOpenHoldModal(order)}
                            title="Put order on Standby / Hold"
                            className="py-2.5 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-slate-700 dark:text-slate-300 hover:text-amber-900 dark:hover:text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Hold</span>
                          </button>
                        )}

                        {status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, 'preparing')}
                              className="flex-1 py-2.5 px-3 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <Flame className="w-4 h-4 text-amber-400 dark:text-slate-950" />
                              <span>Start Cooking</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, 'ready')}
                              title="Instantly mark whole ticket ready"
                              className="py-2.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Ready</span>
                            </button>
                          </>
                        )}

                        {status === 'preparing' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, 'ready')}
                              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer animate-in zoom-in-95"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Mark All Ready</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, 'pending')}
                              title="Revert back to Pending"
                              className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {status === 'ready' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, 'completed')}
                              className="flex-1 py-2.5 px-3 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                            >
                              <Utensils className="w-4 h-4 text-amber-400 dark:text-slate-950" />
                              <span>Bump / Served</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, 'preparing')}
                              title="Revert to cooking"
                              className="py-2.5 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {(isFinalized || status === 'completed' || status === 'served') && (
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            {onViewInvoice && (
                              <button
                                type="button"
                                onClick={() => onViewInvoice(order)}
                                title="View full POS invoice & receipt reference without leaving KDS"
                                className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-500" />
                                <span>View Bill Reference</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, 'preparing')}
                              title="Recall ticket back to active cooking queue"
                              className="py-2.5 px-3 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300/60 dark:border-amber-500/30 shadow-2xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Recall Ticket</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Put Ticket on Standby / Hold */}
      {holdingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <PauseCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Place Ticket on Standby (Hold)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {holdingOrder.tableNumber ? `Table ${holdingOrder.tableNumber}` : holdingOrder.orderType.toUpperCase()} • #{holdingOrder.invoiceNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHoldingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Placing this order on hold will visually distinguish it from the active cooking line and exclude its items from the active prep cook sheet until resumed.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Standby Reason:
                </label>
                <div className="space-y-1.5">
                  {holdReasonPresets.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => {
                        setSelectedHoldReason(reason);
                        setCustomHoldNote('');
                      }}
                      className={`w-full p-2.5 text-left text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedHoldReason === reason && !customHoldNote
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{reason}</span>
                      {selectedHoldReason === reason && !customHoldNote && (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Or Custom Kitchen Note:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hold until guest finishes soup..."
                  value={customHoldNote}
                  onChange={(e) => setCustomHoldNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setHoldingOrder(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHold}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Confirm Hold</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
