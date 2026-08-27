import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Download, 
  Calendar, 
  DollarSign, 
  Building2, 
  User, 
  Receipt,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { BillOrder, MenuItem, OrderItem, RestaurantProfile, StaffUser } from '../types';
import { formatCurrency, formatDate, generateId, generateNextInvoiceNumber } from '../utils/formatters';
import { isAdminOrOwner } from '../utils/permissions';
import { AdminAuthModal } from './AdminAuthModal';

interface InvoicesListProps {
  orders: BillOrder[];
  menuItems: MenuItem[];
  profile: RestaurantProfile;
  currentUser?: StaffUser | null;
  onViewInvoice: (order: BillOrder) => void;
  onSaveOrder: (order: BillOrder) => void;
  onDeleteOrder: (orderId: string) => void;
}

export const InvoicesList: React.FC<InvoicesListProps> = ({
  orders,
  menuItems,
  profile,
  currentUser,
  onViewInvoice,
  onSaveOrder,
  onDeleteOrder,
}) => {
  const isAdmin = isAdminOrOwner(currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'partially_paid' | 'catering'>('all');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<BillOrder | null>(null);
  const [adminAuthForDelete, setAdminAuthForDelete] = useState<BillOrder | null>(null);

  // New Invoice Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientTaxId, setClientTaxId] = useState('');
  const [orderType, setOrderType] = useState<'catering' | 'dine-in' | 'takeout'>('catering');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]);
  const [invoiceItems, setInvoiceItems] = useState<{ menuItemId?: string; name: string; quantity: number; price: number }[]>([
    { name: 'Executive Catering Pasta Buffet Tray', quantity: 2, price: 5500.0 },
    { name: 'Artisan Woodfire Pizza Party Pack (6 Pizzas)', quantity: 2, price: 3600.0 },
  ]);
  const [invoiceNotes, setInvoiceNotes] = useState('Corporate catering luncheon service. Delivery and setup included.');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(true);
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(10);

  // Filtered Orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.customerEmail && order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'catering' ? order.orderType === 'catering' :
      order.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalBilled = orders.reduce((sum, o) => sum + o.total, 0);
  const totalCollected = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.total : (o.amountPaid || 0)), 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);
  const cateringCount = orders.filter(o => o.orderType === 'catering').length;

  // Handle Add Item Row in Modal
  const handleAddItem = () => {
    setInvoiceItems([...invoiceItems, { name: '', quantity: 1, price: 0 }]);
  };

  const handleSelectMenuItem = (index: number, menuItemId: string) => {
    const found = menuItems.find(m => m.id === menuItemId);
    if (!found) return;
    const updated = [...invoiceItems];
    updated[index] = {
      menuItemId: found.id,
      name: found.name,
      quantity: updated[index].quantity || 1,
      price: found.price,
    };
    setInvoiceItems(updated);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], [field]: value };
    setInvoiceItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Create & Save New Custom Invoice
  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || invoiceItems.length === 0) {
      alert("Please provide a client name and at least one line item.");
      return;
    }

    const subtotal = invoiceItems.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity || 1)), 0);
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxable = Math.max(0, subtotal - discountAmount);
    const taxRate = applyTax ? profile.defaultTaxRate : 0;
    const taxAmount = (taxable * taxRate) / 100;
    const serviceChargeAmount = (taxable * serviceChargePercent) / 100;
    const total = taxable + taxAmount + serviceChargeAmount;

    const orderItems: OrderItem[] = invoiceItems.map(it => ({
      id: generateId('item'),
      menuItemId: it.menuItemId || generateId('custom'),
      name: it.name || 'Custom Catering Item',
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
    }));

    const newOrder: BillOrder = {
      id: generateId('inv'),
      invoiceNumber: generateNextInvoiceNumber(orders, profile.invoicePrefix),
      orderType,
      customerName: clientName.trim(),
      customerEmail: clientEmail.trim() || undefined,
      customerPhone: clientPhone.trim() || undefined,
      customerAddress: clientAddress.trim() || undefined,
      customerTaxId: clientTaxId.trim() || undefined,
      items: orderItems,
      subtotal,
      discountType: 'percentage',
      discountValue: discountPercent,
      discountAmount,
      taxRate,
      taxAmount,
      serviceChargeRate: serviceChargePercent,
      serviceChargeAmount,
      tipAmount: 0,
      total,
      amountPaid: 0,
      paymentStatus: 'pending',
      paymentMethod: 'bank_transfer',
      notes: invoiceNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      dueDate,
      templateStyle: 'modern',
    };

    onSaveOrder(newOrder);
    setIsCreatingInvoice(false);
    onViewInvoice(newOrder);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Invoices & Corporate Accounts
            </h2>
            {!isAdmin && (
              <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-full text-[11px] font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Staff View-Only (Admin for Delete)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate and track professional catering invoices, event bookings & restaurant dining bills.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreatingInvoice(true)}
            className="px-4 py-2.5 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400 dark:text-slate-950" />
            <span>Create Corporate Invoice</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Billed</span>
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {formatCurrency(totalBilled, profile.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{orders.length} total invoices</span>
          </div>
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Collected Revenue</span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {formatCurrency(totalCollected, profile.currencySymbol)}
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Settled to bank/cash</span>
          </div>
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Receivables</span>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
              {formatCurrency(totalOutstanding, profile.currencySymbol)}
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">Awaiting client payment</span>
          </div>
          <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Catering & B2B Orders</span>
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {cateringCount}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">High-ticket events</span>
          </div>
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by client, invoice #, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'paid', label: 'Paid' },
            { id: 'pending', label: 'Pending Payment' },
            { id: 'partially_paid', label: 'Partially Paid' },
            { id: 'catering', label: 'Catering Events' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 dark:bg-slate-950 text-white font-semibold">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client / Recipient</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-amber-400">
                    {order.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {order.customerName || 'Walk-In Customer'}
                    </div>
                    {order.customerEmail && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{order.customerEmail}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 capitalize">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      order.orderType === 'catering' ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300' :
                      order.orderType === 'dine-in' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {order.orderType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {order.dueDate ? formatDate(order.dueDate) : 'Immediate'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {formatCurrency(order.total, profile.currencySymbol)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {order.paymentStatus === 'paid' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
                        Paid
                      </span>
                    ) : order.paymentStatus === 'partially_paid' ? (
                      <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold rounded-full border border-amber-200 dark:border-amber-800">
                        Partial
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-[11px] font-bold rounded-full border border-red-200 dark:border-red-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewInvoice(order)}
                        className="px-2.5 py-1 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View / Print
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isAdmin) {
                            setOrderToDelete(order);
                          } else {
                            setAdminAuthForDelete(order);
                          }
                        }}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          isAdmin 
                            ? 'text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40' 
                            : 'text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        }`}
                        title={isAdmin ? "Delete Invoice (Admin)" : "Delete Invoice (Requires Admin PIN)"}
                      >
                        {isAdmin ? <Trash2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No matching invoices found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Try changing your search terms or filter selection.</p>
          </div>
        )}
      </div>

      {/* Modal: Create Corporate / Catering Invoice */}
      {isCreatingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col text-slate-900 dark:text-white">
            
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Create Corporate / Catering Invoice</h3>
                <p className="text-xs text-slate-400">Draft an official tax invoice with payment terms & client details</p>
              </div>
              <button 
                onClick={() => setIsCreatingInvoice(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              
              {/* Client Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Client / Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Dynamics Corp or John Doe"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Client Tax ID / EIN / GSTIN</label>
                  <input
                    type="text"
                    placeholder="e.g. US-EIN-9481230"
                    value={clientTaxId}
                    onChange={(e) => setClientTaxId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="billing@company.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (415) 555-0199"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Billing / Delivery Address</label>
                  <input
                    type="text"
                    placeholder="Suite 400, 500 Market St, San Francisco, CA"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Invoice Terms & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Service Type</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none capitalize font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="catering">Catering & Banquet Event</option>
                    <option value="dine-in">Large Corporate Dine-In</option>
                    <option value="takeout">Wholesale Pickup / Takeout</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Line Items Grid */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Invoice Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {invoiceItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      
                      {/* Pick from Menu or custom */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleSelectMenuItem(idx, e.target.value);
                        }}
                        className="w-36 px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-[11px] text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="">Choose Menu Item...</option>
                        {menuItems.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({formatCurrency(m.price, profile.currencySymbol)})</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Description"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded text-xs focus:outline-none"
                      />

                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-14 px-2 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded text-xs text-center font-mono focus:outline-none"
                      />

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={item.price || ''}
                        onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded text-xs text-right font-mono font-bold focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adjustments & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gratuity / Service %</label>
                  <input
                    type="number"
                    min="0"
                    value={serviceChargePercent}
                    onChange={(e) => setServiceChargePercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="taxCheck"
                    checked={applyTax}
                    onChange={(e) => setApplyTax(e.target.checked)}
                    className="rounded text-slate-900 dark:text-amber-500"
                  />
                  <label htmlFor="taxCheck" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Apply Sales Tax ({profile.defaultTaxRate}%)
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Notes / Catering Terms</label>
                <textarea
                  rows={2}
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs">Estimated Grand Total:</span>
                  <div className="text-xl font-black font-mono text-amber-400">
                    {formatCurrency(
                      (() => {
                        const sub = invoiceItems.reduce((s, it) => s + (Number(it.price) * Number(it.quantity || 1)), 0);
                        const disc = (sub * discountPercent) / 100;
                        const tax = applyTax ? ((sub - disc) * profile.defaultTaxRate) / 100 : 0;
                        const svc = ((sub - disc) * serviceChargePercent) / 100;
                        return Math.max(0, sub - disc + tax + svc);
                      })(),
                      profile.currencySymbol
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingInvoice(false)}
                    className="px-4 py-2 text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-md cursor-pointer"
                  >
                    Save & Generate Invoice
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Invoice Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Invoice?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to permanently delete invoice <strong className="text-slate-900 dark:text-white">{orderToDelete.invoiceNumber}</strong> for {orderToDelete.customerName || 'Customer'}?
                </p>
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-left">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Total Amount:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(orderToDelete.total, profile.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mt-1">
                    <span>Payment Status:</span>
                    <span className="capitalize font-bold text-amber-700 dark:text-amber-400">{orderToDelete.paymentStatus}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteOrder(orderToDelete.id);
                    setOrderToDelete(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95"
                >
                  Yes, Delete Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Admin PIN Override Modal for Delete Invoice */}
      <AdminAuthModal
        isOpen={!!adminAuthForDelete}
        onClose={() => setAdminAuthForDelete(null)}
        onAuthorized={() => {
          if (adminAuthForDelete) {
            setOrderToDelete(adminAuthForDelete);
            setAdminAuthForDelete(null);
          }
        }}
        actionTitle="Admin Authorization: Delete Invoice"
        actionDescription="Cashier/Staff accounts cannot delete customer invoices. Please enter Admin Master PIN to authorize this deletion."
        adminPin={profile.adminPin}
      />
    </div>
  );
};
