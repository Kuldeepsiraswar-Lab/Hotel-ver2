import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Sparkles, 
  Search, 
  Filter, 
  TrendingDown, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Download, 
  Layers, 
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { Expense, ExpenseCategory, RestaurantProfile, StaffUser } from '../types';
import { formatCurrency, formatDate, generateId } from '../utils/formatters';
import { isAdminOrOwner } from '../utils/permissions';
import { AdminAuthModal } from './AdminAuthModal';

interface ExpenseTrackerProps {
  expenses: Expense[];
  profile: RestaurantProfile;
  currentUser?: StaffUser | null;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onOpenAIScanner: () => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Raw Ingredients & Produce',
  'Beverages & Bar',
  'Kitchen Equipment & Maintenance',
  'Staff Wages & Payroll',
  'Utilities & Rent',
  'Packaging & Disposables',
  'Marketing & Delivery',
  'Cleaning & Hygiene',
  'General Operations',
];

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
  expenses,
  profile,
  currentUser,
  onSaveExpense,
  onDeleteExpense,
  onOpenAIScanner,
}) => {
  const isAdmin = isAdminOrOwner(currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [adminAuthPrompt, setAdminAuthPrompt] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onSuccess: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onSuccess: () => {},
  });

  // Manual Expense Form State
  const [vendorName, setVendorName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Raw Ingredients & Produce');
  const [amount, setAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'scheduled'>('paid');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Filtered Expenses
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      exp.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.invoiceNumber && exp.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || exp.paymentStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate Metrics
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTaxPaid = expenses.reduce((sum, e) => sum + (e.taxAmount || 0), 0);
  const pendingPayables = expenses
    .filter(e => e.paymentStatus === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  const rawIngredientsTotal = expenses
    .filter(e => e.category === 'Raw Ingredients & Produce')
    .reduce((sum, e) => sum + e.amount, 0);

  // Category totals for visual breakdown
  const categoryTotals = CATEGORIES.map(cat => {
    const sum = expenses.filter(e => e.category === cat).reduce((acc, curr) => acc + curr.amount, 0);
    const percentage = totalExpenses > 0 ? (sum / totalExpenses) * 100 : 0;
    return { category: cat, total: sum, percentage };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  // Submit Manual Expense
  const handleSaveManualExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim() || amount <= 0) {
      alert("Please enter a valid vendor name and amount.");
      return;
    }

    const newExp: Expense = {
      id: generateId('exp'),
      invoiceNumber: invoiceNumber.trim() || undefined,
      vendorName: vendorName.trim(),
      category,
      amount: Number(amount),
      taxAmount: Number(taxAmount) || 0,
      paymentMethod,
      paymentStatus,
      date: expenseDate,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    };

    onSaveExpense(newExp);
    setIsAddingExpense(false);
    setVendorName('');
    setInvoiceNumber('');
    setAmount(0);
    setTaxAmount(0);
    setNotes('');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Date", "Vendor", "Invoice #", "Category", "Amount", "Tax", "Payment Method", "Status", "Notes"];
    const rows = filteredExpenses.map(e => [
      e.id,
      e.date,
      `"${e.vendorName.replace(/"/g, '""')}"`,
      `"${e.invoiceNumber || ''}"`,
      `"${e.category}"`,
      e.amount,
      e.taxAmount || 0,
      e.paymentMethod,
      e.paymentStatus,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restaurant-expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500 dark:text-red-400" />
              Restaurant Expense & COGS Tracker
            </h2>
            {!isAdmin && (
              <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-full text-[11px] font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Staff View-Only (Admin for Edits)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track produce wholesalers, meat & dairy vendors, utility bills, staff payroll, and kitchen equipment costs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (isAdmin) {
                onOpenAIScanner();
              } else {
                setAdminAuthPrompt({
                  isOpen: true,
                  title: 'Admin Authorization: Scan & Log Expense',
                  description: 'Only Admin and Owner accounts can add or edit expenses. Please enter the Admin PIN (8888).',
                  onSuccess: () => onOpenAIScanner(),
                });
              }
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Scan Receipt with AI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isAdmin) {
                setIsAddingExpense(true);
              } else {
                setAdminAuthPrompt({
                  isOpen: true,
                  title: 'Admin Authorization: Add Expense',
                  description: 'Only Admin and Owner accounts can add or record expenses. Please enter the Admin PIN (8888).',
                  onSuccess: () => setIsAddingExpense(true),
                });
              }
            }}
            className="px-4 py-2.5 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400 dark:text-slate-950" />
            <span>Log Expense</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download CSV for Accountant"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Spent</span>
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {formatCurrency(totalExpenses, profile.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{expenses.length} vendor invoices</span>
          </div>
          <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Food & Produce COGS</span>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
              {formatCurrency(rawIngredientsTotal, profile.currencySymbol)}
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
              {totalExpenses > 0 ? `${((rawIngredientsTotal / totalExpenses) * 100).toFixed(1)}% of total cost` : '0%'}
            </span>
          </div>
          <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Payables</span>
            <div className="text-lg font-black text-red-600 dark:text-red-400 font-mono mt-0.5">
              {formatCurrency(pendingPayables, profile.currencySymbol)}
            </div>
            <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">Due to food vendors</span>
          </div>
          <div className="p-2.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tax Deductions Paid</span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {formatCurrency(totalTaxPaid, profile.currencySymbol)}
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Claimable input credits</span>
          </div>
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category Breakdown Bars */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Expense Distribution by Category
        </h3>
        <div className="space-y-2.5">
          {categoryTotals.map(item => (
            <div key={item.category} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-800" />
                  {item.category}
                </span>
                <div className="font-mono">
                  <span className="font-bold text-slate-900">{formatCurrency(item.total, profile.currencySymbol)}</span>
                  <span className="text-slate-400 ml-2">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-slate-900 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Category Filter Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vendor, invoice #, memo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Expense Records Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Vendor / Supplier</th>
                <th className="py-3 px-4">Bill / Invoice #</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Tax Paid</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-slate-600 font-mono">
                    {formatDate(exp.date)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{exp.vendorName}</div>
                    {exp.notes && (
                      <div className="text-[11px] text-slate-500 italic line-clamp-1">{exp.notes}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {exp.invoiceNumber || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {exp.paymentMethod}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                    {exp.taxAmount ? formatCurrency(exp.taxAmount, profile.currencySymbol) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(exp.amount, profile.currencySymbol)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {exp.paymentStatus === 'paid' ? (
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
                        Paid
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-red-100 text-red-800 font-bold rounded-full text-[11px]">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (isAdmin) {
                          setExpenseToDelete(exp);
                        } else {
                          setAdminAuthPrompt({
                            isOpen: true,
                            title: 'Admin Authorization: Delete Expense',
                            description: 'Staff and cashiers cannot delete expense records. Please enter Admin Master PIN to authorize.',
                            onSuccess: () => setExpenseToDelete(exp),
                          });
                        }
                      }}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        isAdmin 
                          ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' 
                          : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                      }`}
                      title={isAdmin ? "Delete Record (Admin)" : "Delete Record (Requires Admin PIN)"}
                    >
                      {isAdmin ? <Trash2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExpenses.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <TrendingDown className="w-10 h-10 mx-auto mb-2 stroke-1 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No expense records found</p>
            <p className="text-xs text-slate-400">Try adjusting your category filter or click "Scan Receipt with AI".</p>
          </div>
        )}
      </div>

      {/* Manual Expense Modal */}
      {isAddingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Record Restaurant Expense</h3>
                <p className="text-xs text-slate-400">Log vendor bills, utility receipts, or ingredient purchases</p>
              </div>
              <button 
                onClick={() => setIsAddingExpense(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualExpense} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Vendor / Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sysco, Local Farms, PG&E"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Invoice / Bill #</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-90412"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Amount ({profile.currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-amber-400 font-bold font-mono text-sm rounded-lg focus:outline-none text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tax Amount ({profile.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxAmount || ''}
                    onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-slate-300 font-mono rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer (ACH)</option>
                    <option value="Cash">Cash</option>
                    <option value="Auto-Debit">Auto-Debit</option>
                    <option value="Company Cheque">Company Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Memo</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ingredients list, invoice details, or vendor notes..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md"
                >
                  Save Expense Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">Delete Expense Record?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete the expense entry from <strong className="text-slate-900">{expenseToDelete.vendorName}</strong>?
                </p>
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-left">
                  <div className="flex justify-between text-slate-600">
                    <span>Category:</span>
                    <span className="font-bold text-slate-900">{expenseToDelete.category}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 mt-1">
                    <span>Total Expense:</span>
                    <span className="font-bold text-red-700">{formatCurrency(expenseToDelete.totalAmount, profile.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 mt-1">
                    <span>Date:</span>
                    <span className="text-slate-700">{expenseToDelete.date}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExpenseToDelete(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteExpense(expenseToDelete.id);
                    setExpenseToDelete(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95"
                >
                  Yes, Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Admin PIN Override Modal */}
      <AdminAuthModal
        isOpen={adminAuthPrompt.isOpen}
        onClose={() => setAdminAuthPrompt(prev => ({ ...prev, isOpen: false }))}
        onAuthorized={() => {
          const fn = adminAuthPrompt.onSuccess;
          setAdminAuthPrompt(prev => ({ ...prev, isOpen: false }));
          if (fn) fn();
        }}
        actionTitle={adminAuthPrompt.title}
        actionDescription={adminAuthPrompt.description}
        adminPin={profile.adminPin}
      />
    </div>
  );
};
