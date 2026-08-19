import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Award,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  Utensils,
  Truck,
  CheckCircle2,
  Lock,
  Flame,
  Clock,
  Sparkles,
  ArrowUpRight,
  Receipt,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { BillOrder, RestaurantProfile, StaffUser } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface DailySalesSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCloseTerminal?: () => void;
  orders: BillOrder[];
  profile: RestaurantProfile;
  currentUser: StaffUser | null;
  isCloseoutTrigger?: boolean;
}

export const DailySalesSummaryModal: React.FC<DailySalesSummaryModalProps> = ({
  isOpen,
  onClose,
  onConfirmCloseTerminal,
  orders,
  profile,
  currentUser,
  isCloseoutTrigger = false,
}) => {
  // Selected date key (defaults to local today YYYY-MM-DD)
  const getTodayDateKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateKey());
  const [activeViewTab, setActiveViewTab] = useState<'overview' | 'popular' | 'payments' | 'orders'>('overview');

  // Filter orders for the selected date
  const dayOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.isArchived || order.paymentStatus === 'cancelled') return false;
      if (!order.createdAt) return false;
      try {
        const d = new Date(order.createdAt);
        const localKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return localKey === selectedDate || order.createdAt.startsWith(selectedDate);
      } catch (e) {
        return order.createdAt.startsWith(selectedDate);
      }
    });
  }, [orders, selectedDate]);

  // Metric calculations
  const metrics = useMemo(() => {
    const paidOrders = dayOrders.filter(o => o.paymentStatus === 'paid');
    const pendingOrders = dayOrders.filter(o => o.paymentStatus === 'pending');

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const grossTotal = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalTax = paidOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);
    const totalTips = paidOrders.reduce((sum, o) => sum + (o.tipAmount || 0), 0);
    const totalDiscounts = paidOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
    const totalServiceCharge = paidOrders.reduce((sum, o) => sum + (o.serviceChargeAmount || 0), 0);

    const orderCount = dayOrders.length;
    const paidCount = paidOrders.length;
    const pendingCount = pendingOrders.length;
    const aov = paidCount > 0 ? totalRevenue / paidCount : 0;

    // Popular Items Ranking
    const itemMap: Record<string, { id: string; name: string; quantity: number; revenue: number; price: number }> = {};
    let totalItemsSold = 0;

    dayOrders.forEach(order => {
      order.items?.forEach(item => {
        const key = item.menuItemId || item.name;
        if (!itemMap[key]) {
          itemMap[key] = {
            id: key,
            name: item.name,
            quantity: 0,
            revenue: 0,
            price: item.price || 0,
          };
        }
        itemMap[key].quantity += item.quantity;
        itemMap[key].revenue += (item.price || 0) * item.quantity;
        totalItemsSold += item.quantity;
      });
    });

    const popularItems = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);

    // Payment Methods Breakdown
    const paymentBreakdown: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      credit_card: { count: 0, total: 0 },
      debit_card: { count: 0, total: 0 },
      upi_qr: { count: 0, total: 0 },
      bank_transfer: { count: 0, total: 0 },
      house_account: { count: 0, total: 0 },
      split: { count: 0, total: 0 },
    };

    paidOrders.forEach(order => {
      const method = order.paymentMethod || 'cash';
      if (!paymentBreakdown[method]) {
        paymentBreakdown[method] = { count: 0, total: 0 };
      }
      paymentBreakdown[method].count += 1;
      paymentBreakdown[method].total += order.total;
    });

    // Order Types Breakdown
    const orderTypesBreakdown = {
      dineIn: { count: 0, total: 0 },
      takeout: { count: 0, total: 0 },
      delivery: { count: 0, total: 0 },
      qrSelf: { count: 0, total: 0 },
    };

    dayOrders.forEach(order => {
      const isQR = order.serverName === 'Table QR Self-Order' || (!order.serverName && order.tableNumber);
      if (isQR) {
        orderTypesBreakdown.qrSelf.count += 1;
        orderTypesBreakdown.qrSelf.total += order.total;
      }

      if (order.orderType === 'dine-in') {
        orderTypesBreakdown.dineIn.count += 1;
        orderTypesBreakdown.dineIn.total += order.total;
      } else if (order.orderType === 'takeout') {
        orderTypesBreakdown.takeout.count += 1;
        orderTypesBreakdown.takeout.total += order.total;
      } else if (order.orderType === 'delivery') {
        orderTypesBreakdown.delivery.count += 1;
        orderTypesBreakdown.delivery.total += order.total;
      }
    });

    return {
      totalRevenue,
      grossTotal,
      totalTax,
      totalTips,
      totalDiscounts,
      totalServiceCharge,
      orderCount,
      paidCount,
      pendingCount,
      aov,
      totalItemsSold,
      popularItems,
      paymentBreakdown,
      orderTypesBreakdown,
    };
  }, [dayOrders]);

  if (!isOpen) return null;

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadReport = () => {
    const reportData = {
      reportTitle: 'Daily Sales & POS Closeout Summary',
      restaurant: profile.name,
      generatedAt: new Date().toISOString(),
      reportDate: selectedDate,
      closedBy: currentUser?.displayName || 'Admin / Manager',
      financials: {
        totalCollectedRevenue: metrics.totalRevenue,
        grossSalesValue: metrics.grossTotal,
        taxCollected: metrics.totalTax,
        tipsCollected: metrics.totalTips,
        discountsGiven: metrics.totalDiscounts,
        averageOrderValue: metrics.aov,
      },
      ordersSummary: {
        totalOrdersCount: metrics.orderCount,
        paidOrdersCount: metrics.paidCount,
        pendingOrdersCount: metrics.pendingCount,
        totalItemsSold: metrics.totalItemsSold,
      },
      popularItemsRanked: metrics.popularItems.map((item, idx) => ({
        rank: idx + 1,
        itemName: item.name,
        unitsSold: item.quantity,
        totalRevenue: item.revenue,
      })),
      paymentMethods: metrics.paymentBreakdown,
      orders: dayOrders.map(o => ({
        invoice: o.invoiceNumber,
        table: o.tableNumber || o.orderType,
        total: o.total,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        time: o.createdAt,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Daily-Sales-Summary-${selectedDate}-${profile.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="daily-sales-summary-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-sales-title"
    >
      {/* Interactive Screen Modal Container */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden my-auto max-h-[92vh] no-print">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
              <DollarSign className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="daily-sales-title" className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Daily Sales & Closeout Summary
                </h2>
                {isCloseoutTrigger && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                    Shift Closeout
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span>{profile.name}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-amber-300">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedDate === getTodayDateKey() ? `Today (${selectedDate})` : selectedDate}
                </span>
                {currentUser && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">Admin: {currentUser.displayName}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Action Tools & Date Selector */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
              title="Change Summary Date"
            />

            <button
              type="button"
              onClick={handlePrintReport}
              title="Print Daily Z-Report / Sales Summary"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Report</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadReport}
              title="Export Daily Sales Data (JSON)"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveViewTab('overview')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeViewTab === 'overview'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Revenue & KPIs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('popular')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeViewTab === 'popular'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Popular Items ({metrics.popularItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('payments')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeViewTab === 'payments'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Methods</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('orders')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeViewTab === 'orders'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Today's Orders ({metrics.orderCount})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* Top 4 KPI Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/10 dark:to-transparent p-4 rounded-2xl border border-amber-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Total Net Sales
                </span>
                <span className="p-1.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
                  <DollarSign className="w-4 h-4 stroke-[2.5]" />
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-amber-400 tracking-tight font-mono">
                  {formatCurrency(metrics.totalRevenue, profile.currency)}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  From {metrics.paidCount} settled orders
                </p>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Order Count
                </span>
                <span className="p-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white shadow-xs">
                  <ShoppingBag className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {metrics.orderCount}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{metrics.paidCount} Paid</span>
                  {metrics.pendingCount > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">• {metrics.pendingCount} Open</span>
                  )}
                </div>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Avg Ticket (AOV)
                </span>
                <span className="p-1.5 rounded-xl bg-blue-600 text-white shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {formatCurrency(metrics.aov, profile.currency)}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Per completed table/ticket
                </p>
              </div>
            </div>

            {/* Total Items Prepared */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Items Prepared
                </span>
                <span className="p-1.5 rounded-xl bg-purple-600 text-white shadow-xs">
                  <Utensils className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {metrics.totalItemsSold}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Across {metrics.popularItems.length} menu dishes
                </p>
              </div>
            </div>
          </div>

          {/* Pending Orders Warning Alert if any remain open */}
          {metrics.pendingCount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    {metrics.pendingCount} Active Unpaid Table Orders Remaining
                  </h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400/80">
                    Review and settle these dine-in bills before closing out shift for accurate revenue reporting.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveViewTab('orders')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
              >
                View Open Orders
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW & FINANCIAL TAX BREAKDOWN */}
          {activeViewTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Financial Breakdown Table */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-500" />
                  <span>Sales & Tax Breakdown (Z-Report)</span>
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-600 dark:text-slate-400">Gross Sales (All Orders)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(metrics.grossTotal, profile.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-600 dark:text-slate-400">Total Discounts Applied</span>
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">
                      -{formatCurrency(metrics.totalDiscounts, profile.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-600 dark:text-slate-400">GST / Sales Tax Collected</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(metrics.totalTax, profile.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-600 dark:text-slate-400">Service Charges Collected</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(metrics.totalServiceCharge, profile.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-600 dark:text-slate-400">Tips Received (Staff Pool)</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(metrics.totalTips, profile.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between pt-2 text-sm font-black text-slate-950 dark:text-amber-400">
                    <span>Total Settled Revenue</span>
                    <span className="font-mono text-base">
                      {formatCurrency(metrics.totalRevenue, profile.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Channel Split */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-blue-500" />
                    <span>Order Channels & Fulfillment</span>
                  </h4>

                  <div className="space-y-3">
                    {/* Dine In */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Utensils className="w-3.5 h-3.5 text-amber-600" />
                          Dine-In Tables
                        </span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">
                          {metrics.orderTypesBreakdown.dineIn.count} orders ({formatCurrency(metrics.orderTypesBreakdown.dineIn.total, profile.currency)})
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${metrics.orderCount > 0 ? (metrics.orderTypesBreakdown.dineIn.count / metrics.orderCount) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Takeout */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                          Takeout / Pick-up
                        </span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">
                          {metrics.orderTypesBreakdown.takeout.count} orders ({formatCurrency(metrics.orderTypesBreakdown.takeout.total, profile.currency)})
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${metrics.orderCount > 0 ? (metrics.orderTypesBreakdown.takeout.count / metrics.orderCount) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Delivery */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Truck className="w-3.5 h-3.5 text-purple-600" />
                          Delivery
                        </span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">
                          {metrics.orderTypesBreakdown.delivery.count} orders ({formatCurrency(metrics.orderTypesBreakdown.delivery.total, profile.currency)})
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${metrics.orderCount > 0 ? (metrics.orderTypesBreakdown.delivery.count / metrics.orderCount) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* QR Self-Order */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                          Table QR Guest Self-Orders
                        </span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">
                          {metrics.orderTypesBreakdown.qrSelf.count} orders ({formatCurrency(metrics.orderTypesBreakdown.qrSelf.total, profile.currency)})
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${metrics.orderCount > 0 ? (metrics.orderTypesBreakdown.qrSelf.count / metrics.orderCount) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Cashier Station: Terminal 01</span>
                  <span>Registered Staff: {currentUser?.displayName || 'Admin'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MOST POPULAR ITEMS */}
          {(activeViewTab === 'popular' || activeViewTab === 'overview') && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Most Popular Items (Top Selling Dishes Today)
                  </h4>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {metrics.totalItemsSold} total items sold
                </span>
              </div>

              {metrics.popularItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No dishes recorded for this selected date.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="pb-2.5 font-bold">Rank</th>
                        <th className="pb-2.5 font-bold">Dish / Item Name</th>
                        <th className="pb-2.5 font-bold text-center">Qty Sold</th>
                        <th className="pb-2.5 font-bold text-right">Price</th>
                        <th className="pb-2.5 font-bold text-right">Total Revenue</th>
                        <th className="pb-2.5 font-bold text-right">% Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {metrics.popularItems.slice(0, activeViewTab === 'overview' ? 5 : 50).map((item, index) => {
                        const share = metrics.totalRevenue > 0 ? (item.revenue / metrics.totalRevenue) * 100 : 0;
                        const rankMedal =
                          index === 0 ? '🥇 #1' :
                          index === 1 ? '🥈 #2' :
                          index === 2 ? '🥉 #3' : `#${index + 1}`;

                        return (
                          <tr key={item.id || item.name} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2.5 font-black">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                index === 0 ? 'bg-amber-400/20 text-amber-600 dark:text-amber-300 border border-amber-400/40' :
                                index === 1 ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                                index === 2 ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' :
                                'text-slate-500'
                              }`}>
                                {rankMedal}
                              </span>
                            </td>
                            <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">
                              {item.name}
                            </td>
                            <td className="py-2.5 text-center font-mono font-black text-slate-950 dark:text-amber-400">
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs">
                                {item.quantity}x
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                              {formatCurrency(item.price, profile.currency)}
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                              {formatCurrency(item.revenue, profile.currency)}
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold text-slate-500 dark:text-slate-400">
                              {share.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {activeViewTab === 'overview' && metrics.popularItems.length > 5 && (
                    <div className="mt-3 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveViewTab('popular')}
                        className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        View all {metrics.popularItems.length} popular items →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYMENT METHOD SPLIT */}
          {activeViewTab === 'payments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(metrics.paymentBreakdown) as [string, { count: number; total: number }][]).map(([method, data]) => {
                if (data.count === 0 && method !== 'cash' && method !== 'credit_card' && method !== 'upi_qr') return null;

                const getMethodName = (m: string) => {
                  switch (m) {
                    case 'cash': return 'Cash Drawer / Register';
                    case 'credit_card': return 'Credit Card Terminal';
                    case 'debit_card': return 'Debit Card';
                    case 'upi_qr': return 'UPI / QR Code Scan';
                    case 'bank_transfer': return 'Bank Transfer / Wire';
                    case 'house_account': return 'House Account / Tab';
                    case 'split': return 'Split Payments';
                    default: return m;
                  }
                };

                const getMethodIcon = (m: string) => {
                  switch (m) {
                    case 'cash': return <Banknote className="w-5 h-5 text-emerald-500" />;
                    case 'credit_card':
                    case 'debit_card': return <CreditCard className="w-5 h-5 text-blue-500" />;
                    case 'upi_qr': return <QrCode className="w-5 h-5 text-indigo-500" />;
                    default: return <DollarSign className="w-5 h-5 text-amber-500" />;
                  }
                };

                const percentage = metrics.totalRevenue > 0 ? (data.total / metrics.totalRevenue) * 100 : 0;

                return (
                  <div key={method} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-xs">
                        {getMethodIcon(method)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {getMethodName(method)}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {data.count} transactions ({percentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        {formatCurrency(data.total, profile.currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: ORDERS LIST */}
          {activeViewTab === 'orders' && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  All {dayOrders.length} Tickets for {selectedDate}
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] uppercase">
                      <th className="pb-2">Invoice #</th>
                      <th className="pb-2">Table / Type</th>
                      <th className="pb-2">Items</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Method</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {dayOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                        <td className="py-2 font-mono font-bold text-slate-900 dark:text-slate-100">
                          #{order.invoiceNumber}
                        </td>
                        <td className="py-2 font-medium">
                          {order.tableNumber || order.orderType}
                        </td>
                        <td className="py-2 text-slate-500">
                          {order.items?.length || 0} items
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          }`}>
                            {order.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 text-slate-500 uppercase text-[10px]">
                          {order.paymentMethod || 'cash'}
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(order.total, profile.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer / Closeout Action Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>Verified by Admin • Automatic POS Terminal Daily Closeout</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Keep Terminal Open / Dismiss
            </button>

            {onConfirmCloseTerminal && (
              <button
                type="button"
                id="confirm-close-pos-terminal-btn"
                onClick={() => {
                  onConfirmCloseTerminal();
                  onClose();
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Confirm & Close POS Terminal</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* DEDICATED PRINT-ONLY THERMAL / PAPER Z-REPORT RECEIPT */}
      <div id="printable-daily-sales-summary" className="hidden print:block text-black bg-white">
        {/* Header */}
        <div className="text-center pb-1">
          <h1 className="font-bold text-sm uppercase tracking-wider">{profile.name}</h1>
          {profile.tagline && <p className="text-[10px] text-neutral-600">{profile.tagline}</p>}
          {profile.address && <p className="text-[10px] text-neutral-700">{profile.address}</p>}
          {profile.phone && <p className="text-[10px] text-neutral-700">Tel: {profile.phone}</p>}
          {profile.taxId && <p className="text-[10px] text-neutral-700">Tax / GST: {profile.taxId}</p>}
        </div>

        <div className="receipt-divider-double" />

        <div className="text-center font-bold text-xs uppercase tracking-widest py-0.5">
          DAILY SALES Z-REPORT
        </div>

        <div className="receipt-divider-dashed" />

        {/* Shift & Time Details */}
        <div className="text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>REPORT DATE:</span>
            <span className="font-bold font-mono">{selectedDate}</span>
          </div>
          <div className="flex justify-between">
            <span>PRINTED AT:</span>
            <span className="font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <div className="flex justify-between">
            <span>TERMINAL:</span>
            <span>POS Main Station #1</span>
          </div>
          <div className="flex justify-between">
            <span>VERIFIED BY:</span>
            <span className="font-bold">{currentUser?.displayName || 'Admin / Manager'}</span>
          </div>
          <div className="flex justify-between">
            <span>ROLE:</span>
            <span className="uppercase">{currentUser?.role || 'Admin'}</span>
          </div>
        </div>

        <div className="receipt-divider-dashed" />

        {/* Financial Metrics */}
        <div className="font-bold text-[11px] uppercase pb-0.5">FINANCIAL REVENUE TOTALS</div>
        <div className="space-y-0.5 text-[11px]">
          <div className="receipt-row-compact">
            <span>Gross Sales:</span>
            <span className="font-mono font-bold">{formatCurrency(metrics.grossTotal, profile.currency)}</span>
          </div>
          {metrics.totalDiscounts > 0 && (
            <div className="receipt-row-compact">
              <span>Discounts / Promos:</span>
              <span className="font-mono">-{formatCurrency(metrics.totalDiscounts, profile.currency)}</span>
            </div>
          )}
          <div className="receipt-row-compact">
            <span>Taxes ({profile.taxRate}%):</span>
            <span className="font-mono">{formatCurrency(metrics.totalTax, profile.currency)}</span>
          </div>
          {metrics.totalServiceCharge > 0 && (
            <div className="receipt-row-compact">
              <span>Service Charge:</span>
              <span className="font-mono">{formatCurrency(metrics.totalServiceCharge, profile.currency)}</span>
            </div>
          )}
          {metrics.totalTips > 0 && (
            <div className="receipt-row-compact">
              <span>Tips (Staff Pool):</span>
              <span className="font-mono">+{formatCurrency(metrics.totalTips, profile.currency)}</span>
            </div>
          )}
          
          <div className="receipt-divider-double" />
          
          <div className="receipt-row-total">
            <span>NET SETTLED REVENUE:</span>
            <span className="font-mono text-sm">{formatCurrency(metrics.totalRevenue, profile.currency)}</span>
          </div>
        </div>

        <div className="receipt-divider-dashed" />

        {/* Order Volumes & Ticket Sizes */}
        <div className="font-bold text-[11px] uppercase pb-0.5">ORDER VOLUME & STATS</div>
        <div className="space-y-0.5 text-[10px]">
          <div className="receipt-row-compact">
            <span>Total Orders:</span>
            <span className="font-mono font-bold">{metrics.orderCount}</span>
          </div>
          <div className="receipt-row-compact">
            <span>• Paid & Closed:</span>
            <span className="font-mono">{metrics.paidCount}</span>
          </div>
          <div className="receipt-row-compact">
            <span>• Open / Pending:</span>
            <span className="font-mono">{metrics.pendingCount}</span>
          </div>
          <div className="receipt-row-compact">
            <span>Total Items Prepared:</span>
            <span className="font-mono font-bold">{metrics.totalItemsSold}</span>
          </div>
          <div className="receipt-row-compact">
            <span>Average Order Value (AOV):</span>
            <span className="font-mono font-bold">{formatCurrency(metrics.aov, profile.currency)}</span>
          </div>
        </div>

        <div className="receipt-divider-dashed" />

        {/* Payment Methods */}
        <div className="font-bold text-[11px] uppercase pb-0.5">PAYMENTS TENDERED</div>
        <div className="space-y-0.5 text-[10px]">
          {(Object.entries(metrics.paymentBreakdown) as [string, { count: number; total: number }][]).map(([method, data]) => {
            if (data.count === 0 && method !== 'cash' && method !== 'credit_card' && method !== 'upi_qr') return null;
            const getMethodLabel = (m: string) => {
              switch (m) {
                case 'cash': return 'Cash Drawer';
                case 'credit_card': return 'Credit Card';
                case 'debit_card': return 'Debit Card';
                case 'upi_qr': return 'UPI / QR Scan';
                case 'bank_transfer': return 'Bank Transfer';
                case 'house_account': return 'House Account';
                case 'split': return 'Split Payment';
                default: return m.toUpperCase();
              }
            };
            return (
              <div key={method} className="receipt-row-compact">
                <span>{getMethodLabel(method)} ({data.count}x):</span>
                <span className="font-mono font-bold">{formatCurrency(data.total, profile.currency)}</span>
              </div>
            );
          })}
        </div>

        <div className="receipt-divider-dashed" />

        {/* Channel Breakdown */}
        <div className="font-bold text-[11px] uppercase pb-0.5">CHANNELS & FULFILLMENT</div>
        <div className="space-y-0.5 text-[10px]">
          <div className="receipt-row-compact">
            <span>Dine-In Tables ({metrics.orderTypesBreakdown.dineIn.count}x):</span>
            <span className="font-mono">{formatCurrency(metrics.orderTypesBreakdown.dineIn.total, profile.currency)}</span>
          </div>
          <div className="receipt-row-compact">
            <span>Takeout / Pick-up ({metrics.orderTypesBreakdown.takeout.count}x):</span>
            <span className="font-mono">{formatCurrency(metrics.orderTypesBreakdown.takeout.total, profile.currency)}</span>
          </div>
          {metrics.orderTypesBreakdown.delivery.count > 0 && (
            <div className="receipt-row-compact">
              <span>Delivery ({metrics.orderTypesBreakdown.delivery.count}x):</span>
              <span className="font-mono">{formatCurrency(metrics.orderTypesBreakdown.delivery.total, profile.currency)}</span>
            </div>
          )}
          {metrics.orderTypesBreakdown.qrSelf.count > 0 && (
            <div className="receipt-row-compact">
              <span>Table QR Self-Orders ({metrics.orderTypesBreakdown.qrSelf.count}x):</span>
              <span className="font-mono">{formatCurrency(metrics.orderTypesBreakdown.qrSelf.total, profile.currency)}</span>
            </div>
          )}
        </div>

        {metrics.popularItems.length > 0 && (
          <>
            <div className="receipt-divider-dashed" />
            <div className="font-bold text-[11px] uppercase pb-0.5">TOP POPULAR ITEMS</div>
            <div className="space-y-0.5 text-[10px]">
              {metrics.popularItems.slice(0, 7).map((item, idx) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="truncate pr-1">#{idx + 1} {item.name} x{item.quantity}</span>
                  <span className="font-mono font-bold shrink-0">{formatCurrency(item.revenue, profile.currency)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="receipt-divider-double" />

        {/* Sign-off / Signature */}
        <div className="pt-2 text-[10px] space-y-3">
          <div className="flex justify-between items-center text-neutral-700">
            <span>MANAGER SIGNATURE:</span>
            <span className="border-b border-black w-28 inline-block h-3" />
          </div>
          <div className="flex justify-between items-center text-neutral-700">
            <span>CASH DRAWER BALANCED:</span>
            <span className="border-b border-black w-28 inline-block h-3" />
          </div>
        </div>

        <div className="text-center text-[9px] pt-3 text-neutral-600 tracking-wider">
          *** END OF DAILY Z-REPORT ***
        </div>
      </div>
    </div>
  );
};
