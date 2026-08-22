import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Sparkles, 
  Wifi, 
  Utensils, 
  Layers, 
  Smartphone, 
  Info,
  CheckCircle2,
  Clock,
  Radio,
  Eye,
  BellRing,
  Wine,
  Receipt
} from 'lucide-react';
import QRCode from 'qrcode';
import { RestaurantProfile, BillOrder, StaffUser } from '../types';

interface TableQRViewProps {
  profile: RestaurantProfile;
  orders: BillOrder[];
  currentUser: StaffUser | null;
  onOpenCustomerView: (tableNumber: string) => void;
  onServiceRequest?: (tableNumber: string, requestType: 'drink' | 'bill' | 'waiter' | 'cutlery' | 'custom', note?: string) => void;
}

const DEFAULT_TABLES = [
  'Table 1', 'Table 2', 'Table 3', 'Table 4', 
  'Table 5', 'Table 6', 'Table 7', 'Table 8',
  'Bar 1', 'Bar 2', 'Patio 1', 'Patio 2'
];

export const TableQRView: React.FC<TableQRViewProps> = ({
  profile,
  orders,
  currentUser,
  onOpenCustomerView,
  onServiceRequest,
}) => {
  const [tablesList, setTablesList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pos_tables_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return DEFAULT_TABLES;
  });

  const [selectedTable, setSelectedTable] = useState<string>('Table 1');
  const [newTableName, setNewTableName] = useState<string>('');
  const [wifiSsid, setWifiSsid] = useState<string>(profile.name ? `${profile.name}_Guest_WiFi` : 'Restaurant_Guest_WiFi');
  const [wifiPassword, setWifiPassword] = useState<string>('DineIn123');
  const [showWifiOnStandee, setShowWifiOnStandee] = useState<boolean>(true);
  const [standeeTheme, setStandeeTheme] = useState<'classic' | 'minimal' | 'dark'>('classic');
  const [copied, setCopied] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Persist tables to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pos_tables_list', JSON.stringify(tablesList));
    } catch (e) {
      // Ignore
    }
  }, [tablesList]);

  // Generate current ordering URL for the selected table
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const currentTableUrl = `${baseUrl}?table=${encodeURIComponent(selectedTable)}`;

  // Generate QR Code image when selectedTable changes
  useEffect(() => {
    if (!selectedTable) return;
    
    QRCode.toDataURL(currentTableUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: standeeTheme === 'dark' ? '#fbbf24' : '#0f172a',
        light: standeeTheme === 'dark' ? '#020617' : '#ffffff',
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
  }, [selectedTable, currentTableUrl, standeeTheme]);

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const formatted = newTableName.trim();
    if (!tablesList.includes(formatted)) {
      const updated = [...tablesList, formatted];
      setTablesList(updated);
      setSelectedTable(formatted);
    }
    setNewTableName('');
  };

  const handleDeleteTable = (tbl: string) => {
    if (tablesList.length <= 1) return;
    const updated = tablesList.filter(t => t !== tbl);
    setTablesList(updated);
    if (selectedTable === tbl) {
      setSelectedTable(updated[0]);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentTableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${profile.name.replace(/\s+/g, '_')}_${selectedTable.replace(/\s+/g, '_')}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintSingleStandee = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table Standee - ${selectedTable} - ${profile.name}</title>
          <style>
            @page { size: auto; margin: 15mm; }
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
              margin-bottom: 16px;
            }
            .table-badge {
              display: inline-block;
              background: #0f172a;
              color: #fbbf24;
              font-weight: 800;
              font-size: 15px;
              padding: 6px 18px;
              border-radius: 12px;
              margin-bottom: 16px;
              text-transform: uppercase;
            }
            .qr-wrap {
              background: #f8fafc;
              border: 1px dashed #cbd5e1;
              padding: 12px;
              border-radius: 18px;
              display: inline-block;
              margin-bottom: 16px;
            }
            .qr-img {
              width: 220px;
              height: 220px;
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
              margin-bottom: 16px;
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
            <div class="table-badge">${selectedTable}</div>
            <div class="qr-wrap">
              <img src="${qrDataUrl}" class="qr-img" />
            </div>
            <div class="scan-instructions">📲 Scan with Camera to Order</div>
            <div class="sub-instructions">Browse digital menu, order food & get live bill</div>
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
      tablesList.map(async (tbl) => {
        const url = `${baseUrl}?table=${encodeURIComponent(tbl)}`;
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
              font-size: 12px;
              padding: 4px 14px;
              border-radius: 8px;
              margin: 8px 0;
              text-transform: uppercase;
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
              margin-bottom: 8px;
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
                <div class="table-badge">${tbl}</div>
                <img src="${qr}" class="qr-img" />
                <div class="scan-instructions">📲 Scan to Order from Table</div>
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

  // Calculate table active orders
  const getTableActiveOrder = (tbl: string) => {
    if (!tbl) return undefined;
    const cleanTbl = tbl.trim().toLowerCase();
    return orders.find(o => 
      o.tableNumber && o.tableNumber.trim().toLowerCase() === cleanTbl && 
      o.paymentStatus === 'pending' && 
      !o.isArchived
    );
  };

  const occupiedTablesCount = tablesList.filter(tbl => !!getTableActiveOrder(tbl)).length;

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
                Table QR Code Self-Ordering
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-full uppercase border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Self-Order System
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Guests scan table QR standees with their phone cameras to view the live digital menu, place food orders straight to KDS & POS, and check out without waiting for staff.
            </p>
          </div>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => onOpenCustomerView(selectedTable)}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer group"
          >
            <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Test Customer View ({selectedTable})</span>
          </button>

          <button
            type="button"
            onClick={handlePrintAllTables}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all border border-slate-700 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print All Standees ({tablesList.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Registered Tables</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{tablesList.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Dine-in Bills</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{occupiedTablesCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Selected Table Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${getTableActiveOrder(selectedTable) ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {getTableActiveOrder(selectedTable) ? 'Active Order In Progress' : 'Ready / Available'}
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Management & Live Standee Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Table Selector, Wi-Fi Setup & Standee Options */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Table Management Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <span>Dining Tables & Areas</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select a table to configure its QR standee, preview customer menu, or download codes.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {tablesList.length} Tables
              </span>
            </div>

            {/* Table Selection Pills */}
            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1 scrollbar-thin">
              {tablesList.map((tbl) => {
                const isSelected = selectedTable === tbl;
                const activeOrder = getTableActiveOrder(tbl);

                return (
                  <div
                    key={tbl}
                    className={`group relative flex items-center rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-amber-400 text-amber-400 dark:text-slate-950 border-slate-900 dark:border-amber-400 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedTable(tbl)}
                      className="px-3.5 py-2 text-xs font-black cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{tbl}</span>
                      {activeOrder && (
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400 dark:bg-slate-950 animate-ping' : 'bg-amber-500'}`} title="Has active pending order" />
                      )}
                    </button>

                    {/* Delete Custom Table button if more than 1 table */}
                    {tablesList.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(tbl);
                        }}
                        title={`Remove ${tbl}`}
                        className={`pr-2 pl-1 py-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer ${
                          isSelected ? 'text-slate-400 hover:text-red-400' : ''
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Custom Table Form */}
            <form onSubmit={handleAddTable} className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                placeholder="Add custom table (e.g. VIP Booth 1, Rooftop 4, Garden 2)..."
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-400/50 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Table
              </button>
            </form>
          </div>

          {/* Standee Customization & Guest Wi-Fi */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Wifi className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Guest Wi-Fi Details on Standee
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showWifiOnStandee}
                  onChange={(e) => setShowWifiOnStandee(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-400"
                />
                <span>Include on Standee</span>
              </label>
            </div>

            {showWifiOnStandee && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Wi-Fi Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="e.g. Cafe_Guest_5G"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Wi-Fi Password
                  </label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="e.g. DineIn123"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>
            )}

            {/* Standee Theme Style Selection */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                Standee Visual Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStandeeTheme('classic')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    standeeTheme === 'classic'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Classic Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => setStandeeTheme('minimal')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    standeeTheme === 'minimal'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Modern Minimal
                </button>
                <button
                  type="button"
                  onClick={() => setStandeeTheme('dark')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    standeeTheme === 'dark'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Luxury Dark Card
                </button>
              </div>
            </div>
          </div>

          {/* Instant Staff Alert Live Testing Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <BellRing className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Instant Staff Alert Dispatcher
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Test real-time buzzer & chime notifications for <span className="font-bold text-amber-600 dark:text-amber-400">{selectedTable}</span> across POS, KDS, & mobile
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onServiceRequest && onServiceRequest(selectedTable, 'waiter', 'Assistance needed')}
                className="p-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 flex flex-col items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
              >
                <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Call Waiter</span>
              </button>

              <button
                type="button"
                onClick={() => onServiceRequest && onServiceRequest(selectedTable, 'drink', 'Water refill / drinks')}
                className="p-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-700/60 rounded-xl text-xs font-bold text-blue-900 dark:text-blue-200 flex flex-col items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
              >
                <Wine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Water / Drinks</span>
              </button>

              <button
                type="button"
                onClick={() => onServiceRequest && onServiceRequest(selectedTable, 'bill', 'Bill & payment terminal')}
                className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 flex flex-col items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
              >
                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Request Bill</span>
              </button>

              <button
                type="button"
                onClick={() => onServiceRequest && onServiceRequest(selectedTable, 'cutlery', 'Extra napkins & cutlery')}
                className="p-2.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-300 dark:border-purple-700/60 rounded-xl text-xs font-bold text-purple-900 dark:text-purple-200 flex flex-col items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] shadow-2xs"
              >
                <Utensils className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Cutlery & Napkins</span>
              </button>
            </div>
          </div>

          {/* Direct Link & Integration Info */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Direct Web Ordering Link
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {selectedTable}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentTableUrl}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-mono truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live Table Standee Preview & Print/Export Actions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Standee Container */}
            <div className={`w-full max-w-[280px] rounded-3xl p-5 border-2 shadow-2xl relative transition-all duration-300 ${
              standeeTheme === 'dark'
                ? 'bg-slate-900 border-amber-400/60 text-white'
                : standeeTheme === 'minimal'
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-white border-slate-950 text-slate-900'
            }`}>
              
              {/* Standee Brand Header */}
              <div className="space-y-1 mb-3">
                <div className="w-7 h-7 mx-auto rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs mb-1">
                  <Utensils className="w-4 h-4" />
                </div>
                <h4 className={`font-black text-sm uppercase tracking-wider truncate ${
                  standeeTheme === 'dark' ? 'text-white' : 'text-slate-950'
                }`}>
                  {profile.name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {profile.tagline || 'Contactless Table Ordering'}
                </p>
              </div>

              {/* Table Number Pill */}
              <div className="inline-block px-4 py-1 rounded-xl bg-slate-950 text-amber-400 font-black text-xs uppercase tracking-widest shadow-xs mb-3 border border-amber-400/30">
                {selectedTable}
              </div>

              {/* QR Code Container */}
              <div className={`p-3 rounded-2xl inline-block shadow-inner mb-3 border ${
                standeeTheme === 'dark'
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt={`QR for ${selectedTable}`} 
                    className="w-44 h-44 object-contain rounded-lg mx-auto"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-400">
                    <QrCode className="w-10 h-10 animate-spin" />
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="space-y-0.5 mb-3">
                <p className={`text-xs font-black flex items-center justify-center gap-1.5 ${
                  standeeTheme === 'dark' ? 'text-amber-400' : 'text-slate-950'
                }`}>
                  <span>📲 Scan with Camera to Order</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Instant digital menu & live bill tracking
                </p>
              </div>

              {/* Wi-Fi Footnote */}
              {showWifiOnStandee && wifiSsid && (
                <div className={`p-2 rounded-xl text-[10px] text-left border ${
                  standeeTheme === 'dark'
                    ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Free Wi-Fi:</span>
                    <span className="font-mono font-bold truncate max-w-[130px]">{wifiSsid}</span>
                  </div>
                  {wifiPassword && (
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-bold text-slate-500">Password:</span>
                      <span className="font-mono font-bold">{wifiPassword}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Print & Download Action Controls */}
            <div className="w-full max-w-[280px] grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={handlePrintSingleStandee}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Standee</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Save PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
