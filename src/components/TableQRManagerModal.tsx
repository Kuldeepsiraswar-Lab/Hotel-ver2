import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Plus, 
  Sparkles, 
  Wifi, 
  Utensils, 
  Layers, 
  Smartphone,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';
import { RestaurantProfile } from '../types';

interface TableQRManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RestaurantProfile;
  onOpenCustomerView: (tableNumber: string) => void;
}

const DEFAULT_TABLES = [
  'Table 1', 'Table 2', 'Table 3', 'Table 4', 
  'Table 5', 'Table 6', 'Table 7', 'Table 8',
  'Bar 1', 'Bar 2', 'Patio 1', 'Patio 2'
];

export const TableQRManagerModal: React.FC<TableQRManagerModalProps> = ({
  isOpen,
  onClose,
  profile,
  onOpenCustomerView,
}) => {
  const [tablesList, setTablesList] = useState<string[]>(DEFAULT_TABLES);
  const [selectedTable, setSelectedTable] = useState<string>('Table 1');
  const [newTableName, setNewTableName] = useState<string>('');
  const [wifiSsid, setWifiSsid] = useState<string>(profile.name ? `${profile.name}_Guest_WiFi` : 'Restaurant_Guest_WiFi');
  const [wifiPassword, setWifiPassword] = useState<string>('DineIn123');
  const [showWifiOnStandee, setShowWifiOnStandee] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate current ordering URL for the selected table
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const currentTableUrl = `${baseUrl}?table=${encodeURIComponent(selectedTable)}`;

  // Generate QR Code image when selectedTable changes
  useEffect(() => {
    if (!selectedTable) return;
    
    QRCode.toDataURL(currentTableUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
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
  }, [selectedTable, currentTableUrl]);

  if (!isOpen) return null;

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const formatted = newTableName.trim();
    if (!tablesList.includes(formatted)) {
      setTablesList(prev => [...prev, formatted]);
      setSelectedTable(formatted);
    }
    setNewTableName('');
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
              font-size: 14px;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-linear-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-2xl shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Table QR Code Ordering Suite</h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] rounded-full uppercase border border-emerald-500/40">
                  Live Cloud Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Customers scan the table standee with their phone camera to browse and order directly to POS & Kitchen
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50 dark:bg-slate-950/60">
          
          {/* Left Column: Table List & Settings */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Table Selection Grid */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Select Dining Table / Area
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {tablesList.length} Tables Registered
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                {tablesList.map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => setSelectedTable(tbl)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedTable === tbl
                        ? 'bg-slate-900 dark:bg-amber-400 text-amber-400 dark:text-slate-950 shadow-sm ring-2 ring-amber-400/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
              </div>

              {/* Add Custom Table Form */}
              <form onSubmit={handleAddTable} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Add custom (e.g. VIP Booth 1, Rooftop 4)..."
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-slate-900 dark:focus:ring-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>
            </div>

            {/* Standee Wi-Fi Info Settings */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Guest Wi-Fi on Table Standee
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={showWifiOnStandee}
                    onChange={(e) => setShowWifiOnStandee(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-amber-400 focus:ring-0"
                  />
                  <span>Show on Standee</span>
                </label>
              </div>

              {showWifiOnStandee && (
                <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Wi-Fi Name (SSID)</span>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Password</span>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Direct Link & Simulator Box */}
            <div className="bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/30 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold text-xs">
                  <Smartphone className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>Customer Ordering Link for {selectedTable}</span>
                </div>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full">
                  Instant Test
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentTableUrl}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-500/30 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-amber-300 dark:border-amber-500/30 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCustomerView(selectedTable);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Utensils className="w-4 h-4" />
                <span>Test Live Order as Customer at {selectedTable}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Table Standee Preview & Actions */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
            
            {/* Standee Preview Card */}
            <div className="w-full max-w-xs bg-white border-2 border-slate-900 dark:border-slate-700 rounded-3xl p-5 text-center shadow-xl space-y-3 relative">
              <div className="absolute top-3 right-3 text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Standee
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide line-clamp-1">{profile.name}</h3>
                <p className="text-[10px] text-slate-500">{profile.tagline || 'Contactless Table Ordering'}</p>
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-slate-900 text-amber-400 font-extrabold text-xs rounded-xl shadow-xs">
                  {selectedTable}
                </span>
              </div>

              {/* QR Image Box */}
              <div className="bg-slate-50 border border-dashed border-slate-200 p-2.5 rounded-2xl inline-block">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${selectedTable}`}
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
                <p className="text-[10px] text-slate-500">Live menu, special requests & bill updates</p>
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

            {/* Print & Export Buttons */}
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
                  <span>Save QR (PNG)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrintAllTables}
                className="w-full py-2.5 bg-linear-to-r from-amber-500 to-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Batch Print All {tablesList.length} Table Standees</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
