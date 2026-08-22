import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  CalendarDays, 
  ShoppingBag, 
  Receipt, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Clock, 
  Utensils, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight, 
  Printer, 
  FileSpreadsheet, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { BillOrder, Expense, MenuItem, RestaurantProfile, StaffUser } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

export interface ItemCountRecord {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  price: number;
}

export interface HourlyBucketRecord {
  count: number;
  total: number;
  label: string;
}

export interface PaymentMethodRecord {
  count: number;
  total: number;
}

export interface DailySalesRecord {
  dateKey: string;
  dateObj: Date;
  orders: BillOrder[];
  grossSales: number;
  settledRevenue: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
  totalOrdersCount: number;
  totalItemsSold: number;
  taxCollected: number;
  discountsGiven: number;
  serviceCharge: number;
  tipsCollected: number;
  paymentMethods: Record<string, PaymentMethodRecord>;
  orderTypes: Record<string, { count: number; total: number }>;
  hourlyBuckets: {
    morning: HourlyBucketRecord;
    lunch: HourlyBucketRecord;
    evening: HourlyBucketRecord;
    dinner: HourlyBucketRecord;
    lateNight: HourlyBucketRecord;
  };
  itemCounts: Record<string, ItemCountRecord>;
}

interface SalesDashboardProps {
  orders: BillOrder[];
  expenses?: Expense[];
  menuItems: MenuItem[];
  profile: RestaurantProfile;
  currentUser?: StaffUser | null;
  onViewInvoice: (order: BillOrder) => void;
  onOpenPOS?: () => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  orders,
  expenses = [],
  menuItems,
  profile,
  currentUser,
  onViewInvoice,
  onOpenPOS,
}) => {
  // Helper to get local date string YYYY-MM-DD
  const getLocalDateKey = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayKey = useMemo(() => getLocalDateKey(new Date()), []);
  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateKey(d);
  }, []);

  // Filter States
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | '14days' | '30days' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getLocalDateKey(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(todayKey);
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');

  // Selected Day for Spotlight Drilldown
  const [selectedSpotlightDate, setSelectedSpotlightDate] = useState<string>(todayKey);
  const [spotlightTab, setSpotlightTab] = useState<'timeline' | 'payments' | 'dishes' | 'orders'>('timeline');

  // Extract all valid orders
  const validOrders = useMemo(() => {
    return orders.filter(o => !o.isArchived && o.paymentStatus !== 'cancelled');
  }, [orders]);

  // Group ALL orders by Date key (YYYY-MM-DD)
  const dailyAggregates = useMemo<Record<string, DailySalesRecord>>(() => {
    const map: Record<string, DailySalesRecord> = {};

    validOrders.forEach(order => {
      if (!order.createdAt) return;
      let dateKey = '';
      let dateObj = new Date();
      try {
        dateObj = new Date(order.createdAt);
        if (isNaN(dateObj.getTime())) return;
        dateKey = getLocalDateKey(dateObj);
      } catch {
        return;
      }

      if (!map[dateKey]) {
        map[dateKey] = {
          dateKey,
          dateObj,
          orders: [],
          grossSales: 0,
          settledRevenue: 0,
          pendingAmount: 0,
          paidCount: 0,
          pendingCount: 0,
          totalOrdersCount: 0,
          totalItemsSold: 0,
          taxCollected: 0,
          discountsGiven: 0,
          serviceCharge: 0,
          tipsCollected: 0,
          paymentMethods: {
            cash: { count: 0, total: 0 },
            credit_card: { count: 0, total: 0 },
            debit_card: { count: 0, total: 0 },
            upi_qr: { count: 0, total: 0 },
            bank_transfer: { count: 0, total: 0 },
            house_account: { count: 0, total: 0 },
            split: { count: 0, total: 0 },
          },
          orderTypes: {
            'dine-in': { count: 0, total: 0 },
            'takeout': { count: 0, total: 0 },
            'delivery': { count: 0, total: 0 },
            'catering': { count: 0, total: 0 },
          },
          hourlyBuckets: {
            morning: { count: 0, total: 0, label: 'Morning (6am-12pm)' },
            lunch: { count: 0, total: 0, label: 'Lunch Rush (12pm-4pm)' },
            evening: { count: 0, total: 0, label: 'Evening (4pm-7pm)' },
            dinner: { count: 0, total: 0, label: 'Dinner Peak (7pm-10pm)' },
            lateNight: { count: 0, total: 0, label: 'Late Night (10pm+)' },
          },
          itemCounts: {},
        };
      }

      const entry = map[dateKey];
      entry.orders.push(order);
      entry.totalOrdersCount += 1;
      entry.grossSales += (order.total || 0);

      const isPaid = order.paymentStatus === 'paid';
      if (isPaid) {
        entry.settledRevenue += (order.total || 0);
        entry.paidCount += 1;
        entry.taxCollected += (order.taxAmount || 0);
        entry.discountsGiven += (order.discountAmount || 0);
        entry.serviceCharge += (order.serviceChargeAmount || 0);
        entry.tipsCollected += (order.tipAmount || 0);
      } else {
        entry.pendingAmount += (order.total || 0);
        entry.pendingCount += 1;
      }

      // Payment method breakdown
      const method = order.paymentMethod || 'cash';
      if (!entry.paymentMethods[method]) {
        entry.paymentMethods[method] = { count: 0, total: 0 };
      }
      entry.paymentMethods[method].count += 1;
      entry.paymentMethods[method].total += (order.total || 0);

      // Order type breakdown
      const type = order.orderType || 'dine-in';
      if (!entry.orderTypes[type]) {
        entry.orderTypes[type] = { count: 0, total: 0 };
      }
      entry.orderTypes[type].count += 1;
      entry.orderTypes[type].total += (order.total || 0);

      // Hourly breakdown
      const hour = dateObj.getHours();
      if (hour >= 6 && hour < 12) {
        entry.hourlyBuckets.morning.count += 1;
        entry.hourlyBuckets.morning.total += (order.total || 0);
      } else if (hour >= 12 && hour < 16) {
        entry.hourlyBuckets.lunch.count += 1;
        entry.hourlyBuckets.lunch.total += (order.total || 0);
      } else if (hour >= 16 && hour < 19) {
        entry.hourlyBuckets.evening.count += 1;
        entry.hourlyBuckets.evening.total += (order.total || 0);
      } else if (hour >= 19 && hour < 22) {
        entry.hourlyBuckets.dinner.count += 1;
        entry.hourlyBuckets.dinner.total += (order.total || 0);
      } else {
        entry.hourlyBuckets.lateNight.count += 1;
        entry.hourlyBuckets.lateNight.total += (order.total || 0);
      }

      // Items tally
      order.items?.forEach(item => {
        entry.totalItemsSold += (item.quantity || 1);
        const itemKey = item.menuItemId || item.name;
        if (!entry.itemCounts[itemKey]) {
          entry.itemCounts[itemKey] = {
            id: itemKey,
            name: item.name,
            quantity: 0,
            revenue: 0,
            price: item.price || 0,
          };
        }
        entry.itemCounts[itemKey].quantity += (item.quantity || 1);
        entry.itemCounts[itemKey].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });

    return map;
  }, [validOrders]);

  // Array of all daily records sorted by date descending
  const sortedDailyList = useMemo<DailySalesRecord[]>(() => {
    return Object.values(dailyAggregates).sort((a: DailySalesRecord, b: DailySalesRecord) => 
      b.dateKey.localeCompare(a.dateKey)
    );
  }, [dailyAggregates]);

  // Filtered days according to period filter
  const filteredDailyList = useMemo<DailySalesRecord[]>(() => {
    return sortedDailyList.filter(day => {
      if (periodFilter === 'all') return true;
      if (periodFilter === 'today') return day.dateKey === todayKey;
      if (periodFilter === 'yesterday') return day.dateKey === yesterdayKey;
      
      const nowTime = new Date().getTime();
      const dayTime = day.dateObj.getTime();
      const diffDays = (nowTime - dayTime) / (1000 * 60 * 60 * 24);

      if (periodFilter === '7days') return diffDays <= 7;
      if (periodFilter === '14days') return diffDays <= 14;
      if (periodFilter === '30days') return diffDays <= 30;
      if (periodFilter === 'this_month') {
        const now = new Date();
        return day.dateObj.getMonth() === now.getMonth() && day.dateObj.getFullYear() === now.getFullYear();
      }
      if (periodFilter === 'custom') {
        return day.dateKey >= customStartDate && day.dateKey <= customEndDate;
      }
      return true;
    });
  }, [sortedDailyList, periodFilter, todayKey, yesterdayKey, customStartDate, customEndDate]);

  // Filtered day-by-day table search
  const searchedDailyList = useMemo<DailySalesRecord[]>(() => {
    if (!tableSearchQuery.trim()) return filteredDailyList;
    const q = tableSearchQuery.toLowerCase();
    return filteredDailyList.filter(day => {
      const formatted = day.dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).toLowerCase();
      return day.dateKey.includes(q) || formatted.includes(q);
    });
  }, [filteredDailyList, tableSearchQuery]);

  // Overall Global Calculations across Filtered Period
  const overallMetrics = useMemo(() => {
    let totalGross = 0;
    let totalSettled = 0;
    let totalPending = 0;
    let totalPaidOrders = 0;
    let totalAllOrders = 0;
    let totalItems = 0;
    let totalTax = 0;
    let totalDiscounts = 0;

    filteredDailyList.forEach(day => {
      totalGross += day.grossSales;
      totalSettled += day.settledRevenue;
      totalPending += day.pendingAmount;
      totalPaidOrders += day.paidCount;
      totalAllOrders += day.totalOrdersCount;
      totalItems += day.totalItemsSold;
      totalTax += day.taxCollected;
      totalDiscounts += day.discountsGiven;
    });

    const activeDaysCount = filteredDailyList.length || 1;
    const avgDailySale = totalGross / activeDaysCount;
    const aov = totalPaidOrders > 0 ? totalSettled / totalPaidOrders : 0;

    // Today vs Yesterday Comparisons
    const todayData = dailyAggregates[todayKey] || { grossSales: 0, settledRevenue: 0, paidCount: 0, totalOrdersCount: 0, totalItemsSold: 0, pendingCount: 0 };
    const yesterdayData = dailyAggregates[yesterdayKey] || { grossSales: 0, settledRevenue: 0, paidCount: 0, totalOrdersCount: 0, totalItemsSold: 0, pendingCount: 0 };

    let todayGrowthPercent = 0;
    if (yesterdayData.grossSales > 0) {
      todayGrowthPercent = ((todayData.grossSales - yesterdayData.grossSales) / yesterdayData.grossSales) * 100;
    } else if (todayData.grossSales > 0) {
      todayGrowthPercent = 100;
    }

    // Find highest sales day
    let highestDay: DailySalesRecord | null = sortedDailyList[0] || null;
    sortedDailyList.forEach(d => {
      if (!highestDay || d.grossSales > highestDay.grossSales) {
        highestDay = d;
      }
    });

    return {
      totalGross,
      totalSettled,
      totalPending,
      totalPaidOrders,
      totalAllOrders,
      totalItems,
      totalTax,
      totalDiscounts,
      avgDailySale,
      aov,
      todayGross: todayData.grossSales,
      todaySettled: todayData.settledRevenue,
      todayOrders: todayData.totalOrdersCount,
      todayPaidCount: todayData.paidCount,
      todayPendingCount: todayData.pendingCount,
      todayItems: todayData.totalItemsSold,
      yesterdayGross: yesterdayData.grossSales,
      yesterdayOrders: yesterdayData.totalOrdersCount,
      todayGrowthPercent,
      highestDay,
      activeDaysCount,
    };
  }, [filteredDailyList, dailyAggregates, todayKey, yesterdayKey, sortedDailyList]);

  // Selected Day Data for the Day Sale Amount Spotlight
  const spotlightDayData = useMemo<DailySalesRecord>(() => {
    if (dailyAggregates[selectedSpotlightDate]) {
      return dailyAggregates[selectedSpotlightDate];
    }
    // Return empty fallback placeholder structure for days with no orders
    const dateObj = new Date(selectedSpotlightDate);
    return {
      dateKey: selectedSpotlightDate,
      dateObj: isNaN(dateObj.getTime()) ? new Date() : dateObj,
      orders: [],
      grossSales: 0,
      settledRevenue: 0,
      pendingAmount: 0,
      paidCount: 0,
      pendingCount: 0,
      totalOrdersCount: 0,
      totalItemsSold: 0,
      taxCollected: 0,
      discountsGiven: 0,
      serviceCharge: 0,
      tipsCollected: 0,
      paymentMethods: {
        cash: { count: 0, total: 0 },
        credit_card: { count: 0, total: 0 },
        debit_card: { count: 0, total: 0 },
        upi_qr: { count: 0, total: 0 },
        bank_transfer: { count: 0, total: 0 },
        house_account: { count: 0, total: 0 },
        split: { count: 0, total: 0 },
      },
      orderTypes: {
        'dine-in': { count: 0, total: 0 },
        'takeout': { count: 0, total: 0 },
        'delivery': { count: 0, total: 0 },
        'catering': { count: 0, total: 0 },
      },
      hourlyBuckets: {
        morning: { count: 0, total: 0, label: 'Morning (6am-12pm)' },
        lunch: { count: 0, total: 0, label: 'Lunch Rush (12pm-4pm)' },
        evening: { count: 0, total: 0, label: 'Evening (4pm-7pm)' },
        dinner: { count: 0, total: 0, label: 'Dinner Peak (7pm-10pm)' },
        lateNight: { count: 0, total: 0, label: 'Late Night (10pm+)' },
      },
      itemCounts: {},
    };
  }, [dailyAggregates, selectedSpotlightDate]);

  // Ranked items for the spotlight day
  const spotlightTopItems = useMemo<ItemCountRecord[]>(() => {
    return (Object.values(spotlightDayData.itemCounts) as ItemCountRecord[]).sort(
      (a, b) => b.quantity - a.quantity || b.revenue - a.revenue
    );
  }, [spotlightDayData]);

  // Chronological 14-day history for the trend chart
  const trendChartDays = useMemo(() => {
    // Generate last 14 days in chronological order
    const list: DailySalesRecord[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getLocalDateKey(d);
      const data = dailyAggregates[key] || {
        dateKey: key,
        dateObj: d,
        orders: [],
        grossSales: 0,
        settledRevenue: 0,
        pendingAmount: 0,
        paidCount: 0,
        pendingCount: 0,
        totalOrdersCount: 0,
        totalItemsSold: 0,
        taxCollected: 0,
        discountsGiven: 0,
        serviceCharge: 0,
        tipsCollected: 0,
        paymentMethods: {},
        orderTypes: {},
        hourlyBuckets: {
          morning: { count: 0, total: 0, label: 'Morning (6am-12pm)' },
          lunch: { count: 0, total: 0, label: 'Lunch Rush (12pm-4pm)' },
          evening: { count: 0, total: 0, label: 'Evening (4pm-7pm)' },
          dinner: { count: 0, total: 0, label: 'Dinner Peak (7pm-10pm)' },
          lateNight: { count: 0, total: 0, label: 'Late Night (10pm+)' },
        },
        itemCounts: {},
      };
      list.push(data);
    }
    return list;
  }, [dailyAggregates]);

  const maxChartSales = useMemo(() => {
    const maxVal = Math.max(...trendChartDays.map(d => d.grossSales), 1000);
    return maxVal * 1.15; // with 15% headroom
  }, [trendChartDays]);

  // Export Daily Sales Breakdown to CSV
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Day of Week',
      'Day Sale Amount (Gross)',
      'Net Settled Revenue',
      'Pending / Open Amount',
      'Total Orders',
      'Paid Orders',
      'Open Orders',
      'Items Sold',
      'Tax Collected',
      'Discounts Given',
      'Avg Ticket (AOV)'
    ];

    const rows = sortedDailyList.map(day => {
      const dayName = day.dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const aov = day.paidCount > 0 ? (day.settledRevenue / day.paidCount).toFixed(2) : '0.00';
      return [
        day.dateKey,
        dayName,
        day.grossSales.toFixed(2),
        day.settledRevenue.toFixed(2),
        day.pendingAmount.toFixed(2),
        day.totalOrdersCount,
        day.paidCount,
        day.pendingCount,
        day.totalItemsSold,
        day.taxCollected.toFixed(2),
        day.discountsGiven.toFixed(2),
        aov
      ];
    });

    const csvContent = [
      `"Restaurant: ${profile.name.replace(/"/g, '""')}"`,
      `"Exported At: ${new Date().toLocaleString()}"`,
      `"Report: Every Day Sale Data & Daily Revenue Summary"`,
      '',
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daily_Sales_Report_${profile.name.replace(/\s+/g, '_')}_${todayKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Navigate Spotlight date by +1 or -1 day
  const handleStepSpotlightDate = (days: number) => {
    const cur = new Date(selectedSpotlightDate);
    cur.setDate(cur.getDate() + days);
    setSelectedSpotlightDate(getLocalDateKey(cur));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* =========================================================================
          HERO BANNER & PERIOD CONTROLS
         ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-md shrink-0">
            <BarChart3 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Sales Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Live Sales Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Every day sale data, day sale amount tracking, total revenue aggregates, and payment breakdown.
            </p>
          </div>
        </div>

        {/* Period Filter Buttons & Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Quick Date Presets */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'All Days' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: 'Last 7D' },
              { id: '30days', label: 'Last 30D' },
              { id: 'this_month', label: 'This Month' },
              { id: 'custom', label: 'Custom' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodFilter(p.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  periodFilter === p.id 
                    ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs if 'custom' selected */}
          {periodFilter === 'custom' && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-lg text-xs font-mono font-semibold outline-none"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-lg text-xs font-mono font-semibold outline-none"
              />
            </div>
          )}

          {/* Quick Export Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportCSV}
              title="Download Daily Sales CSV Spreadsheet"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              title="Print Daily Sales Summary / Z-Report"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Print Report</span>
            </button>
          </div>

        </div>

      </div>

      {/* =========================================================================
          PRIMARY SALES METRIC CARDS (TOTAL AMOUNT & DAY SALE AMOUNT)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: TOTAL SALES AMOUNT */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-amber-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-500" />
              Total Sales Amount
            </span>
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatCurrency(overallMetrics.totalGross, profile.currencySymbol)}
            </div>
            
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <span>{overallMetrics.totalPaidOrders} Paid Tickets</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(overallMetrics.totalSettled, profile.currencySymbol)} Net
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: DAY SALE AMOUNT (TODAY'S SALE) */}
        <div 
          onClick={() => setSelectedSpotlightDate(todayKey)}
          className={`bg-white dark:bg-slate-900 p-5 rounded-3xl border shadow-xs flex flex-col justify-between relative overflow-hidden cursor-pointer transition-all ${
            selectedSpotlightDate === todayKey 
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md' 
              : 'border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-emerald-500" />
                Today's Sale Amount
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
              overallMetrics.todayGrowthPercent >= 0 
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
            }`}>
              {overallMetrics.todayGrowthPercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(overallMetrics.todayGrowthPercent).toFixed(1)}% vs yest
            </span>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-amber-400 font-mono tracking-tight">
              {formatCurrency(overallMetrics.todayGross, profile.currencySymbol)}
            </div>
            
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <span>{overallMetrics.todayOrders} Orders Today</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {overallMetrics.todayItems} dishes prepared
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: YESTERDAY'S SALE AMOUNT */}
        <div 
          onClick={() => setSelectedSpotlightDate(yesterdayKey)}
          className={`bg-white dark:bg-slate-900 p-5 rounded-3xl border shadow-xs flex flex-col justify-between relative overflow-hidden cursor-pointer transition-all ${
            selectedSpotlightDate === yesterdayKey 
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md' 
              : 'border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              Yesterday's Sale
            </span>
            <span className="p-2 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Receipt className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatCurrency(overallMetrics.yesterdayGross, profile.currencySymbol)}
            </div>
            
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <span>{overallMetrics.yesterdayOrders} Orders Settled</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                Click to inspect
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: AVERAGE DAILY SALE & AVERAGE TICKET */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Avg Daily Run-Rate
            </span>
            <span className="p-2 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Utensils className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatCurrency(overallMetrics.avgDailySale, profile.currencySymbol)}
            </div>
            
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <span>Avg Ticket (AOV):</span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(overallMetrics.aov, profile.currencySymbol)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          DAY-BY-DAY VISUAL SALES TREND CHART (PAST 14 DAYS)
         ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              Daily Sales Trend (Day-by-Day Performance)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click on any daily bar to spotlight that day's granular sales audit and invoices below.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-3 h-3 rounded-md bg-amber-400" />
              <span>Day Sale Amount</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-3 h-0.5 bg-purple-500 border border-purple-500 border-dashed" />
              <span>Daily Avg ({formatCurrency(overallMetrics.avgDailySale, profile.currencySymbol)})</span>
            </div>
          </div>
        </div>

        {/* Custom Responsive SVG / Bar Visualization */}
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 items-end min-h-[180px] sm:min-h-[220px]">
            {trendChartDays.map((day) => {
              const heightPercent = maxChartSales > 0 ? (day.grossSales / maxChartSales) * 100 : 0;
              const isSelected = selectedSpotlightDate === day.dateKey;
              const isToday = day.dateKey === todayKey;
              const dayLabel = day.dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              const dateNumber = day.dateObj.getDate();

              return (
                <div 
                  key={day.dateKey}
                  onClick={() => setSelectedSpotlightDate(day.dateKey)}
                  className="flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                  title={`${day.dateKey} (${dayLabel}): ${formatCurrency(day.grossSales, profile.currencySymbol)} across ${day.totalOrdersCount} orders`}
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 pointer-events-none text-center truncate max-w-full">
                    {day.grossSales > 0 ? formatCurrency(day.grossSales, profile.currencySymbol) : '₹0'}
                  </div>

                  {/* The Bar */}
                  <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-xl p-1 flex flex-col justify-end h-36 sm:h-44 transition-all">
                    <div
                      style={{ height: `${Math.max(heightPercent, 6)}%` }}
                      className={`w-full rounded-lg transition-all duration-300 relative ${
                        isSelected
                          ? 'bg-gradient-to-t from-amber-500 to-amber-300 shadow-md'
                          : isToday
                          ? 'bg-emerald-500/80 group-hover:bg-emerald-400'
                          : day.grossSales > 0
                          ? 'bg-amber-500/70 group-hover:bg-amber-400'
                          : 'bg-slate-300 dark:bg-slate-700/50'
                      }`}
                    >
                      {day.totalOrdersCount > 0 && (
                        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-950 hidden sm:inline">
                          {day.totalOrdersCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Day Date Label */}
                  <div className={`text-center transition-colors ${
                    isSelected 
                      ? 'text-amber-600 dark:text-amber-400 font-black' 
                      : isToday 
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    <span className="text-[11px] font-bold block">{dayLabel}</span>
                    <span className="text-[10px] font-mono opacity-80 block">{dateNumber}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* =========================================================================
          SELECTED "DAY SALE AMOUNT" SPOTLIGHT & DRILLDOWN
         ========================================================================= */}
      <div className="bg-slate-900 text-white p-5 sm:p-7 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        
        {/* Spotlight Top Bar: Date Selector & Stepper */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Day Sale Spotlight: {spotlightDayData.dateObj.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                {selectedSpotlightDate === todayKey && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Live Today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Detailed transaction log, hourly velocity, top dishes, and settlement breakdown for this date.
              </p>
            </div>
          </div>

          {/* Quick Date Stepper & Picker */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStepSpotlightDate(-1)}
              title="Previous Day"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedSpotlightDate}
              onChange={(e) => setSelectedSpotlightDate(e.target.value)}
              className="bg-slate-800 text-amber-400 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
            />

            <button
              type="button"
              onClick={() => handleStepSpotlightDate(1)}
              title="Next Day"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {selectedSpotlightDate !== todayKey && (
              <button
                type="button"
                onClick={() => setSelectedSpotlightDate(todayKey)}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Jump to Today
              </button>
            )}
          </div>

        </div>

        {/* 4 Spotlight Summary Banner Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-5">
          
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Day Sale Amount</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1">
              {formatCurrency(spotlightDayData.grossSales, profile.currencySymbol)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {spotlightDayData.totalOrdersCount} total tickets generated
            </span>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Settled Net Revenue</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
              {formatCurrency(spotlightDayData.settledRevenue, profile.currencySymbol)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {spotlightDayData.paidCount} paid • {spotlightDayData.pendingCount} open bills
            </span>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Dishes / Items Sold</span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
              {spotlightDayData.totalItemsSold}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Across {Object.keys(spotlightDayData.itemCounts).length} menu items
            </span>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Average Ticket (AOV)</span>
            <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono mt-1">
              {formatCurrency(
                spotlightDayData.paidCount > 0 ? spotlightDayData.settledRevenue / spotlightDayData.paidCount : 0,
                profile.currencySymbol
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Tax Collected: {formatCurrency(spotlightDayData.taxCollected, profile.currencySymbol)}
            </span>
          </div>

        </div>

        {/* Spotlight Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-4 overflow-x-auto">
          {[
            { id: 'timeline', label: 'Time-of-Day Hourly Velocity', icon: Clock },
            { id: 'payments', label: 'Payment Methods Breakdown', icon: CreditCard },
            { id: 'dishes', label: `Top Dishes Sold (${spotlightTopItems.length})`, icon: Award },
            { id: 'orders', label: `Invoices & Tickets (${spotlightDayData.orders.length})`, icon: Receipt },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = spotlightTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSpotlightTab(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Hourly Distribution */}
        {spotlightTab === 'timeline' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(Object.entries(spotlightDayData.hourlyBuckets) as [string, HourlyBucketRecord][]).map(([key, bucket]) => {
              const percent = spotlightDayData.grossSales > 0 ? (bucket.total / spotlightDayData.grossSales) * 100 : 0;
              return (
                <div key={key} className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {bucket.label}
                    </span>
                    <div className="text-lg font-black text-amber-400 font-mono mt-1">
                      {formatCurrency(bucket.total, profile.currencySymbol)}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>{bucket.count} orders</span>
                      <span>{percent.toFixed(0)}% of day</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-amber-400 h-1.5 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Payment Methods */}
        {spotlightTab === 'payments' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {(Object.entries(spotlightDayData.paymentMethods) as [string, PaymentMethodRecord][]).map(([method, data]) => {
              if (data.count === 0 && method !== 'cash' && method !== 'credit_card' && method !== 'upi_qr') return null;
              
              const getMethodLabel = (m: string) => {
                switch (m) {
                  case 'cash': return 'Cash Drawer';
                  case 'credit_card': return 'Credit Card Terminal';
                  case 'debit_card': return 'Debit Card';
                  case 'upi_qr': return 'UPI / QR Code Scan';
                  case 'bank_transfer': return 'Bank Transfer / Wire';
                  case 'house_account': return 'House Account Tab';
                  default: return m;
                }
              };

              const percent = spotlightDayData.grossSales > 0 ? (data.total / spotlightDayData.grossSales) * 100 : 0;

              return (
                <div key={method} className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400">
                      {method === 'cash' ? <Banknote className="w-4 h-4" /> : method === 'upi_qr' ? <QrCode className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{getMethodLabel(method)}</h4>
                      <p className="text-[11px] text-slate-400">{data.count} transactions ({percent.toFixed(1)}%)</p>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-sm text-amber-300">
                    {formatCurrency(data.total, profile.currencySymbol)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Top Dishes for Selected Day */}
        {spotlightTab === 'dishes' && (
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4">
            {spotlightTopItems.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No dish transactions recorded for this date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-2 font-bold">Rank</th>
                      <th className="pb-2 font-bold">Menu Dish / Drink</th>
                      <th className="pb-2 font-bold text-center">Qty Sold</th>
                      <th className="pb-2 font-bold text-right">Price</th>
                      <th className="pb-2 font-bold text-right">Revenue</th>
                      <th className="pb-2 font-bold text-right">Day Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {spotlightTopItems.slice(0, 10).map((item, idx) => {
                      const share = spotlightDayData.grossSales > 0 ? (item.revenue / spotlightDayData.grossSales) * 100 : 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-900/60">
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-mono font-bold text-[11px]">
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="py-2.5 font-bold text-white">{item.name}</td>
                          <td className="py-2.5 text-center font-mono font-black text-amber-400">
                            {item.quantity}x
                          </td>
                          <td className="py-2.5 text-right font-mono text-slate-400">
                            {formatCurrency(item.price, profile.currencySymbol)}
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-white">
                            {formatCurrency(item.revenue, profile.currencySymbol)}
                          </td>
                          <td className="py-2.5 text-right font-mono text-slate-400">
                            {share.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Orders / Invoices List for Selected Day */}
        {spotlightTab === 'orders' && (
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4">
            {spotlightDayData.orders.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No orders recorded for this date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-2 font-bold">Invoice #</th>
                      <th className="pb-2 font-bold">Table / Customer</th>
                      <th className="pb-2 font-bold">Items</th>
                      <th className="pb-2 font-bold">Payment</th>
                      <th className="pb-2 font-bold text-right">Total Amount</th>
                      <th className="pb-2 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {spotlightDayData.orders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-2.5 font-mono font-black text-amber-400">
                          #{order.invoiceNumber}
                        </td>
                        <td className="py-2.5">
                          <span className="font-bold text-white block">
                            {order.tableNumber || order.orderType.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {order.customerName || 'Guest'}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-300">
                          {order.items?.length || 0} items
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {order.paymentStatus} • {order.paymentMethod || 'cash'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-white">
                          {formatCurrency(order.total, profile.currencySymbol)}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => onViewInvoice(order)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          >
                            View Bill
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* =========================================================================
          "EVERY DAY SALE DATA" (DAY-BY-DAY HISTORICAL SALES TABLE)
         ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Table Top Controls & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-500" />
              Every Day Sale Data (Day-by-Day Historical Log)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive list of all sales days, total day sale amount, order counts, items sold, and tax metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search date or day (e.g. Aug 21, Friday)..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-400 w-56 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Day-by-Day Sales Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Date & Day</th>
                <th className="py-3 px-4 font-bold">Day Sale Amount</th>
                <th className="py-3 px-4 font-bold">Settled vs Open</th>
                <th className="py-3 px-4 font-bold text-center">Items Sold</th>
                <th className="py-3 px-4 font-bold text-right">Avg Ticket</th>
                <th className="py-3 px-4 font-bold text-right">Tax & Discounts</th>
                <th className="py-3 px-4 font-bold">Primary Payment</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {searchedDailyList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No sales data found matching your selected filters.
                  </td>
                </tr>
              ) : (
                searchedDailyList.map(day => {
                  const isToday = day.dateKey === todayKey;
                  const isYesterday = day.dateKey === yesterdayKey;
                  const isSelected = selectedSpotlightDate === day.dateKey;
                  const isHighest = overallMetrics.highestDay?.dateKey === day.dateKey && day.grossSales > 0;
                  const aov = day.paidCount > 0 ? day.settledRevenue / day.paidCount : 0;

                  // Find top payment method for this day
                  let topMethod = 'cash';
                  let topCount = 0;
                  (Object.entries(day.paymentMethods) as [string, PaymentMethodRecord][]).forEach(([m, d]) => {
                    if (d.count > topCount) {
                      topCount = d.count;
                      topMethod = m;
                    }
                  });

                  return (
                    <tr 
                      key={day.dateKey}
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-amber-50/60 dark:bg-amber-500/10' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Date & Day Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-900 dark:text-white">
                                {day.dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              {isToday && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  Today
                                </span>
                              )}
                              {isYesterday && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-500/10 text-blue-700 dark:text-blue-300">
                                  Yesterday
                                </span>
                              )}
                              {isHighest && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-400 text-slate-950 shadow-2xs">
                                  🏆 Top Day
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              {day.dateKey}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Day Sale Amount */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-black text-sm text-slate-950 dark:text-amber-400">
                          {formatCurrency(day.grossSales, profile.currencySymbol)}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>Net: {formatCurrency(day.settledRevenue, profile.currencySymbol)}</span>
                        </div>
                      </td>

                      {/* Settled vs Open Orders */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            {day.paidCount} Paid
                          </span>
                          {day.pendingCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              {day.pendingCount} Open
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {day.totalOrdersCount} Total Tickets
                        </span>
                      </td>

                      {/* Items Prepared / Sold */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">
                          {day.totalItemsSold} items
                        </span>
                      </td>

                      {/* Average Ticket (AOV) */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(aov, profile.currencySymbol)}
                      </td>

                      {/* Tax & Discounts */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                          +{formatCurrency(day.taxCollected, profile.currencySymbol)} tax
                        </div>
                        {day.discountsGiven > 0 && (
                          <div className="font-mono text-[10px] text-rose-600 dark:text-rose-400">
                            -{formatCurrency(day.discountsGiven, profile.currencySymbol)} disc
                          </div>
                        )}
                      </td>

                      {/* Primary Payment Method */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                          {topMethod === 'cash' ? <Banknote className="w-3 h-3" /> : topMethod === 'upi_qr' ? <QrCode className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                          {topMethod.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSpotlightDate(day.dateKey);
                            // Scroll to spotlight
                            window.scrollTo({ top: 380, behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-slate-900 dark:bg-amber-400 hover:bg-amber-500 text-white dark:text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-xs"
                        >
                          Inspect Day
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer Totals */}
            {searchedDailyList.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800/80 font-black text-slate-950 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <td className="py-3 px-4">
                    TOTALS ({searchedDailyList.length} Active Trading Days)
                  </td>
                  <td className="py-3 px-4 font-mono text-sm text-amber-600 dark:text-amber-400">
                    {formatCurrency(overallMetrics.totalGross, profile.currencySymbol)}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {overallMetrics.totalPaidOrders} Paid / {overallMetrics.totalAllOrders - overallMetrics.totalPaidOrders} Open
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs">
                    {overallMetrics.totalItems} items
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs">
                    {formatCurrency(overallMetrics.aov, profile.currencySymbol)} AOV
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs">
                    +{formatCurrency(overallMetrics.totalTax, profile.currencySymbol)}
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-right text-[11px] text-slate-500">
                    Average: {formatCurrency(overallMetrics.avgDailySale, profile.currencySymbol)} / day
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </div>

    </div>
  );
};
