import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  Sparkles, 
  Wifi, 
  Utensils, 
  Layers, 
  Smartphone,
  Info,
  Edit3,
  Trash2,
  Users,
  Search,
  Radio,
  Clock,
  AlertTriangle,
  Square,
  Circle,
  RectangleHorizontal,
  ChevronRight,
  Filter,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import QRCode from 'qrcode';
import { RestaurantProfile, BillOrder, RestaurantTable, TableSection } from '../types';
import { DEFAULT_TABLE_SECTIONS } from '../data/defaultData';
import { formatCurrency } from '../utils/formatters';
import { TableEditorModal } from './TableEditorModal';
import { BatchAddTablesModal } from './BatchAddTablesModal';

interface TableQRViewProps {
  profile: RestaurantProfile;
  orders: BillOrder[];
  tables: RestaurantTable[];
  onSaveTable: (table: RestaurantTable) => void;
  onDeleteTable: (tableId: string) => void;
  onBatchAddTables: (tables: RestaurantTable[]) => void;
  onOpenCustomerView: (tableNumber: string) => void;
  onOpenPOSWithTable?: (tableNumber: string) => void;
}

export const TableQRView: React.FC<TableQRViewProps> = ({
  profile,
  orders,
  tables,
  onSaveTable,
  onDeleteTable,
  onBatchAddTables,
  onOpenCustomerView,
  onOpenPOSWithTable,
}) => {
  const [selectedTableName, setSelectedTableName] = useState<string>(() => {
    return tables.length > 0 ? tables[0].name : 'Table 1';
  });
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Wi-Fi Standee Settings
  const [wifiSsid, setWifiSsid] = useState<string>(profile.name ? `${profile.name}_Guest_WiFi` : 'Restaurant_Guest_WiFi');
  const [wifiPassword, setWifiPassword] = useState<string>('DineIn123');
  const [showWifiOnStandee, setShowWifiOnStandee] = useState<boolean>(true);
  const [standeeTheme, setStandeeTheme] = useState<'dark' | 'gold' | 'minimal'>('dark');

  // Modals & UI States
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [isBatchOpen, setIsBatchOpen] = useState<boolean>(false);
  const [tableToDelete, setTableToDelete] = useState<RestaurantTable | null>(null);
  
  const [copied, setCopied] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Keep selected table valid if tables change
  useEffect(() => {
    if (tables.length > 0 && !tables.some(t => t.name === selectedTableName)) {
      setSelectedTableName(tables[0].name);
    }
  }, [tables, selectedTableName]);

  // Selected table object
  const currentTableObj = tables.find(t => t.name === selectedTableName) || tables[0];

  // Unique sections for tabs
  const availableSections = ['All', ...Array.from(new Set(tables.map(t => t.section).filter(Boolean)))];

  // Helper for active table order
  const getTableActiveOrder = (tblName: string) => {
    if (!tblName) return undefined;
    const cleanTbl = tblName.trim().toLowerCase();
    return orders.find(o => 
      o.tableNumber && o.tableNumber.trim().toLowerCase() === cleanTbl && 
      o.paymentStatus === 'pending' && 
      !o.isArchived
    );
  };

  // Filtered tables list
  const filteredTables = tables.filter(t => {
    const matchesSection = selectedSection === 'All' || t.section === selectedSection;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      t.name.toLowerCase().includes(q) || 
      (t.section && t.section.toLowerCase().includes(q)) ||
      (t.notes && t.notes.toLowerCase().includes(q));

    const activeOrder = getTableActiveOrder(t.name);
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'occupied' ? Boolean(activeOrder) :
      !activeOrder;

    return matchesSection && matchesSearch && matchesStatus;
  });

  const occupiedCount = tables.filter(t => !!getTableActiveOrder(t.name)).length;
  const totalCapacity = tables.reduce((sum, t) => sum + (t.capacity || 4), 0);

  // Generate current ordering URL
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const currentTableUrl = `${baseUrl}?table=${encodeURIComponent(selectedTableName || 'Table 1')}`;

  // Generate QR Code data URL
  useEffect(() => {
    if (!selectedTableName) return;
    
    QRCode.toDataURL(currentTableUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: standeeTheme === 'gold' ? '#78350f' : '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
  }, [selectedTableName, currentTableUrl, standeeTheme]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentTableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${profile.name.replace(/\s+/g, '_')}_${selectedTableName.replace(/\s+/g, '_')}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintSingleStandee = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const secName = currentTableObj?.section || 'Main Dining';
    const cap = currentTableObj?.capacity || 4;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table Standee - ${selectedTableName} - ${profile.name}</title>
          <style>
            @page { size: auto; margin: 12mm; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0; 
              padding: 20px; 
              background: #fff;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 90vh;
            }
            .standee {
              width: 340px;
              border: 3px solid #0f172a;
              border-radius: 24px;
              padding: 28px 24px;
              text-align: center;
              box-shadow: 0 10px 25px rgba(0,0,0,0.05);
              background: #fff;
            }
            .brand-name {
              font-size: 20px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }
            .tagline {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 14px;
            }
            .table-badge {
              display: inline-block;
              background: #0f172a;
              color: #fbbf24;
              font-weight: 800;
              font-size: 15px;
              padding: 6px 18px;
              border-radius: 12px;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .section-badge {
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              margin-bottom: 14px;
            }
            .qr-wrap {
              background: #f8fafc;
              border: 1px dashed #cbd5e1;
              padding: 12px;
              border-radius: 18px;
              display: inline-block;
              margin-bottom: 14px;
            }
            .qr-img {
              width: 210px;
              height: 210px;
              display: block;
            }
            .scan-instructions {
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .sub-instructions {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 14px;
            }
            .wifi-box {
              background: #f1f5f9;
              border-radius: 12px;
              padding: 10px 12px;
              font-size: 11px;
              color: #334155;
              text-align: left;
            }
            .wifi-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .wifi-row:last-child { margin-bottom: 0; }
            .wifi-label { font-weight: bold; color: #64748b; }
            .wifi-val { font-family: monospace; font-weight: bold; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="standee">
            <div class="brand-name">${profile.name}</div>
            <div class="tagline">${profile.tagline || 'Contactless Table Ordering'}</div>
            <div class="table-badge">${selectedTableName}</div>
            <div class="section-badge">${secName} • Seating for ${cap}</div>
            <div class="qr-wrap">
              <img src="${qrDataUrl}" class="qr-img" />
            </div>
            <div class="scan-instructions">📲 Scan with Camera to Order</div>
            <div class="sub-instructions">Browse digital menu, order food & get live bill updates</div>
            ${showWifiOnStandee && wifiSsid ? `
              <div class="wifi-box">
                <div class="wifi-row">
                  <span class="wifi-label">Free Wi-Fi:</span>
                  <span class="wifi-val">${wifiSsid}</span>
                </div>
                ${wifiPassword ? `
                  <div class="wifi-row">
                    <span class="wifi-label">Password:</span>
                    <span class="wifi-val">${wifiPassword}</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAllTables = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate QR images for all tables
    const tableCards = await Promise.all(
      tables.map(async (tbl) => {
        const url = `${baseUrl}?table=${encodeURIComponent(tbl.name)}`;
        const qr = await QRCode.toDataURL(url, {
          width: 220,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
          errorCorrectionLevel: 'H'
        });
        return { tbl, qr };
      })
    );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>All Table QR Standees - ${profile.name}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0; 
              padding: 10px; 
              background: #fff;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .standee {
              border: 2px solid #0f172a;
              border-radius: 18px;
              padding: 16px;
              text-align: center;
              page-break-inside: avoid;
              box-sizing: border-box;
            }
            .brand-name {
              font-size: 15px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
            }
            .table-badge {
              display: inline-block;
              background: #0f172a;
              color: #fbbf24;
              font-weight: 800;
              font-size: 13px;
              padding: 4px 14px;
              border-radius: 8px;
              margin: 6px 0 2px 0;
              text-transform: uppercase;
            }
            .section-badge {
              font-size: 10px;
              color: #64748b;
              font-weight: bold;
              margin-bottom: 6px;
            }
            .qr-img {
              width: 140px;
              height: 140px;
              display: block;
              margin: 0 auto 6px auto;
            }
            .scan-instructions {
              font-size: 12px;
              font-weight: 800;
              color: #0f172a;
            }
            .sub-instructions {
              font-size: 10px;
              color: #64748b;
              margin-bottom: 6px;
            }
            .wifi-box {
              background: #f1f5f9;
              border-radius: 8px;
              padding: 6px 10px;
              font-size: 9px;
              color: #334155;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${tableCards.map(({ tbl, qr }) => `
              <div class="standee">
                <div class="brand-name">${profile.name}</div>
                <div class="table-badge">${tbl.name}</div>
                <div class="section-badge">${tbl.section} • ${tbl.capacity} Seats</div>
                <img src="${qr}" class="qr-img" />
                <div class="scan-instructions">📲 Scan to Order</div>
                <div class="sub-instructions">Instant digital menu & live bill tracking</div>
                ${showWifiOnStandee && wifiSsid ? `
                  <div class="wifi-box">
                    <strong>Free Wi-Fi:</strong> ${wifiSsid} ${wifiPassword ? `| <strong>Pass:</strong> ${wifiPassword}` : ''}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDeleteConfirm = () => {
    if (!tableToDelete) return;
    onDeleteTable(tableToDelete.id);
    setTableToDelete(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-2xl shadow-lg shrink-0">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Dining Floor & Table QR Hub
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-full uppercase border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Manage dining tables, seating capacities, floor sections, and customize live QR standees for customer contactless ordering.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsBatchOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Bulk Add Tables</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingTable(null);
              setIsEditorOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>

          <button
            type="button"
            onClick={handlePrintAllTables}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print All Standees ({tables.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Registered Tables</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{tables.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Seating Capacity</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalCapacity} Seats</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Occupied Tables</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{occupiedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Available / Ready</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{tables.length - occupiedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Tables Floor + Standee Config & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Tables Floor Directory */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Controls Bar: Search & Status Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter tables by name or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All ({tables.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('available')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'available'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Free ({tables.length - occupiedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('occupied')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'occupied'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Busy ({occupiedCount})
                </button>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
              {availableSections.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSection(sec)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    selectedSection === sec
                      ? 'bg-slate-900 dark:bg-amber-400 text-amber-400 dark:text-slate-950 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Tables Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredTables.map((tbl) => {
              const isSelected = selectedTableName === tbl.name;
              const activeOrder = getTableActiveOrder(tbl.name);
              const isOccupied = Boolean(activeOrder);

              return (
                <div
                  key={tbl.id}
                  onClick={() => setSelectedTableName(tbl.name)}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs transition-all cursor-pointer flex flex-col justify-between group relative ${
                    isSelected
                      ? 'border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/40 shadow-md bg-amber-50/20 dark:bg-amber-950/15'
                      : isOccupied
                      ? 'border-amber-300 dark:border-amber-700/60 hover:border-amber-400'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top Row: Name, Section & Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {tbl.name}
                          </h3>
                          {tbl.isActive === false && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-bold">
                              Disabled
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                          {tbl.section}
                        </span>
                      </div>

                      {/* Status badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                        isOccupied
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span>{isOccupied ? 'Occupied' : 'Free'}</span>
                      </span>
                    </div>

                    {/* Capacity & Shape Details */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{tbl.capacity} Seats</span>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md capitalize">
                        {tbl.shape === 'round' ? <Circle className="w-3 h-3" /> :
                         tbl.shape === 'rectangle' ? <RectangleHorizontal className="w-3 h-3" /> :
                         <Square className="w-3 h-3" />}
                        <span className="text-[11px]">{tbl.shape || 'Square'}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {tbl.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic mb-2">
                        &ldquo;{tbl.notes}&rdquo;
                      </p>
                    )}

                    {/* Live Order Card */}
                    {activeOrder && (
                      <div className="p-2.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs mb-2">
                        <div className="flex justify-between items-center font-bold text-amber-950 dark:text-amber-200">
                          <span>Order #{activeOrder.invoiceNumber}</span>
                          <span className="font-mono font-black">{formatCurrency(activeOrder.total, profile.currencySymbol)}</span>
                        </div>
                        <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-0.5">
                          {activeOrder.customerName ? `${activeOrder.customerName} • ` : ''}{activeOrder.items?.length || 0} items
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 mt-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTable(tbl);
                          setIsEditorOpen(true);
                        }}
                        title="Edit Table"
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {tables.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTableToDelete(tbl);
                          }}
                          title="Delete Table"
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onOpenPOSWithTable && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPOSWithTable(tbl.name);
                          }}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open in POS</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCustomerView(tbl.name);
                        }}
                        className="px-2.5 py-1 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Standee Preview & QR Generator for Selected Table */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Standee Configuration Settings */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Wifi className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Guest Wi-Fi on Table Standee
                </h3>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showWifiOnStandee}
                  onChange={(e) => setShowWifiOnStandee(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-400"
                />
                <span>Include on QR</span>
              </label>
            </div>

            {showWifiOnStandee && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Wi-Fi Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="e.g. Cafe_Guest_5G"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Standee Preview Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center space-y-4">
            
            {/* Standee Physical Card */}
            <div className="w-full max-w-xs bg-white border-2 border-slate-900 rounded-3xl p-5 text-center shadow-xl space-y-3 relative text-slate-900">
              <div className="absolute top-3 right-3 text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                Standee
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide line-clamp-1">{profile.name}</h3>
                <p className="text-[10px] text-slate-500">{profile.tagline || 'Contactless Table Ordering'}</p>
              </div>

              <div>
                <span className="inline-block px-4 py-1 bg-slate-900 text-amber-400 font-black text-sm rounded-xl shadow-xs">
                  {selectedTableName}
                </span>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                  {currentTableObj?.section || 'Main Dining'} • {currentTableObj?.capacity || 4} Seats
                </span>
              </div>

              {/* QR Image Box */}
              <div className="bg-slate-50 border border-dashed border-slate-300 p-2.5 rounded-2xl inline-block">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${selectedTableName}`}
                    className="w-40 h-40 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                    Generating...
                  </div>
                )}
              </div>

              <div>
                <p className="font-extrabold text-xs text-slate-900">📲 Scan with Camera to Order</p>
                <p className="text-[10px] text-slate-500">Live menu, food orders & instant bill tracking</p>
              </div>

              {showWifiOnStandee && wifiSsid && (
                <div className="bg-slate-100 rounded-xl p-2 text-[10px] text-slate-700 text-left font-mono space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Wi-Fi:</span>
                    <span className="font-bold text-slate-900">{wifiSsid}</span>
                  </div>
                  {wifiPassword && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Pass:</span>
                      <span className="font-bold text-slate-900">{wifiPassword}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Standee Action Buttons */}
            <div className="w-full max-w-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrintSingleStandee}
                  className="py-2.5 px-3 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400 dark:text-slate-950" />
                  <span>Print Standee</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>Save QR PNG</span>
                </button>
              </div>

              {/* Copy Direct URL */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={currentTableUrl}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[10px] text-slate-700 dark:text-slate-300 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onOpenCustomerView(selectedTableName)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer hover:brightness-105"
              >
                <Smartphone className="w-4 h-4" />
                <span>Test Live Order as Customer at {selectedTableName}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Alert Modal */}
      {tableToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-800/60 p-6 w-full max-w-md shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Delete {tableToDelete.name}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to remove this table from the floor directory? This will remove its QR code entry.
              </p>
              {getTableActiveOrder(tableToDelete.name) && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 text-left">
                  ⚠️ Warning: {tableToDelete.name} currently has an active pending dine-in order.
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modals */}
      <TableEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingTable(null);
        }}
        tableToEdit={editingTable}
        onSave={onSaveTable}
        existingTables={tables}
      />

      <BatchAddTablesModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        existingTables={tables}
        onBatchSave={onBatchAddTables}
      />
    </div>
  );
};
