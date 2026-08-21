import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  DollarSign, 
  Percent, 
  Receipt, 
  FileText, 
  X, 
  Check, 
  RotateCcw, 
  Download, 
  Upload, 
  CreditCard,
  Cloud,
  RefreshCw,
  Database,
  Lock,
  Crown,
  Users,
  UserPlus,
  Sun,
  Moon,
  Monitor,
  Palette,
  Eye,
  EyeOff
} from 'lucide-react';
import { RestaurantProfile, StaffUser } from '../types';
import { defaultRestaurantProfile, defaultMenuItems, defaultBillOrders, defaultExpenses } from '../data/defaultData';
import { isAdminOrOwner } from '../utils/permissions';
import { AdminAuthModal } from './AdminAuthModal';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RestaurantProfile;
  currentUser?: StaffUser | null;
  onSaveProfile: (profile: RestaurantProfile) => void;
  onResetToDefaults: () => void;
  onExportAllData: () => void;
  onImportData: (data: any) => void;
  onSyncToCloud?: () => void;
  onClearAllCloudData?: () => void;
  onSeedSampleData?: () => void;
  onClearLocalCache?: () => void;
  isCloudSyncing?: boolean;
  onOpenStaffManagement?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentUser,
  onSaveProfile,
  onResetToDefaults,
  onExportAllData,
  onImportData,
  onSyncToCloud,
  onClearAllCloudData,
  onSeedSampleData,
  onClearLocalCache,
  isCloudSyncing,
  onOpenStaffManagement,
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const isAdmin = isAdminOrOwner(currentUser);
  const [form, setForm] = useState<RestaurantProfile>({ 
    ...profile,
    adminName: profile.adminName || 'Kuldeep Nawar',
    adminDesignation: profile.adminDesignation || 'Owner & General Manager',
    adminEmail: profile.adminEmail || profile.email || 'admin@bellavistakitchen.in',
    adminPhone: profile.adminPhone || profile.phone || '+91 98765 43210',
    adminPin: profile.adminPin || '8888',
  });
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isConfirmingCloudWipe, setIsConfirmingCloudWipe] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
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

  // Re-sync local form state whenever modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        ...profile,
        adminName: profile.adminName || 'Kuldeep Nawar',
        adminDesignation: profile.adminDesignation || 'Owner & General Manager',
        adminEmail: profile.adminEmail || profile.email || 'admin@bellavistakitchen.in',
        adminPhone: profile.adminPhone || profile.phone || '+91 98765 43210',
        adminPin: profile.adminPin || '8888',
      });
      setShowAdminPin(false);
      setIsConfirmingReset(false);
      setIsConfirmingCloudWipe(false);
      setImportStatus(null);
    }
  }, [isOpen, profile]);

  const handleChange = (field: keyof RestaurantProfile, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleBankChange = (field: string, val: string) => {
    setForm(prev => ({
      ...prev,
      bankDetails: {
        ...(prev.bankDetails || { bankName: '', accountName: '', accountNumber: '', routingOrIfsc: '' }),
        [field]: val,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin) {
      onSaveProfile(form);
      onClose();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        title: 'Admin Authorization: Save Settings',
        description: 'Only Admin and Owner accounts can modify restaurant tax, profile, and payment settings. Enter Admin Master PIN to authorize.',
        onSuccess: () => {
          onSaveProfile(form);
          onClose();
        },
      });
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const performImport = () => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const json = JSON.parse(evt.target?.result as string);
          onImportData(json);
          setImportStatus("Database restored successfully!");
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1200);
        } catch {
          setImportStatus("Error: Invalid JSON backup file.");
        }
      };
      reader.readAsText(file);
    };

    if (isAdmin) {
      performImport();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        title: 'Admin Authorization: Restore Database Backup',
        description: 'Restoring a database replaces current restaurant data. Enter Admin Master PIN to authorize.',
        onSuccess: performImport,
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="settings-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div 
            key="settings-modal-dialog"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">Restaurant & Cloud Database Settings</h3>
                  <p className="text-xs text-slate-400">Manage business branding, appearance themes, tax rates & storage</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="text-slate-400 hover:text-white p-1 cursor-pointer rounded-lg hover:bg-slate-800/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Display & Appearance (Theme Toggle) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-500" /> System Appearance & Color Theme
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Active: <strong className="text-amber-500 capitalize">{theme}</strong> ({isDark ? 'Dark Mode' : 'Light Mode'})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 border-amber-500 shadow-md ring-2 ring-amber-400/40 font-bold'
                    : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="text-left w-full text-center">
                  <p className="text-xs font-bold">Light Theme</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Crisp high-contrast</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-950 text-white border-amber-500 shadow-md ring-2 ring-amber-400/40 font-bold'
                    : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="text-left w-full text-center">
                  <p className="text-xs font-bold">Dark Theme</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Night & low-light POS</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-400/40 font-black'
                    : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-2xs">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="text-left w-full text-center">
                  <p className="text-xs font-bold">Auto System</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Sync with device OS</p>
                </div>
              </button>
            </div>
          </div>
          
          {/* Google Cloud Database Banner */}
          <div className="p-4 bg-emerald-950/10 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">Google Cloud Firestore Database</span>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-full font-bold text-[10px]">
                  Connected
                </span>
              </div>

              {onSyncToCloud && (
                <button
                  type="button"
                  onClick={onSyncToCloud}
                  disabled={isCloudSyncing}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  <span>{isCloudSyncing ? 'Syncing...' : 'Sync All to Cloud DB'}</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              All menu items, POS bills, invoices, expenses, categories, and business profile are stored in Google Cloud Firestore in real time.
            </p>
          </div>

          {/* Business Info */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" /> General Restaurant Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Admin & Owner Details */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Admin & Proprietor Details
              </h4>
              {onOpenStaffManagement && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStaffManagement();
                  }}
                  className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Users className="w-3 h-3" />
                  <span>Manage Staff Roster & Register</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Admin / Owner Full Name</label>
                <input
                  type="text"
                  value={form.adminName || ''}
                  onChange={(e) => handleChange('adminName', e.target.value)}
                  placeholder="e.g. Kuldeep Nawar"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Designation / Role Title</label>
                <input
                  type="text"
                  value={form.adminDesignation || ''}
                  onChange={(e) => handleChange('adminDesignation', e.target.value)}
                  placeholder="e.g. Owner & General Manager"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Admin Direct Phone</label>
                <input
                  type="tel"
                  value={form.adminPhone || ''}
                  onChange={(e) => handleChange('adminPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Admin Business Email</label>
                <input
                  type="email"
                  value={form.adminEmail || ''}
                  onChange={(e) => handleChange('adminEmail', e.target.value)}
                  placeholder="admin@restaurant.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-amber-800 dark:text-amber-400">
                    Admin Master Authorization PIN (4-Digits)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAdminPin(prev => !prev)}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {showAdminPin ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide PIN</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Show PIN</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAdminPin ? "text" : "password"}
                    maxLength={6}
                    value={form.adminPin || '8888'}
                    onChange={(e) => handleChange('adminPin', e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 pr-10 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-lg font-mono font-bold tracking-widest text-amber-900 dark:text-amber-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPin(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tax & Currency */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Tax, GST & Financials
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={form.currencySymbol}
                  onChange={(e) => handleChange('currencySymbol', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={form.currencyCode}
                  onChange={(e) => handleChange('currencyCode', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono uppercase text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Default Tax (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.defaultTaxRate}
                  onChange={(e) => handleChange('defaultTaxRate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Service Charge (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.defaultServiceCharge}
                  onChange={(e) => handleChange('defaultServiceCharge', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tax ID / GSTIN / VAT Number</label>
                <input
                  type="text"
                  value={form.taxId}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={form.invoicePrefix}
                  onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Receipt Prefix</label>
                <input
                  type="text"
                  value={form.receiptPrefix}
                  onChange={(e) => handleChange('receiptPrefix', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Bank / Settlement Details */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Bank & UPI Settlement Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={form.bankDetails?.bankName || ''}
                  onChange={(e) => handleBankChange('bankName', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Account Name</label>
                <input
                  type="text"
                  value={form.bankDetails?.accountName || ''}
                  onChange={(e) => handleBankChange('accountName', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number / IBAN</label>
                <input
                  type="text"
                  value={form.bankDetails?.accountNumber || ''}
                  onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">IFSC / Swift / Routing Code</label>
                <input
                  type="text"
                  value={form.bankDetails?.routingOrIfsc || ''}
                  onChange={(e) => handleBankChange('routingOrIfsc', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono uppercase text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Receipt Footer Message & Terms */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Invoice Footers & Disclaimers
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Thermal Receipt Footer Message</label>
                <input
                  type="text"
                  value={form.receiptFooterMessage}
                  onChange={(e) => handleChange('receiptFooterMessage', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">B2B & Catering Invoice Payment Terms</label>
                <textarea
                  rows={2}
                  value={form.invoiceTerms}
                  onChange={(e) => handleChange('invoiceTerms', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Google Cloud Online Database Management */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Google Cloud Firestore Online Database
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Online Sync
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Your restaurant billing data is connected directly to Google Cloud Firestore in real-time. Changes across all staff terminals and customer QR codes sync live without relying on local storage.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {onSyncToCloud && (
                <button
                  type="button"
                  onClick={onSyncToCloud}
                  disabled={isCloudSyncing}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  {isCloudSyncing ? 'Syncing to Cloud...' : 'Sync All Data to Cloud'}
                </button>
              )}

              {onSeedSampleData && (
                <button
                  type="button"
                  onClick={onSeedSampleData}
                  disabled={isCloudSyncing}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" /> Seed Sample Menu to Cloud
                </button>
              )}

              {onClearLocalCache && (
                <button
                  type="button"
                  onClick={onClearLocalCache}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear Local Cache
                </button>
              )}

              {onClearAllCloudData && (
                <>
                  {!isConfirmingCloudWipe ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (isAdmin) {
                          setIsConfirmingCloudWipe(true);
                        } else {
                          setAdminAuthPrompt({
                            isOpen: true,
                            title: 'Admin Authorization: Clear Cloud Data',
                            description: 'Wiping cloud collections removes all live online menu, orders, and expenses. Enter Admin Master PIN to authorize.',
                            onSuccess: () => setIsConfirmingCloudWipe(true),
                          });
                        }
                      }}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 rounded-lg font-bold text-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Wipe Online Cloud Data
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 ml-auto bg-red-100 dark:bg-red-950/60 p-1.5 rounded-lg border border-red-300 dark:border-red-700">
                      <span className="text-[11px] font-bold text-red-800 dark:text-red-300">Wipe cloud database?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onClearAllCloudData();
                          setIsConfirmingCloudWipe(false);
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        Yes, Wipe Cloud
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingCloudWipe(false)}
                        className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Backup & Restore Tools */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Data Management & Backup
            </h4>

            {importStatus && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                importStatus.startsWith('Error') ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}>
                {importStatus}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onExportAllData}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export JSON Backup
              </button>

              <label className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Import JSON Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>

              {!isConfirmingReset ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isAdmin) {
                      setIsConfirmingReset(true);
                    } else {
                      setAdminAuthPrompt({
                        isOpen: true,
                        title: 'Admin Authorization: Reset Database',
                        description: 'Resetting the database to defaults will wipe current orders and data. Enter Admin Master PIN to authorize.',
                        onSuccess: () => setIsConfirmingReset(true),
                      });
                    }
                  }}
                  className="px-3 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 rounded-lg font-semibold text-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to Sample Data
                </button>
              ) : (
                <div className="flex items-center gap-1.5 ml-auto bg-red-100 dark:bg-red-950/60 p-1.5 rounded-lg border border-red-300 dark:border-red-700">
                  <span className="text-[11px] font-bold text-red-800 dark:text-red-300">Confirm reset?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetToDefaults();
                      setIsConfirmingReset(false);
                      onClose();
                    }}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer"
                  >
                    Yes, Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingReset(false)}
                    className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              {!isAdmin && <Lock className="w-3.5 h-3.5 text-amber-400 dark:text-slate-950" />}
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
          </motion.div>

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
            adminPin={form.adminPin || profile.adminPin}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
