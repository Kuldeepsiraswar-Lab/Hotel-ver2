import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Percent, 
  Receipt, 
  X, 
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
  EyeOff,
  SlidersHorizontal,
  KeyRound,
  HardDrive,
  Trash2,
  Edit3,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Search,
  Sparkles
} from 'lucide-react';
import { RestaurantProfile, StaffUser, StaffRole } from '../types';
import { isAdminOrOwner } from '../utils/permissions';
import { AdminAuthModal } from './AdminAuthModal';
import { useTheme } from '../context/ThemeContext';

export type SettingsChipTab = 
  | 'all'
  | 'general'
  | 'tax_gst'
  | 'staff_roster'
  | 'admin_props'
  | 'appearance'
  | 'bank_details'
  | 'invoice_footer'
  | 'cloud_db'
  | 'data_backup';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RestaurantProfile;
  currentUser?: StaffUser | null;
  staffList?: StaffUser[];
  onSaveStaff?: (staff: StaffUser) => void;
  onDeleteStaff?: (staffId: string) => void;
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
  initialTab?: SettingsChipTab;
}

const ROLE_BADGES: Record<StaffRole, { label: string; color: string }> = {
  owner: { label: 'Owner / Admin', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  manager: { label: 'Manager', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  cashier: { label: 'Cashier', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  waiter: { label: 'Waiter', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  kitchen: { label: 'Kitchen / Chef', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentUser,
  staffList = [],
  onSaveStaff,
  onDeleteStaff,
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
  initialTab = 'general',
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const isAdmin = isAdminOrOwner(currentUser);

  // Active Chip Navigation Tab
  const [activeChip, setActiveChip] = useState<SettingsChipTab>(initialTab);

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

  // Inline Staff Roster State
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState<{
    displayName: string;
    role: StaffRole;
    pin: string;
    email: string;
    phone: string;
    employeeCode: string;
  }>({
    displayName: '',
    role: 'waiter',
    pin: '',
    email: '',
    phone: '',
    employeeCode: '',
  });
  const [showNewStaffPin, setShowNewStaffPin] = useState(false);

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
      setIsAddingStaff(false);
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

  const handleTogglePinReveal = (staffId: string) => {
    setRevealedPins(prev => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  const handleCopyPin = (staffId: string, pin?: string) => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedPinId(staffId);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const handleCreateStaffInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.displayName.trim() || !newStaffForm.pin.trim() || newStaffForm.pin.length < 4) {
      return;
    }

    const createdStaff: StaffUser = {
      id: `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      displayName: newStaffForm.displayName.trim(),
      role: newStaffForm.role,
      pin: newStaffForm.pin.trim(),
      email: newStaffForm.email.trim() || `${newStaffForm.displayName.toLowerCase().replace(/\s+/g, '.')}@restaurant.pos`,
      phone: newStaffForm.phone.trim() || undefined,
      employeeCode: newStaffForm.employeeCode.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    if (onSaveStaff) {
      onSaveStaff(createdStaff);
    }

    // Reset form
    setNewStaffForm({
      displayName: '',
      role: 'waiter',
      pin: '',
      email: '',
      phone: '',
      employeeCode: '',
    });
    setIsAddingStaff(false);
  };

  // Filtered staff list for search
  const filteredStaff = staffList.filter(s => {
    if (!staffSearchQuery.trim()) return true;
    const q = staffSearchQuery.trim().toLowerCase();
    return (
      (s.displayName && s.displayName.toLowerCase().includes(q)) ||
      (s.role && s.role.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.employeeCode && s.employeeCode.toLowerCase().includes(q))
    );
  });

  // Navigation chips definition
  const CHIP_ITEMS: { id: SettingsChipTab; label: string; icon: React.FC<{ className?: string }>; badge?: string | number; accentColor: string }[] = [
    { id: 'all', label: 'All Settings', icon: SlidersHorizontal, accentColor: 'border-slate-500 text-slate-400' },
    { id: 'general', label: 'General Details', icon: Building2, accentColor: 'border-amber-500 text-amber-400' },
    { id: 'tax_gst', label: 'Tax & GST', icon: Percent, accentColor: 'border-blue-500 text-blue-400' },
    { id: 'staff_roster', label: 'Staff Roster', icon: Users, badge: staffList.length, accentColor: 'border-emerald-500 text-emerald-400' },
    { id: 'admin_props', label: 'Admin Properties', icon: Crown, accentColor: 'border-purple-500 text-purple-400' },
    { id: 'appearance', label: 'System Appearance', icon: Palette, accentColor: 'border-pink-500 text-pink-400' },
    { id: 'bank_details', label: 'Bank Details', icon: CreditCard, accentColor: 'border-teal-500 text-teal-400' },
    { id: 'invoice_footer', label: 'Invoice Footer', icon: Receipt, accentColor: 'border-orange-500 text-orange-400' },
    { id: 'cloud_db', label: 'Cloud Database', icon: Cloud, badge: 'Live', accentColor: 'border-emerald-500 text-emerald-400' },
    { id: 'data_backup', label: 'Data & Backup', icon: HardDrive, accentColor: 'border-indigo-500 text-indigo-400' },
  ];

  const shouldShowSection = (sectionKey: SettingsChipTab) => {
    return activeChip === 'all' || activeChip === sectionKey;
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div 
            key="settings-modal-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <span>Restaurant Configuration</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-amber-400 border border-slate-700">
                      Settings Hub
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Manage staff roster, tax rates, business profile, themes & cloud storage</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="text-slate-400 hover:text-white p-2 cursor-pointer rounded-xl hover:bg-slate-800/80 transition-colors"
                title="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chip Navigation Bar (Horizontal Scrollable Pills) */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                {CHIP_ITEMS.map((chip) => {
                  const Icon = chip.icon;
                  const isActive = activeChip === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setActiveChip(chip.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer select-none shrink-0 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20 ring-2 ring-amber-400/50'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'}`} />
                      <span>{chip.label}</span>
                      {chip.badge !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${
                          isActive
                            ? 'bg-slate-950 text-amber-400'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {chip.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Form Content Area */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              
              {/* 1. GENERAL RESTAURANT DETAILS */}
              {shouldShowSection('general') && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/50">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span>General Restaurant Details</span>
                    </h4>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Header & Invoice Branding</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Restaurant Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline / Subtitle</label>
                      <input
                        type="text"
                        value={form.tagline}
                        onChange={(e) => handleChange('tagline', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Physical Address / Outlet Location</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Phone Number</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Official Email Address</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. TAX & GST SETTINGS */}
              {shouldShowSection('tax_gst') && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/50">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                        <Percent className="w-4 h-4" />
                      </div>
                      <span>Tax, GST & Billing Calculation Rates</span>
                    </h4>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Automated POS Rates</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Currency Symbol</label>
                      <input
                        type="text"
                        value={form.currencySymbol}
                        onChange={(e) => handleChange('currencySymbol', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Currency Code</label>
                      <input
                        type="text"
                        value={form.currencyCode}
                        onChange={(e) => handleChange('currencyCode', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Default Tax / GST (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={form.defaultTaxRate}
                        onChange={(e) => handleChange('defaultTaxRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Service Charge (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={form.defaultServiceCharge}
                        onChange={(e) => handleChange('defaultServiceCharge', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tax ID / GSTIN / VAT Number</label>
                      <input
                        type="text"
                        value={form.taxId}
                        onChange={(e) => handleChange('taxId', e.target.value)}
                        placeholder="e.g. 27AABCU9603R1ZM"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Prefix</label>
                      <input
                        type="text"
                        value={form.invoicePrefix}
                        onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                        placeholder="INV-"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Receipt Prefix</label>
                      <input
                        type="text"
                        value={form.receiptPrefix}
                        onChange={(e) => handleChange('receiptPrefix', e.target.value)}
                        placeholder="REC-"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. STAFF ROSTER & EMPLOYEE PIN ACCOUNTS */}
              {shouldShowSection('staff_roster') && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/50 flex-wrap gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <span>Staff Roster & Employee Accounts ({staffList.length})</span>
                    </h4>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingStaff(prev => !prev)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{isAddingStaff ? 'Cancel Form' : 'Add New Staff'}</span>
                      </button>

                      {onOpenStaffManagement && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenStaffManagement();
                          }}
                          className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Full Manager</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Add Staff Form */}
                  {isAddingStaff && (
                    <div className="p-3.5 bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <UserPlus className="w-3.5 h-3.5" /> Register New Employee Profile
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Sharma"
                            value={newStaffForm.displayName}
                            onChange={(e) => setNewStaffForm(prev => ({ ...prev, displayName: e.target.value }))}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Station Role *</label>
                          <select
                            value={newStaffForm.role}
                            onChange={(e) => setNewStaffForm(prev => ({ ...prev, role: e.target.value as StaffRole }))}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white cursor-pointer"
                          >
                            <option value="owner">Owner / Master Admin</option>
                            <option value="manager">Floor Manager</option>
                            <option value="cashier">Counter Cashier</option>
                            <option value="waiter">Server / Waiter</option>
                            <option value="kitchen">Kitchen / Chef</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Login PIN (4-Digits) *</label>
                          <div className="relative">
                            <input
                              type={showNewStaffPin ? "text" : "password"}
                              maxLength={6}
                              placeholder="••••"
                              value={newStaffForm.pin}
                              onChange={(e) => setNewStaffForm(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
                              className="w-full px-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewStaffPin(prev => !prev)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showNewStaffPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Employee Code</label>
                          <input
                            type="text"
                            placeholder="EMP-101"
                            value={newStaffForm.employeeCode}
                            onChange={(e) => setNewStaffForm(prev => ({ ...prev, employeeCode: e.target.value }))}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone (Optional)</label>
                          <input
                            type="tel"
                            placeholder="+91 98765 00000"
                            value={newStaffForm.phone}
                            onChange={(e) => setNewStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={handleCreateStaffInline}
                            disabled={!newStaffForm.displayName.trim() || newStaffForm.pin.length < 4}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Save to Roster</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Staff Filter Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search roster by staff name, role, or code..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* Staff Table / List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredStaff.map((staff) => {
                      const badge = ROLE_BADGES[staff.role] || { label: staff.role, color: 'bg-slate-700 text-slate-300' };
                      const isRevealed = revealedPins[staff.id];
                      return (
                        <div
                          key={staff.id}
                          className="p-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center text-xs shrink-0">
                              {staff.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white truncate">{staff.displayName}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold border ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                {staff.employeeCode || staff.email || 'No email'} {staff.phone ? `• ${staff.phone}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* PIN pill */}
                            <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              <KeyRound className="w-3 h-3 text-amber-500" />
                              <span className="font-mono font-bold text-xs tracking-wider text-slate-800 dark:text-slate-200">
                                {isRevealed ? (staff.pin || '••••') : '••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleTogglePinReveal(staff.id)}
                                className="text-slate-400 hover:text-amber-500 cursor-pointer ml-1"
                                title={isRevealed ? "Hide PIN" : "Show PIN"}
                              >
                                {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyPin(staff.id, staff.pin)}
                                className="text-slate-400 hover:text-emerald-500 cursor-pointer"
                                title="Copy PIN"
                              >
                                {copiedPinId === staff.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>

                            {/* Delete staff button */}
                            {onDeleteStaff && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Remove staff member ${staff.displayName}?`)) {
                                    onDeleteStaff(staff.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                                title="Remove from roster"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {filteredStaff.length === 0 && (
                      <div className="text-center py-4 text-xs text-slate-400">
                        No staff members match the current search filter.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. ADMIN & PROPRIETOR PROPERTIES */}
              {shouldShowSection('admin_props') && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/50">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg">
                        <Crown className="w-4 h-4" />
                      </div>
                      <span>Admin & Proprietor Properties</span>
                    </h4>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Master Authorization & Identity</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Admin / Owner Full Name</label>
                      <input
                        type="text"
                        value={form.adminName || ''}
                        onChange={(e) => handleChange('adminName', e.target.value)}
                        placeholder="Kuldeep Nawar"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Designation / Role Title</label>
                      <input
                        type="text"
                        value={form.adminDesignation || ''}
                        onChange={(e) => handleChange('adminDesignation', e.target.value)}
                        placeholder="Owner & General Manager"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Admin Direct Phone</label>
                      <input
                        type="tel"
                        value={form.adminPhone || ''}
                        onChange={(e) => handleChange('adminPhone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Admin Business Email</label>
                      <input
                        type="email"
                        value={form.adminEmail || ''}
                        onChange={(e) => handleChange('adminEmail', e.target.value)}
                        placeholder="admin@restaurant.com"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-amber-900 dark:text-amber-300 text-xs flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                          <span>Admin Master Authorization PIN (4-Digits)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowAdminPin(prev => !prev)}
                          className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {showAdminPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showAdminPin ? 'Hide PIN' : 'Show PIN'}</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showAdminPin ? "text" : "password"}
                          maxLength={6}
                          value={form.adminPin || '8888'}
                          onChange={(e) => handleChange('adminPin', e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full px-3 pr-10 py-2 bg-white dark:bg-slate-900 border border-amber-400/50 dark:border-amber-700/60 rounded-xl font-mono font-bold tracking-widest text-amber-900 dark:text-amber-300 focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Used to authorize manager overrides, discount voids, clearing cloud collections, and restoring database backups.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. SYSTEM APPEARANCE & THEME */}
              {shouldShowSection('appearance') && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/50">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 bg-pink-500/10 text-pink-500 rounded-lg">
                        <Palette className="w-4 h-4" />
                      </div>
                      <span>System Appearance & Color Theme</span>
                    </h4>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      Active: <strong className="text-amber-500 capitalize">{theme}</strong> ({isDark ? 'Dark Mode' : 'Light Mode'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'bg-white text-slate-900 border-amber-500 shadow-md ring-2 ring-amber-400/40 font-bold'
                          : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold">Light Theme</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Crisp high-contrast day mode</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-slate-950 text-white border-amber-500 shadow-md ring-2 ring-amber-400/40 font-bold'
                          : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold">Dark Theme</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Night & ambient low-light POS</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        theme === 'system'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-400/40 font-black'
                          : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold">Auto System</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Sync with device OS preferences</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* 6. BANK DETAILS & SETTLEMENT */}
              {shouldShowSection('bank_details') && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/50">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 bg-teal-500/10 text-teal-500 rounded-lg">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <span>Bank & Settlement Details</span>
                    </h4>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Printed on B2B Invoices</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={form.bankDetails?.bankName || ''}
                        onChange={(e) => handleBankChange('bankName', e.target.value)}
                        placeholder="e.g. HDFC Bank / Chase Bank"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Account Holder / Beneficiary Name</label>
                      <input
                        type="text"
                        value={form.bankDetails?.accountName || ''}
                        onChange={(e) => handleBankChange('accountName', e.target.value)}
                        placeholder="e.g. Bella Vista Kitchens Pvt Ltd"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number / IBAN</label>
                      <input
                        type="text"
                        value={form.bankDetails?.accountNumber || ''}
                        onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                        placeholder="50200012345678"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">IFSC / Swift / Routing Code</label>
                      <input
                        type="text"
                        value={form.bankDetails?.routingOrIfsc || ''}
                        onChange={(e) => handleBankChange('routingOrIfsc', e.target.value)}
                        placeholder="HDFC0001234"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 7. INVOICE FOOTERS & DISCLAIMERS */}
              {shouldShowSection('invoice_footer') && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/50">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 bg-orange-500/10 text-orange-500 rounded-lg">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <span>Invoice Footers & Disclaimers</span>
                    </h4>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Thermal Slip & B2B Terms</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Thermal Receipt Footer Message</label>
                      <input
                        type="text"
                        value={form.receiptFooterMessage}
                        onChange={(e) => handleChange('receiptFooterMessage', e.target.value)}
                        placeholder="Thank you for dining with us! Please visit again."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">B2B & Catering Invoice Payment Terms & Policies</label>
                      <textarea
                        rows={2}
                        value={form.invoiceTerms}
                        onChange={(e) => handleChange('invoiceTerms', e.target.value)}
                        placeholder="Payment due within 15 days of invoice date. 18% p.a. interest applicable on overdue accounts."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 8. GOOGLE CLOUD DATABASE */}
              {shouldShowSection('cloud_db') && (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/50 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800/40">
                    <h4 className="font-bold text-emerald-950 dark:text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                        <Cloud className="w-4 h-4" />
                      </div>
                      <span>Google Cloud Firestore Online Database</span>
                    </h4>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Online Sync
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    All menu items, POS bills, invoices, expenses, categories, and staff profiles are synchronized in Google Cloud Firestore in real time.
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    {onSyncToCloud && (
                      <button
                        type="button"
                        onClick={onSyncToCloud}
                        disabled={isCloudSyncing}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                        <span>{isCloudSyncing ? 'Syncing to Cloud...' : 'Sync All Data to Cloud'}</span>
                      </button>
                    )}

                    {onSeedSampleData && (
                      <button
                        type="button"
                        onClick={onSeedSampleData}
                        disabled={isCloudSyncing}
                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>Seed Sample Menu to Cloud</span>
                      </button>
                    )}

                    {onClearLocalCache && (
                      <button
                        type="button"
                        onClick={onClearLocalCache}
                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Clear Local Cache</span>
                      </button>
                    )}

                    {onClearAllCloudData && (
                      <div className="ml-auto">
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
                            className="px-3 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Wipe Online Cloud Data</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-950/80 p-1.5 rounded-xl border border-red-300 dark:border-red-700">
                            <span className="text-[11px] font-bold text-red-800 dark:text-red-300">Wipe cloud DB?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onClearAllCloudData();
                                setIsConfirmingCloudWipe(false);
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Yes, Wipe
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsConfirmingCloudWipe(false)}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 9. DATA MANAGEMENT & BACKUP */}
              {shouldShowSection('data_backup') && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/50">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <span>Data Management, JSON Backups & Reset</span>
                    </h4>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Offline & JSON Archives</span>
                  </div>

                  {importStatus && (
                    <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                      importStatus.startsWith('Error') ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      {importStatus}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={onExportAllData}
                      className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-500" />
                      <span>Export Complete JSON Backup</span>
                    </button>

                    <label className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      <span>Restore JSON Backup</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="hidden"
                      />
                    </label>

                    <div className="ml-auto">
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
                                description: 'Resetting the database to defaults will wipe current orders and restore default sample dishes. Enter Admin Master PIN to authorize.',
                                onSuccess: () => setIsConfirmingReset(true),
                              });
                            }
                          }}
                          className="px-3.5 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset to Sample Defaults</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-950/80 p-1.5 rounded-xl border border-red-300 dark:border-red-700">
                          <span className="text-[11px] font-bold text-red-800 dark:text-red-300">Confirm reset?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onResetToDefaults();
                              setIsConfirmingReset(false);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Yes, Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsConfirmingReset(false)}
                            className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    {!isAdmin && <Lock className="w-3.5 h-3.5 text-slate-950" />}
                    <Check className="w-4 h-4" />
                    <span>Save Restaurant Profile</span>
                  </button>
                </div>
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
