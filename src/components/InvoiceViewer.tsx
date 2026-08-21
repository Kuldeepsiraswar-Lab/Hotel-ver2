import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  Download, 
  Share2, 
  X, 
  Receipt, 
  FileText, 
  CheckCircle, 
  CheckCircle2,
  CreditCard,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  ChefHat,
  Flame,
  Bell,
  Utensils,
  ChevronRight,
  Sparkles,
  RotateCcw,
  ClipboardList,
  Check,
  Timer,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BillOrder, RestaurantProfile, KitchenStatus, PaymentStatus } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { QRCodeDisplay } from './QRCodeDisplay';

interface InvoiceViewerProps {
  order: BillOrder | null;
  profile: RestaurantProfile;
  onClose: () => void;
  onUpdateOrder?: (updated: BillOrder) => void;
  onUpdatePaymentStatus?: (orderId: string, status: PaymentStatus) => void;
}

interface OrderStageConfig {
  key: 'pending' | 'preparing' | 'ready' | 'served';
  label: string;
  sublabel: string;
  description: string;
  icon: React.ElementType;
}

const ORDER_STAGES: OrderStageConfig[] = [
  {
    key: 'pending',
    label: 'Received',
    sublabel: 'Order Placed',
    description: 'Ticket logged in queue',
    icon: ClipboardList,
  },
  {
    key: 'preparing',
    label: 'Preparing',
    sublabel: 'In Kitchen',
    description: 'Chef actively cooking',
    icon: Flame,
  },
  {
    key: 'ready',
    label: 'Ready',
    sublabel: 'Plated & Ready',
    description: 'Food ready for pickup/serving',
    icon: Bell,
  },
  {
    key: 'served',
    label: 'Served',
    sublabel: 'Delivered',
    description: 'Guest served & finalized',
    icon: Utensils,
  },
];

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({
  order,
  profile,
  onClose,
  onUpdateOrder,
  onUpdatePaymentStatus,
}) => {
  const [viewMode, setViewMode] = useState<'invoice' | 'receipt'>(
    order?.orderType === 'catering' ? 'invoice' : 'invoice'
  );
  const [template, setTemplate] = useState<'modern' | 'bistro' | 'minimal' | 'gastropub'>(
    (order?.templateStyle as any) || 'modern'
  );
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [localOrder, setLocalOrder] = useState<BillOrder | null>(order);

  // Keep local copy synced with prop
  React.useEffect(() => {
    setLocalOrder(order);
  }, [order]);

  if (!localOrder) return null;

  const currentOrder = localOrder;

  const getEffectiveStatus = (ord: BillOrder): 'pending' | 'preparing' | 'ready' | 'served' => {
    if (ord.kitchenStatus === 'served' || ord.kitchenStatus === 'completed') return 'served';
    if (ord.kitchenStatus === 'ready') return 'ready';
    if (ord.kitchenStatus === 'preparing') return 'preparing';
    return 'pending';
  };

  const currentStatus = getEffectiveStatus(currentOrder);

  const getStageIndex = (statusKey: 'pending' | 'preparing' | 'ready' | 'served'): number => {
    return ORDER_STAGES.findIndex(s => s.key === statusKey);
  };

  const currentStageIndex = getStageIndex(currentStatus);

  const handleUpdateStatus = (targetStatus: 'pending' | 'preparing' | 'ready' | 'served') => {
    const now = new Date().toISOString();
    const updated: BillOrder = {
      ...currentOrder,
      kitchenStatus: targetStatus,
      isKitchenHold: false,
    };

    if (targetStatus === 'pending') {
      updated.kitchenStartedAt = undefined;
      updated.kitchenReadyAt = undefined;
      updated.kitchenCompletedAt = undefined;
    } else if (targetStatus === 'preparing') {
      if (!updated.kitchenStartedAt) updated.kitchenStartedAt = now;
      updated.kitchenReadyAt = undefined;
      updated.kitchenCompletedAt = undefined;
    } else if (targetStatus === 'ready') {
      if (!updated.kitchenStartedAt) updated.kitchenStartedAt = updated.kitchenStartedAt || now;
      updated.kitchenReadyAt = now;
      updated.kitchenCompletedAt = undefined;
      // Mark all items as prepared
      const preparedMap: Record<string, boolean> = {};
      currentOrder.items.forEach(it => { preparedMap[it.id] = true; });
      updated.itemPreparedMap = preparedMap;
    } else if (targetStatus === 'served') {
      if (!updated.kitchenStartedAt) updated.kitchenStartedAt = updated.kitchenStartedAt || now;
      if (!updated.kitchenReadyAt) updated.kitchenReadyAt = updated.kitchenReadyAt || now;
      updated.kitchenCompletedAt = now;
      // Mark all items as prepared
      const preparedMap: Record<string, boolean> = {};
      currentOrder.items.forEach(it => { preparedMap[it.id] = true; });
      updated.itemPreparedMap = preparedMap;
      
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    setLocalOrder(updated);
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }
  };

  const handleAdvanceToNextStage = () => {
    if (currentStageIndex < ORDER_STAGES.length - 1) {
      const nextStage = ORDER_STAGES[currentStageIndex + 1];
      handleUpdateStatus(nextStage.key);
    }
  };

  const getStageTimestamp = (stageKey: 'pending' | 'preparing' | 'ready' | 'served'): string | null => {
    if (stageKey === 'pending') {
      return currentOrder.createdAt ? new Date(currentOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    }
    if (stageKey === 'preparing') {
      return currentOrder.kitchenStartedAt ? new Date(currentOrder.kitchenStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    }
    if (stageKey === 'ready') {
      return currentOrder.kitchenReadyAt ? new Date(currentOrder.kitchenReadyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    }
    if (stageKey === 'served') {
      return currentOrder.kitchenCompletedAt ? new Date(currentOrder.kitchenCompletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    }
    return null;
  };

  const handlePrintThermalReceipt = () => {
    // Automatically format as thermal receipt and trigger browser print dialog
    setViewMode('receipt');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintA4Invoice = () => {
    // Format as A4 Tax Invoice and trigger browser print dialog
    setViewMode('invoice');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHTML = () => {
    const printElement = document.getElementById('printable-invoice-content');
    if (!printElement) return;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${viewMode === 'receipt' ? 'Thermal Receipt' : 'Invoice'} - ${currentOrder.invoiceNumber}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: ${viewMode === 'receipt' ? 'monospace' : 'system-ui, -apple-system, sans-serif'}; background: #fff; color: #1e293b; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      ${viewMode === 'receipt' ? '@page { size: 80mm auto; margin: 3mm; }' : '@page { size: A4; margin: 8mm; }'}
    }
  </style>
</head>
<body class="p-4 ${viewMode === 'receipt' ? 'max-w-[360px]' : 'max-w-4xl'} mx-auto">
  ${printElement.innerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentOrder.invoiceNumber || 'invoice'}-${viewMode}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const summaryText = `*${profile.name}*
Invoice: ${currentOrder.invoiceNumber}
Customer: ${currentOrder.customerName || 'Customer'}
Order Type: ${currentOrder.orderType.toUpperCase()} ${currentOrder.tableNumber ? `(${currentOrder.tableNumber})` : ''}
Fulfillment Status: ${currentStatus.toUpperCase()}
Date: ${formatDateTime(currentOrder.createdAt)}

*ITEMS:*
${currentOrder.items.map(it => `• ${it.quantity}x ${it.name} - ${formatCurrency(it.price * it.quantity, profile.currencySymbol)}`).join('\n')}

Subtotal: ${formatCurrency(currentOrder.subtotal, profile.currencySymbol)}
${currentOrder.discountAmount > 0 ? `Discount: -${formatCurrency(currentOrder.discountAmount, profile.currencySymbol)}\n` : ''}Tax (${currentOrder.taxRate}%): ${formatCurrency(currentOrder.taxAmount, profile.currencySymbol)}
${currentOrder.serviceChargeAmount > 0 ? `Service Charge: ${formatCurrency(currentOrder.serviceChargeAmount, profile.currencySymbol)}\n` : ''}${currentOrder.tipAmount > 0 ? `Gratuity / Tip: ${formatCurrency(currentOrder.tipAmount, profile.currencySymbol)}\n` : ''}*TOTAL AMOUNT: ${formatCurrency(currentOrder.total, profile.currencySymbol)}*
Payment: ${currentOrder.paymentStatus.toUpperCase()} (${currentOrder.paymentMethod.replace('_', ' ').toUpperCase()})

Thank you for choosing ${profile.name}!`;

    navigator.clipboard.writeText(summaryText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const handleMarkAsPaid = () => {
    const updated: BillOrder = {
      ...currentOrder,
      paymentStatus: 'paid',
      amountPaid: currentOrder.total,
    };
    setLocalOrder(updated);
    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }
    if (onUpdatePaymentStatus) {
      onUpdatePaymentStatus(currentOrder.id, 'paid');
    }
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const getStatusBadge = () => {
    switch (currentOrder.paymentStatus) {
      case 'paid':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">● PAID IN FULL</span>;
      case 'partially_paid':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-300">● PARTIALLY PAID ({formatCurrency(currentOrder.amountPaid, profile.currencySymbol)} of {formatCurrency(currentOrder.total, profile.currencySymbol)})</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 font-bold text-xs rounded-full border border-red-300">● PAYMENT PENDING</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">{currentOrder.paymentStatus}</span>;
    }
  };

  const getFulfillmentBadge = () => {
    switch (currentStatus) {
      case 'served':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-full border border-emerald-300">● SERVED / COMPLETED</span>;
      case 'ready':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-[11px] rounded-full border border-blue-300 animate-pulse">● READY FOR PICKUP</span>;
      case 'preparing':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold text-[11px] rounded-full border border-amber-300">● PREPARING IN KITCHEN</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-full border border-slate-300">● ORDER RECEIVED</span>;
    }
  };

  // Progress percentage for track fill line
  const progressPercent = (currentStageIndex / (ORDER_STAGES.length - 1)) * 100;

  return (
    <motion.div 
      key="invoice-viewer-backdrop"
      id="invoice-viewer-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:m-0 print:overflow-visible print:bg-transparent print:static"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div 
        key="invoice-viewer-dialog"
        id="invoice-viewer-dialog"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden print:shadow-none print:border-none print:max-h-none print:overflow-visible print:bg-transparent print:static print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="print:hidden px-4 sm:px-6 py-3 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('invoice')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'invoice' 
                    ? 'bg-amber-500 text-slate-950 shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Executive Tax Invoice (A4)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('receipt')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'receipt' 
                    ? 'bg-amber-500 text-slate-950 shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Thermal 80mm Receipt</span>
              </button>
            </div>

            {viewMode === 'invoice' && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-xs">
                <span className="text-slate-400 text-[11px] mr-1">Style:</span>
                {(['modern', 'bistro', 'minimal', 'gastropub'] as const).map((sty) => (
                  <button
                    key={sty}
                    onClick={() => setTemplate(sty)}
                    className={`px-2 py-0.5 rounded capitalize text-[11px] font-medium transition-all ${
                      template === sty ? 'bg-slate-700 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sty}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentOrder.paymentStatus !== 'paid' && (
              <button
                type="button"
                onClick={handleMarkAsPaid}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark as Paid
              </button>
            )}

            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Copy formatted text summary for WhatsApp or Email"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedNotification ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHTML}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Download standalone HTML document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download HTML</span>
            </button>

            {/* Dedicated Thermal Receipt Browser-Print Button */}
            <button
              id="btn-print-thermal-receipt"
              type="button"
              onClick={handlePrintThermalReceipt}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-sm ring-1 ring-amber-400/50 cursor-pointer"
              title="Automatically formats invoice as 80mm thermal receipt and launches browser print dialog"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Print Thermal Receipt</span>
            </button>

            {/* A4 Executive Tax Invoice Print Button */}
            <button
              id="btn-print-a4-invoice"
              type="button"
              onClick={handlePrintA4Invoice}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Formats as full A4 tax invoice and launches browser print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================== INTERACTIVE ORDER PROGRESS BAR ===================== */}
        <div className="print:hidden bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-3 text-white shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-300">
                Order Lifecycle Status:
              </span>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wide px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700">
                {ORDER_STAGES[currentStageIndex].label}
              </span>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                • Click any stage to instantly update status
              </span>
            </div>

            {/* Fast Next-Stage Action Button */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {currentStageIndex < ORDER_STAGES.length - 1 ? (
                <button
                  id="btn-advance-order-status"
                  type="button"
                  onClick={handleAdvanceToNextStage}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  title={`Advance to ${ORDER_STAGES[currentStageIndex + 1].label}`}
                >
                  <span>Advance to {ORDER_STAGES[currentStageIndex + 1].label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Order Fully Served & Finalized</span>
                </div>
              )}
            </div>
          </div>

          {/* Stepper Progress Visual Bar with connecting track */}
          <div className="relative pt-2 pb-1">
            {/* Background connecting track */}
            <div className="absolute top-[26px] left-[6%] right-[6%] h-1.5 bg-slate-800 rounded-full z-0 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Stage Steps Grid */}
            <div className="grid grid-cols-4 relative z-10">
              {ORDER_STAGES.map((stage, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const isFuture = idx > currentStageIndex;
                const StageIcon = stage.icon;
                const stageTime = getStageTimestamp(stage.key);

                return (
                  <button
                    key={stage.key}
                    id={`btn-status-stage-${stage.key}`}
                    type="button"
                    onClick={() => handleUpdateStatus(stage.key)}
                    className="group flex flex-col items-center text-center cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-hidden"
                    title={`Click to set status to ${stage.label} (${stage.description})`}
                  >
                    {/* Node Circle */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 font-black scale-110'
                        : isPassed
                        ? 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 ring-2 ring-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200'
                    }`}>
                      {isPassed ? (
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <StageIcon className="w-4 h-4" />
                      )}
                    </div>

                    {/* Step Label & Subtitle */}
                    <div className="mt-2 flex flex-col items-center">
                      <div className={`text-xs font-black transition-colors flex items-center gap-1 ${
                        isCurrent
                          ? 'text-amber-400'
                          : isPassed
                          ? 'text-emerald-400 font-bold'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}>
                        <span>{stage.label}</span>
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 hidden sm:block">
                        {stage.sublabel}
                      </div>

                      {/* Timestamp if available */}
                      {stageTime ? (
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5 flex items-center gap-0.5 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700/60">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{stageTime}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-600 mt-0.5 hidden sm:block">
                          {isCurrent ? 'Active Now' : '--'}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Invoice / Receipt Main Render Container */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-200/60 flex justify-center print:p-0 print:m-0 print:overflow-visible print:bg-transparent print:block">
          
          <div 
            id="printable-invoice-content"
            className={`bg-white shadow-xl transition-all duration-200 print:shadow-none print:border-none print:m-0 ${
              viewMode === 'receipt' 
                ? 'thermal-receipt-mode w-full max-w-[360px] p-6 text-slate-900 border border-slate-300 font-mono text-xs print:p-2' 
                : 'w-full max-w-3xl p-8 sm:p-10 text-slate-800 border border-slate-200 print:p-4'
            }`}
          >
            
            {/* ===================== THERMAL RECEIPT VIEW (80mm) ===================== */}
            {viewMode === 'receipt' ? (
              <div className="flex flex-col items-center text-center">
                
                {/* Thermal Quick Print Action Bar (Hidden on print) */}
                <div className="print:hidden w-full mb-3 pb-3 border-b border-dashed border-slate-300 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-sans font-medium text-slate-600 flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-amber-600" />
                    80mm Thermal Slip
                  </span>
                  <button
                    id="btn-thermal-slip-direct-print"
                    type="button"
                    onClick={handlePrintThermalReceipt}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px] font-sans flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    Browser Print
                  </button>
                </div>

                {/* Brand Header */}
                <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
                  {profile.name}
                </h1>
                <p className="text-[11px] text-slate-600 font-sans mt-0.5">{profile.tagline}</p>
                <p className="text-[11px] text-slate-500 mt-1">{profile.address}</p>
                <p className="text-[11px] text-slate-500">Tel: {profile.phone}</p>
                {profile.taxId && (
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Tax Reg: {profile.taxId}</p>
                )}

                <div className="w-full border-b-2 border-dashed border-slate-400 my-3" />

                {/* Metadata details */}
                <div className="w-full text-left text-[11px] space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Receipt #:</span>
                    <span className="font-bold">{currentOrder.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date/Time:</span>
                    <span>{formatDateTime(currentOrder.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order Type:</span>
                    <span className="font-bold uppercase">{currentOrder.orderType} {currentOrder.tableNumber && `[${currentOrder.tableNumber}]`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fulfillment:</span>
                    <span className="font-bold uppercase text-emerald-700">{currentStatus}</span>
                  </div>
                  {currentOrder.serverName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Server:</span>
                      <span>{currentOrder.serverName}</span>
                    </div>
                  )}
                  {currentOrder.customerName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span>{currentOrder.customerName}</span>
                    </div>
                  )}
                </div>

                <div className="w-full border-b border-dashed border-slate-300 my-2.5" />

                {/* Items Table */}
                <div className="w-full text-left">
                  <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-slate-800">
                    <span className="w-8">QTY</span>
                    <span className="flex-1 px-2">ITEM</span>
                    <span className="text-right">AMT</span>
                  </div>
                  <div className="divide-y divide-slate-100 py-1">
                    {currentOrder.items.map((item, idx) => (
                      <div key={idx} className="py-1.5 text-[11px]">
                        <div className="flex justify-between items-start">
                          <span className="w-8 font-bold">{item.quantity}x</span>
                          <span className="flex-1 px-2 font-medium">{item.name}</span>
                          <span className="text-right font-bold font-mono">
                            {formatCurrency(item.price * item.quantity, profile.currencySymbol)}
                          </span>
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-slate-500 italic pl-10">
                            ↳ {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full border-b-2 border-dashed border-slate-400 my-2.5" />

                {/* Financial Summary */}
                <div className="w-full space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span>{formatCurrency(currentOrder.subtotal, profile.currencySymbol)}</span>
                  </div>

                  {currentOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount ({currentOrder.discountValue}{currentOrder.discountType === 'percentage' ? '%' : ''})</span>
                      <span>-{formatCurrency(currentOrder.discountAmount, profile.currencySymbol)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax / VAT ({currentOrder.taxRate}%)</span>
                    <span>{formatCurrency(currentOrder.taxAmount, profile.currencySymbol)}</span>
                  </div>

                  {currentOrder.serviceChargeAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Service Charge ({currentOrder.serviceChargeRate}%)</span>
                      <span>{formatCurrency(currentOrder.serviceChargeAmount, profile.currencySymbol)}</span>
                    </div>
                  )}

                  {currentOrder.tipAmount > 0 && (
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-600">Tip / Gratuity</span>
                      <span>{formatCurrency(currentOrder.tipAmount, profile.currencySymbol)}</span>
                    </div>
                  )}

                  <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between text-sm font-black">
                    <span>TOTAL DUE</span>
                    <span>{formatCurrency(currentOrder.total, profile.currencySymbol)}</span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                    <span>Payment Method:</span>
                    <span className="font-bold uppercase">{currentOrder.paymentMethod.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Payment Status:</span>
                    <span className="font-bold uppercase text-emerald-700">{currentOrder.paymentStatus}</span>
                  </div>
                </div>

                <div className="w-full border-b border-dashed border-slate-400 my-3" />

                {/* QR Code & Footer */}
                <div className="flex flex-col items-center">
                  <QRCodeDisplay
                    value={`INVOICE:${currentOrder.invoiceNumber}|TOTAL:${currentOrder.total}|RESTAURANT:${profile.name}`}
                    size={84}
                    label="Scan for E-Receipt & Points"
                  />
                  <p className="text-[10px] text-slate-600 text-center font-sans mt-3 px-2">
                    {profile.receiptFooterMessage}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono mt-1">
                    Powered by Bella Vista Kitchen OS
                  </p>
                </div>
              </div>
            ) : (
              
              /* ===================== FULL A4 / LETTER EXECUTIVE TAX INVOICE ===================== */
              <div className={`space-y-6 ${
                template === 'bistro' ? 'font-serif' : 'font-sans'
              }`}>
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xl shadow-xs">
                        BV
                      </div>
                      <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">
                          {profile.name}
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">{profile.tagline}</p>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-600 space-y-0.5 font-sans">
                      <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {profile.address}</p>
                      <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {profile.phone} • <Mail className="w-3.5 h-3.5 text-slate-400" /> {profile.email}</p>
                      {profile.taxId && <p className="font-mono text-slate-500">Tax ID / EIN: {profile.taxId}</p>}
                    </div>
                  </div>

                  <div className="text-left sm:text-right font-sans">
                    <span className="text-xs uppercase tracking-widest font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                      TAX INVOICE
                    </span>
                    <div className="text-xl font-bold text-slate-900 font-mono mt-2">
                      {currentOrder.invoiceNumber}
                    </div>
                    <div className="mt-1 flex flex-wrap sm:justify-end gap-1.5">
                      {getStatusBadge()}
                      {getFulfillmentBadge()}
                    </div>
                    <div className="mt-2.5 print:hidden">
                      <button
                        id="btn-switch-thermal-print"
                        type="button"
                        onClick={handlePrintThermalReceipt}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-md transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Automatically format this invoice as an 80mm thermal receipt and trigger browser print"
                      >
                        <Receipt className="w-3 h-3 text-amber-700" />
                        <span>Thermal Receipt Print</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bill To & Invoice Meta Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      BILLED TO:
                    </span>
                    <div className="text-sm font-bold text-slate-900">
                      {currentOrder.customerName || "Walk-In Dining Customer"}
                    </div>
                    {currentOrder.customerAddress && (
                      <p className="text-slate-600 mt-0.5">{currentOrder.customerAddress}</p>
                    )}
                    {currentOrder.customerPhone && (
                      <p className="text-slate-600 mt-0.5">Phone: {currentOrder.customerPhone}</p>
                    )}
                    {currentOrder.customerEmail && (
                      <p className="text-slate-600 mt-0.5">Email: {currentOrder.customerEmail}</p>
                    )}
                    {currentOrder.customerTaxId && (
                      <p className="text-slate-600 font-mono mt-0.5">Client Tax ID: {currentOrder.customerTaxId}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Invoice Date</span>
                      <span className="font-semibold text-slate-900">{formatDate(currentOrder.createdAt)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Payment Due</span>
                      <span className="font-semibold text-slate-900">{currentOrder.dueDate ? formatDate(currentOrder.dueDate) : "Due on Receipt"}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Order Type</span>
                      <span className="font-semibold text-slate-900 capitalize">{currentOrder.orderType} {currentOrder.tableNumber && `(${currentOrder.tableNumber})`}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Order Stage</span>
                      <span className="font-semibold text-slate-900 capitalize">{ORDER_STAGES[currentStageIndex].label}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto font-sans">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-semibold">
                        <th className="py-2.5 px-3 rounded-l-lg">#</th>
                        <th className="py-2.5 px-3">Item Description & Preparation Notes</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right rounded-r-lg">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentOrder.items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/80">
                          <td className="py-3 px-3 text-slate-400 font-mono">{index + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                            {item.notes && (
                              <div className="text-slate-500 text-[11px] italic mt-0.5">
                                Instructions: {item.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {formatCurrency(item.price, profile.currencySymbol)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(item.price * item.quantity, profile.currencySymbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Calculation & Bank Details Section */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 border-t border-slate-200 font-sans">
                  
                  {/* Left Column: Bank info, Terms & QR */}
                  <div className="sm:col-span-7 space-y-4">
                    
                    {/* Bank Info */}
                    {profile.bankDetails && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-600" />
                          Bank Transfer / ACH Instructions
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 text-[11px] text-slate-600">
                          <span>Bank: <strong>{profile.bankDetails.bankName}</strong></span>
                          <span>Account: <strong>{profile.bankDetails.accountName}</strong></span>
                          <span>Acc #: <strong className="font-mono">{profile.bankDetails.accountNumber}</strong></span>
                          <span>Routing/IFSC: <strong className="font-mono">{profile.bankDetails.routingOrIfsc}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Terms & Notes */}
                    <div className="text-xs text-slate-500 space-y-1">
                      <span className="font-bold text-slate-700 block">Terms & Conditions:</span>
                      <p className="text-[11px] leading-relaxed">{profile.invoiceTerms}</p>
                    </div>

                    {currentOrder.notes && (
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs text-amber-900">
                        <strong>Event / Special Notes:</strong> {currentOrder.notes}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Financial Totals & QR */}
                  <div className="sm:col-span-5 flex flex-col justify-between">
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(currentOrder.subtotal, profile.currencySymbol)}</span>
                      </div>

                      {currentOrder.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Discount ({currentOrder.discountValue}{currentOrder.discountType === 'percentage' ? '%' : ''}):</span>
                          <span>-{formatCurrency(currentOrder.discountAmount, profile.currencySymbol)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-slate-600">
                        <span>Tax / VAT ({currentOrder.taxRate}%):</span>
                        <span>{formatCurrency(currentOrder.taxAmount, profile.currencySymbol)}</span>
                      </div>

                      {currentOrder.serviceChargeAmount > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Service Charge ({currentOrder.serviceChargeRate}%):</span>
                          <span>{formatCurrency(currentOrder.serviceChargeAmount, profile.currencySymbol)}</span>
                        </div>
                      )}

                      {currentOrder.tipAmount > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Gratuity / Tip:</span>
                          <span>{formatCurrency(currentOrder.tipAmount, profile.currencySymbol)}</span>
                        </div>
                      )}

                      <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-base font-black text-slate-950">
                        <span>TOTAL INVOICE:</span>
                        <span>{formatCurrency(currentOrder.total, profile.currencySymbol)}</span>
                      </div>

                      {currentOrder.amountPaid > 0 && (
                        <div className="flex justify-between text-emerald-700 pt-1">
                          <span>Amount Paid:</span>
                          <span>{formatCurrency(currentOrder.amountPaid, profile.currencySymbol)}</span>
                        </div>
                      )}

                      {currentOrder.total - currentOrder.amountPaid > 0.01 && (
                        <div className="flex justify-between text-red-700 font-bold border-t border-red-200 pt-1">
                          <span>Balance Due:</span>
                          <span>{formatCurrency(currentOrder.total - currentOrder.amountPaid, profile.currencySymbol)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                      <div className="text-[10px] text-slate-400 font-sans">
                        Authorized Signature & Seal<br />
                        <strong>{profile.name}</strong>
                      </div>
                      <QRCodeDisplay
                        value={`INVOICE:${currentOrder.invoiceNumber}|DUE:${currentOrder.total - currentOrder.amountPaid}`}
                        size={72}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Message */}
                <div className="text-center pt-6 border-t border-slate-200 text-xs text-slate-500 font-sans">
                  <p>{profile.receiptFooterMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

