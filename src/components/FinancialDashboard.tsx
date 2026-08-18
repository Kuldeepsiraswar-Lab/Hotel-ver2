import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ChefHat
} from 'lucide-react';
import { BillOrder, Expense, MenuItem, RestaurantProfile } from '../types';
import { formatCurrency } from '../utils/formatters';

interface FinancialDashboardProps {
  orders: BillOrder[];
  expenses: Expense[];
  menuItems: MenuItem[];
  profile: RestaurantProfile;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  orders,
  expenses,
  menuItems,
  profile,
}) => {
  const [period, setPeriod] = useState<'all' | '30days' | '7days' | 'today'>('all');

  // Filter Data by Date Period
  const now = Date.now();
  const filterByDate = (dateStr: string) => {
    if (period === 'all') return true;
    const itemDate = new Date(dateStr).getTime();
    if (isNaN(itemDate)) return true;

    if (period === 'today') {
      return (now - itemDate) <= 86400000;
    }
    if (period === '7days') {
      return (now - itemDate) <= 86400000 * 7;
    }
    if (period === '30days') {
      return (now - itemDate) <= 86400000 * 30;
    }
    return true;
  };

  const filteredOrders = orders.filter(o => filterByDate(o.createdAt));
  const filteredExpenses = expenses.filter(e => filterByDate(e.date));

  // Financial Calculations
  const grossRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOperatingExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossRevenue - totalOperatingExpenses;
  const netMarginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  // Food & Beverage COGS
  const foodProduceCost = filteredExpenses
    .filter(e => e.category === 'Raw Ingredients & Produce')
    .reduce((sum, e) => sum + e.amount, 0);

  const beverageCost = filteredExpenses
    .filter(e => e.category === 'Beverages & Bar')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalFoodCost = foodProduceCost + beverageCost;
  const foodCostRatio = grossRevenue > 0 ? (totalFoodCost / grossRevenue) * 100 : 0;

  // Order Type Breakdown
  const dineInRevenue = filteredOrders.filter(o => o.orderType === 'dine-in').reduce((s, o) => s + o.total, 0);
  const cateringRevenue = filteredOrders.filter(o => o.orderType === 'catering').reduce((s, o) => s + o.total, 0);
  const takeoutRevenue = filteredOrders.filter(o => o.orderType === 'takeout' || o.orderType === 'delivery').reduce((s, o) => s + o.total, 0);

  // Top Selling Dishes by Order frequency
  const itemCounts: { [name: string]: { qty: number; revenue: number } } = {};
  filteredOrders.forEach(order => {
    order.items.forEach(it => {
      if (!itemCounts[it.name]) {
        itemCounts[it.name] = { qty: 0, revenue: 0 };
      }
      itemCounts[it.name].qty += it.quantity;
      itemCounts[it.name].revenue += it.price * it.quantity;
    });
  });

  const topDishes = Object.entries(itemCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Period Filter */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Profit & Loss (P&L) Financial Health
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time revenue, expense metrics, Food Cost % benchmarks, and channel performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All Time' },
              { id: '30days', label: 'Last 30 Days' },
              { id: '7days', label: 'Last 7 Days' },
              { id: 'today', label: 'Today' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === p.id 
                    ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 4 Primary P&L Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gross Revenue</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(grossRevenue, profile.currencySymbol)}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              {filteredOrders.length} orders settled
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(totalOperatingExpenses, profile.currencySymbol)}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              {filteredExpenses.length} vendor & overhead bills
            </span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Operating Profit</span>
            <div className={`p-2 rounded-xl ${netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(netProfit, profile.currencySymbol)}
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 block">
              Net Profit Margin: <strong>{netMarginPercent.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* Food Cost % (Benchmark) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Food Cost %</span>
            <div className={`p-2 rounded-xl ${foodCostRatio <= 35 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'}`}>
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {foodCostRatio.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                foodCostRatio <= 32 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' :
                foodCostRatio <= 36 ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' :
                'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
              }`}>
                {foodCostRatio <= 35 ? '● Healthy (Target: 28-35%)' : '● Above Industry Target'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Analytics: Revenue Streams & Top Selling Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Streams by Order Type */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Revenue Streams by Order Type
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Total: {formatCurrency(grossRevenue, profile.currencySymbol)}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Dine-In Table Orders</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(dineInRevenue, profile.currencySymbol)} ({grossRevenue > 0 ? ((dineInRevenue / grossRevenue) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-amber-500 h-2.5 rounded-full" 
                  style={{ width: `${grossRevenue > 0 ? (dineInRevenue / grossRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Corporate & Event Catering Invoices</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(cateringRevenue, profile.currencySymbol)} ({grossRevenue > 0 ? ((cateringRevenue / grossRevenue) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full" 
                  style={{ width: `${grossRevenue > 0 ? (cateringRevenue / grossRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Takeout & Delivery Orders</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(takeoutRevenue, profile.currencySymbol)} ({grossRevenue > 0 ? ((takeoutRevenue / grossRevenue) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-600 dark:bg-emerald-500 h-2.5 rounded-full" 
                  style={{ width: `${grossRevenue > 0 ? (takeoutRevenue / grossRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Best Selling Dishes by Revenue */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Top Menu Items by Sales Volume
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {topDishes.map((dish, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{dish.name}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">{dish.qty} servings ordered</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-amber-400 text-sm">
                  {formatCurrency(dish.revenue, profile.currencySymbol)}
                </span>
              </div>
            ))}

            {topDishes.length === 0 && (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No orders recorded in this time period yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
