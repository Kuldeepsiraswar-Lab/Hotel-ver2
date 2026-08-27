import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  Users, 
  Crown, 
  Phone, 
  Mail, 
  KeyRound, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  User, 
  Search, 
  Save,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldAlert,
  Monitor,
  LayoutGrid,
  Settings2,
  Flame,
  Receipt,
  QrCode,
  ChefHat,
  FileText,
  TrendingDown,
  TrendingUp,
  BarChart3,
  SlidersHorizontal,
  RotateCcw,
  CheckSquare,
  Square,
  Tv,
  Sparkles,
  Shield,
  Settings as SettingsIcon,
  ChevronRight,
  Info
} from 'lucide-react';
import { RestaurantProfile, StaffUser, StaffRole, AppModule, StaffPermissions, StationPreset } from '../types';
import { 
  isAdminOrOwner, 
  APP_MODULES, 
  STATION_PRESETS, 
  getDefaultModulesForRole, 
  getDefaultPermissionsForRole,
  ModuleMeta
} from '../utils/permissions';
import { AdminAuthModal } from './AdminAuthModal';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffUser[];
  profile: RestaurantProfile;
  currentUser: StaffUser | null;
  onSaveStaff: (staff: StaffUser) => void;
  onDeleteStaff: (staffId: string) => void;
  onSaveProfile: (profile: RestaurantProfile) => void;
}

const ROLE_CONFIG: Record<StaffRole, { label: string; icon: string; badgeColor: string; desc: string; defaultStation: string; defaultStationCode: string }> = {
  owner: {
    label: 'Owner / Master Admin',
    icon: '👑',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    desc: 'Complete master privileges: full billing, data deletions, financial analytics, menu edits & settings.',
    defaultStation: 'Executive Back-Office & Master Desk',
    defaultStationCode: 'STN-ADM-01',
  },
  manager: {
    label: 'Floor Manager',
    icon: '📋',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    desc: 'Shift supervision, customer table assignment, discount approvals & daily billing operations.',
    defaultStation: 'Floor Supervisor & Manager Station',
    defaultStationCode: 'STN-MGR-01',
  },
  cashier: {
    label: 'Counter Cashier',
    icon: '💳',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    desc: 'Fast POS billing, generating invoices, receiving UPI/Card payments. Restricted from deleting records.',
    defaultStation: 'Counter POS Terminal #1',
    defaultStationCode: 'STN-POS-01',
  },
  waiter: {
    label: 'Server / Waiter',
    icon: '🍽️',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    desc: 'Table order punching, sending KOT to kitchen, customer servicing. View-only invoices.',
    defaultStation: 'Dining Floor Server Terminal',
    defaultStationCode: 'STN-FLR-01',
  },
  kitchen: {
    label: 'Kitchen / Chef',
    icon: '🔥',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    desc: 'Live Kitchen Order Display (KOT) station, marking dishes preparing & ready.',
    defaultStation: 'Main Kitchen KDS Line',
    defaultStationCode: 'STN-KIT-01',
  }
};

const MODULE_ICONS: Record<AppModule, React.FC<{ className?: string }>> = {
  dashboard: BarChart3,
  pos: Receipt,
  kitchen: Flame,
  tableqr: QrCode,
  menu: ChefHat,
  invoices: FileText,
  expenses: TrendingDown,
  financials: TrendingUp,
  settings: SettingsIcon,
  staff: Users,
};

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  staffList,
  profile,
  currentUser,
  onSaveStaff,
  onDeleteStaff,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'stations' | 'register' | 'admin_details'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('all');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  
  // Track revealed PINs per staff member in roster view (masked by default for security)
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Form PIN toggle visibility
  const [showFormPin, setShowFormPin] = useState<boolean>(false);
  const [showAdminMasterPin, setShowAdminMasterPin] = useState<boolean>(false);

  // Registration / Edit Form State
  const [formData, setFormData] = useState<{
    id: string;
    displayName: string;
    role: StaffRole;
    email: string;
    phone: string;
    pin: string;
    employeeCode: string;
    notes: string;
    status: 'active' | 'inactive';
    assignedStation: string;
    stationCode: string;
    allowedModules: AppModule[];
    permissions: StaffPermissions;
  }>({
    id: '',
    displayName: '',
    role: 'cashier',
    email: '',
    phone: '',
    pin: '',
    employeeCode: '',
    notes: '',
    status: 'active',
    assignedStation: 'Counter POS Terminal #1',
    stationCode: 'STN-POS-01',
    allowedModules: ['pos', 'invoices', 'dashboard', 'tableqr'],
    permissions: {
      canApplyDiscounts: true,
      canVoidCancelOrders: false,
      canModifyMenuPricing: false,
      canManageExpenses: false,
      canAccessFinancials: false,
      canManageStaffRoster: false,
      canAccessSystemSettings: false,
      canReprintInvoices: true,
    }
  });

  // Admin Profile Form State
  const [adminDetails, setAdminDetails] = useState({
    adminName: profile.adminName || 'Kuldeep Nawar',
    adminDesignation: profile.adminDesignation || 'Owner & General Manager',
    adminEmail: profile.adminEmail || profile.email || 'admin@restaurant.com',
    adminPhone: profile.adminPhone || profile.phone || '+91 98765 43210',
    adminPin: profile.adminPin || '8888',
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [adminAuthPrompt, setAdminAuthPrompt] = useState<{ isOpen: boolean; actionName: string; onAuthSuccess: () => void }>({
    isOpen: false,
    actionName: '',
    onAuthSuccess: () => {},
  });

  if (!isOpen) return null;

  const isUserAdmin = isAdminOrOwner(currentUser);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const togglePinReveal = (staffId: string) => {
    const performToggle = () => {
      setRevealedPins(prev => ({ ...prev, [staffId]: !prev[staffId] }));
    };

    if (isUserAdmin) {
      performToggle();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        actionName: 'view staff security passcode',
        onAuthSuccess: performToggle,
      });
    }
  };

  const handleCopyPin = (staffId: string, pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPinId(staffId);
    setTimeout(() => setCopiedPinId(null), 2000);
    showToast('success', 'Staff PIN copied to clipboard securely.');
  };

  // Preset Station Applicator
  const applyStationPreset = (preset: StationPreset) => {
    setFormData(prev => ({
      ...prev,
      role: preset.defaultRole,
      assignedStation: preset.name,
      stationCode: preset.code,
      allowedModules: [...preset.defaultModules],
      permissions: { ...preset.defaultPermissions },
    }));
    showToast('success', `Applied "${preset.name}" station template with ${preset.defaultModules.length} visible modules.`);
  };

  // Toggle single module in visibility checklist
  const handleToggleModule = (moduleId: AppModule) => {
    setFormData(prev => {
      const exists = prev.allowedModules.includes(moduleId);
      const nextModules = exists
        ? prev.allowedModules.filter(m => m !== moduleId)
        : [...prev.allowedModules, moduleId];
      return {
        ...prev,
        allowedModules: nextModules
      };
    });
  };

  // Quick module selectors
  const handleSelectAllModules = () => {
    setFormData(prev => ({
      ...prev,
      allowedModules: APP_MODULES.map(m => m.id)
    }));
  };

  const handleClearAllModules = () => {
    setFormData(prev => ({
      ...prev,
      allowedModules: []
    }));
  };

  const handleResetToRoleDefaultModules = () => {
    const defaultMods = getDefaultModulesForRole(formData.role);
    const defaultPerms = getDefaultPermissionsForRole(formData.role);
    const roleMeta = ROLE_CONFIG[formData.role];
    setFormData(prev => ({
      ...prev,
      allowedModules: defaultMods,
      permissions: defaultPerms,
      assignedStation: prev.assignedStation || roleMeta.defaultStation,
      stationCode: prev.stationCode || roleMeta.defaultStationCode,
    }));
    showToast('success', `Reset to standard ${ROLE_CONFIG[formData.role].label} default modules.`);
  };

  // Toggle granular permission
  const handleTogglePermission = (key: keyof StaffPermissions) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const handleStartRegister = () => {
    const executeStartRegister = () => {
      const nextCodeNumber = staffList.length + 1;
      const defaultCode = `EMP-00${nextCodeNumber}`;
      setFormData({
        id: `staff-${Date.now()}`,
        displayName: '',
        role: 'cashier',
        email: '',
        phone: '',
        pin: '',
        employeeCode: defaultCode,
        notes: '',
        status: 'active',
        assignedStation: 'Counter POS Terminal #1',
        stationCode: 'STN-POS-01',
        allowedModules: ['pos', 'invoices', 'dashboard', 'tableqr'],
        permissions: {
          canApplyDiscounts: true,
          canVoidCancelOrders: false,
          canModifyMenuPricing: false,
          canManageExpenses: false,
          canAccessFinancials: false,
          canManageStaffRoster: false,
          canAccessSystemSettings: false,
          canReprintInvoices: true,
        }
      });
      setEditingStaffId(null);
      setShowFormPin(false);
      setActiveTab('register');
    };

    if (isUserAdmin) {
      executeStartRegister();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        actionName: 'create a new staff member account and station setup',
        onAuthSuccess: executeStartRegister,
      });
    }
  };

  const handleStartEdit = (staff: StaffUser) => {
    const executeEdit = () => {
      const staffModules = (staff.allowedModules && staff.allowedModules.length > 0)
        ? staff.allowedModules
        : getDefaultModulesForRole(staff.role);
      
      const staffPerms = staff.permissions || getDefaultPermissionsForRole(staff.role);
      const roleMeta = ROLE_CONFIG[staff.role] || ROLE_CONFIG.cashier;

      setFormData({
        id: staff.id,
        displayName: staff.displayName,
        role: staff.role,
        email: staff.email || '',
        phone: staff.phone || '',
        pin: staff.pin || '',
        employeeCode: staff.employeeCode || '',
        notes: staff.notes || '',
        status: staff.status || 'active',
        assignedStation: staff.assignedStation || roleMeta.defaultStation,
        stationCode: staff.stationCode || roleMeta.defaultStationCode,
        allowedModules: [...staffModules],
        permissions: { ...staffPerms },
      });
      setEditingStaffId(staff.id);
      setShowFormPin(false);
      setActiveTab('register');
    };

    if (isUserAdmin) {
      executeEdit();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        actionName: `edit station setup & permissions for "${staff.displayName}"`,
        onAuthSuccess: executeEdit,
      });
    }
  };

  const handleDeleteStaffWithAuth = (staff: StaffUser) => {
    if (staff.role === 'owner' && staffList.filter(s => s.role === 'owner').length <= 1) {
      showToast('error', 'Cannot delete the only Owner/Admin account.');
      return;
    }

    const executeDelete = () => {
      onDeleteStaff(staff.id);
      showToast('success', `Removed ${staff.displayName} from staff roster.`);
    };

    if (isUserAdmin) {
      if (window.confirm(`Are you sure you want to remove staff member "${staff.displayName}"?`)) {
        executeDelete();
      }
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        actionName: `delete staff member "${staff.displayName}"`,
        onAuthSuccess: executeDelete,
      });
    }
  };

  const handleSubmitStaffForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.displayName.trim()) {
      showToast('error', 'Please enter staff full name.');
      return;
    }
    if (!formData.pin.trim() || formData.pin.length < 4) {
      showToast('error', 'PIN must be at least 4 digits.');
      return;
    }
    if (formData.allowedModules.length === 0) {
      showToast('error', 'Please enable at least one station module for this staff member.');
      return;
    }

    // Check duplicate PIN with other staff
    const pinDuplicate = staffList.find(s => s.pin === formData.pin && s.id !== formData.id);
    if (pinDuplicate) {
      showToast('error', `PIN is already used by ${pinDuplicate.displayName}. Please choose a unique PIN.`);
      return;
    }

    const staffMember: StaffUser = {
      id: formData.id || `staff-${Date.now()}`,
      displayName: formData.displayName.trim(),
      role: formData.role,
      email: formData.email.trim() || `${formData.displayName.toLowerCase().replace(/\s+/g, '')}@restaurant.com`,
      phone: formData.phone.trim(),
      pin: formData.pin.trim(),
      employeeCode: formData.employeeCode.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      notes: formData.notes.trim(),
      status: formData.status,
      assignedStation: formData.assignedStation.trim() || ROLE_CONFIG[formData.role].defaultStation,
      stationCode: formData.stationCode.trim() || ROLE_CONFIG[formData.role].defaultStationCode,
      allowedModules: [...formData.allowedModules],
      permissions: { ...formData.permissions },
      createdAt: editingStaffId ? undefined : new Date().toISOString(),
    };

    const executeSave = () => {
      onSaveStaff(staffMember);
      showToast('success', `${editingStaffId ? 'Updated' : 'Successfully registered'} ${staffMember.displayName} with ${staffMember.allowedModules?.length || 0} module permissions!`);
      setActiveTab('roster');
      setEditingStaffId(null);
    };

    if (isUserAdmin || staffList.length === 0) {
      executeSave();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        actionName: `${editingStaffId ? 'update' : 'register new'} staff station & module setup`,
        onAuthSuccess: executeSave,
      });
    }
  };

  const handleSaveAdminDetails = (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminDetails.adminName.trim()) {
      showToast('error', 'Admin Name is required.');
      return;
    }
    if (!adminDetails.adminPin.trim() || adminDetails.adminPin.length < 4) {
      showToast('error', 'Admin Master PIN must be at least 4 digits.');
      return;
    }

    const updatedProfile: RestaurantProfile = {
      ...profile,
      adminName: adminDetails.adminName.trim(),
      adminDesignation: adminDetails.adminDesignation.trim(),
      adminEmail: adminDetails.adminEmail.trim(),
      adminPhone: adminDetails.adminPhone.trim(),
      adminPin: adminDetails.adminPin.trim(),
    };

    const executeSave = () => {
      onSaveProfile(updatedProfile);
      
      // Also update Owner staff member if exists
      const ownerStaff = staffList.find(s => s.role === 'owner');
      if (ownerStaff) {
        onSaveStaff({
          ...ownerStaff,
          displayName: adminDetails.adminName.trim(),
          email: adminDetails.adminEmail.trim(),
          phone: adminDetails.adminPhone.trim(),
          pin: adminDetails.adminPin.trim(),
        });
      }

      showToast('success', 'Admin details & Master PIN updated securely!');
    };

    if (isUserAdmin) {
      executeSave();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        actionName: 'update Admin Profile details and Master PIN',
        onAuthSuccess: executeSave,
      });
    }
  };

  // Distinct stations in the restaurant
  const distinctStations = Array.from(new Set(staffList.map(s => s.assignedStation).filter(Boolean))) as string[];

  const filteredStaff = staffList.filter(staff => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      (staff.displayName && staff.displayName.toLowerCase().includes(q)) ||
      (staff.email && staff.email.toLowerCase().includes(q)) ||
      (staff.phone && staff.phone.includes(searchQuery)) ||
      (staff.employeeCode && staff.employeeCode.toLowerCase().includes(q)) ||
      (staff.assignedStation && staff.assignedStation.toLowerCase().includes(q)) ||
      (staff.stationCode && staff.stationCode.toLowerCase().includes(q));
    
    const matchesRole = selectedRoleFilter === 'all' || staff.role === selectedRoleFilter;
    const matchesStation = selectedStationFilter === 'all' || staff.assignedStation === selectedStationFilter;

    return matchesSearch && matchesRole && matchesStation;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/20 font-black text-lg">
              <Users className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">Staff Roster & Station Setup Center</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {staffList.length} Staff
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  {distinctStations.length || 5} Station Profiles
                </span>
                {!isUserAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Admin Protected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Admin station configuration, staff role allocations, and granular module visibility permissions.
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 gap-1 sm:gap-2 pt-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'roster'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Roster ({staffList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stations')}
            className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'stations'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Station Terminals & Setup</span>
          </button>

          <button
            type="button"
            onClick={handleStartRegister}
            className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'register'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{editingStaffId ? 'Edit Staff & Station Setup' : 'Add Staff & Module Setup'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isUserAdmin) {
                setActiveTab('admin_details');
              } else {
                setAdminAuthPrompt({
                  isOpen: true,
                  actionName: 'view and edit Master Admin Profile',
                  onAuthSuccess: () => setActiveTab('admin_details'),
                });
              }
            }}
            className={`pb-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'admin_details'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin & Owner Details</span>
          </button>
        </div>

        {/* Notification Alert */}
        {notification && (
          <div className={`mx-4 sm:mx-6 mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 shrink-0 animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <p className="flex-1">{notification.message}</p>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* =========================================================================
              TAB 1: STAFF ROSTER
             ========================================================================= */}
          {activeTab === 'roster' && (
            <div className="space-y-5">
              
              {/* Controls bar */}
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, employee code, station or phone..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                {/* Role Filter Chips & Register Button */}
                <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
                  <div className="flex gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 overflow-x-auto">
                    {['all', 'owner', 'manager', 'cashier', 'waiter', 'kitchen'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRoleFilter(r)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                          selectedRoleFilter === r
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {r === 'all' ? 'All Roles' : r}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleStartRegister}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Staff</span>
                  </button>
                </div>

              </div>

              {/* Staff Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStaff.map((staff) => {
                  const roleMeta = ROLE_CONFIG[staff.role] || ROLE_CONFIG.cashier;
                  const isCurrent = currentUser?.id === staff.id;
                  const isPinRevealed = Boolean(revealedPins[staff.id]);
                  const isCopied = copiedPinId === staff.id;
                  const allowedCount = (staff.allowedModules && staff.allowedModules.length > 0)
                    ? staff.allowedModules.length
                    : getDefaultModulesForRole(staff.role).length;
                  const allowedList = staff.allowedModules || getDefaultModulesForRole(staff.role);
                  const stationName = staff.assignedStation || roleMeta.defaultStation;
                  const stationCode = staff.stationCode || roleMeta.defaultStationCode;

                  return (
                    <div
                      key={staff.id}
                      className="p-4 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/70 hover:border-amber-400/40 rounded-2xl transition-all flex flex-col justify-between group shadow-sm"
                    >
                      <div className="space-y-3">
                        
                        {/* Top: Avatar, Name, Role Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold text-lg shadow-xs group-hover:border-amber-400/40 transition-colors">
                              {roleMeta.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                                  {staff.displayName}
                                </h3>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-500/30">
                                    Active Session
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {staff.employeeCode || 'EMP-000'}
                                </span>
                                {staff.phone && (
                                  <span className="text-[11px] text-slate-400">
                                    • {staff.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Role Badge */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize shrink-0 ${roleMeta.badgeColor}`}>
                            {staff.role}
                          </span>
                        </div>

                        {/* Station Assignment Highlight Banner */}
                        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Monitor className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[10px] text-slate-400 block font-semibold leading-tight">Assigned Station</span>
                              <span className="text-xs font-bold text-slate-200 truncate block">
                                {stationName}
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-800 text-amber-300 font-mono text-[10px] font-bold rounded-md border border-slate-700 shrink-0">
                            {stationCode}
                          </span>
                        </div>

                        {/* Module Visibility Pills */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-300 flex items-center gap-1.5">
                              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                              Station Module Permissions ({allowedCount}/10)
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {allowedList.slice(0, 5).map((modId) => {
                              const modMeta = APP_MODULES.find(m => m.id === modId);
                              const Icon = MODULE_ICONS[modId] || LayoutGrid;
                              return (
                                <span
                                  key={modId}
                                  className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-[10px] font-semibold flex items-center gap-1"
                                >
                                  <Icon className="w-2.5 h-2.5 text-amber-400" />
                                  <span>{modMeta?.shortLabel || modId}</span>
                                </span>
                              );
                            })}
                            {allowedList.length > 5 && (
                              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md text-[10px] font-bold">
                                +{allowedList.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Protected PIN Display */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-slate-300 font-mono">
                              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                              <span className="font-semibold text-slate-400 text-[11px]">Passcode:</span>
                              <span className={isPinRevealed ? 'text-amber-300 font-bold text-xs' : 'text-slate-400 tracking-widest text-xs'}>
                                {isPinRevealed ? staff.pin : '••••'}
                              </span>
                            </div>

                            {/* Secure PIN Reveal Toggle */}
                            <button
                              type="button"
                              onClick={() => togglePinReveal(staff.id)}
                              className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-700/60 rounded transition-colors cursor-pointer"
                              title={isPinRevealed ? "Hide PIN" : "Reveal PIN (Requires Admin)"}
                            >
                              {isPinRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>

                            {isPinRevealed && (
                              <button
                                type="button"
                                onClick={() => handleCopyPin(staff.id, staff.pin || '')}
                                className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/60 rounded transition-colors cursor-pointer"
                                title="Copy PIN"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Active</span>
                          </div>
                        </div>

                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(staff)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-400 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Configure Station</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaffWithAuth(staff)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {filteredStaff.length === 0 && (
                <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-dashed border-slate-800">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">No staff members found</p>
                  <p className="text-xs text-slate-500 mt-1">Try modifying your search or filter</p>
                </div>
              )}

            </div>
          )}

          {/* =========================================================================
              TAB 2: STATION TERMINALS & SETUP
             ========================================================================= */}
          {activeTab === 'stations' && (
            <div className="space-y-6">
              
              {/* Station Overview Banner */}
              <div className="p-5 bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-950/40 rounded-2xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold text-xl">
                    <Monitor className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Restaurant Physical Terminals & Station Profiles</h3>
                    <p className="text-xs text-slate-400">
                      Configure station hardware presets, default role behaviors, and assign specific employees to their designated work stations.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartRegister}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assign Staff to Station</span>
                </button>
              </div>

              {/* Station Terminals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {STATION_PRESETS.map((station) => {
                  const assignedStaff = staffList.filter(s => s.assignedStation === station.name || s.stationCode === station.code || (s.role === station.defaultRole && !s.assignedStation));
                  const defaultRoleMeta = ROLE_CONFIG[station.defaultRole];

                  return (
                    <div
                      key={station.id}
                      className="p-4 bg-slate-800/90 border border-slate-700/80 hover:border-indigo-400/40 rounded-2xl flex flex-col justify-between space-y-4 transition-all shadow-sm group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{station.icon}</span>
                            <div>
                              <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                                {station.name}
                              </h4>
                              <span className="text-[10px] font-mono font-bold text-amber-400/90">
                                {station.code}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize ${station.badgeColor}`}>
                            {defaultRoleMeta.label}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">
                          {station.description}
                        </p>

                        {/* Modules in this station preset */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Enabled Modules ({station.defaultModules.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {station.defaultModules.map((modId) => {
                              const meta = APP_MODULES.find(m => m.id === modId);
                              const Icon = MODULE_ICONS[modId] || LayoutGrid;
                              return (
                                <span
                                  key={modId}
                                  className="px-2 py-0.5 bg-slate-900 text-slate-300 border border-slate-700 rounded text-[10px] font-medium flex items-center gap-1"
                                >
                                  <Icon className="w-2.5 h-2.5 text-amber-400" />
                                  <span>{meta?.shortLabel || modId}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Assigned Staff Members */}
                        <div className="pt-2 border-t border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                            <span>Assigned Staff</span>
                            <span className="text-indigo-400 font-bold">{assignedStaff.length} operator{assignedStaff.length === 1 ? '' : 's'}</span>
                          </span>

                          <div className="space-y-1">
                            {assignedStaff.length > 0 ? (
                              assignedStaff.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-1.5 bg-slate-900/60 rounded-lg text-xs">
                                  <span className="font-bold text-slate-200">{s.displayName}</span>
                                  <span className="text-[10px] font-mono text-slate-400">{s.employeeCode}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-[11px] text-slate-500 italic py-1">No staff currently assigned</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action quick setup */}
                      <button
                        type="button"
                        onClick={() => {
                          applyStationPreset(station);
                          setEditingStaffId(null);
                          setActiveTab('register');
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-400 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Deploy Station & Add Staff</span>
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* =========================================================================
              TAB 3: REGISTER / EDIT STAFF & STATION MODULE SETUP
             ========================================================================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleSubmitStaffForm} className="max-w-4xl mx-auto space-y-6">
              
              {/* Form Title & Context */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-400" />
                    <span>{editingStaffId ? 'Configure Staff Station & Visibility Permissions' : 'Admin Staff Registration & Station Setup'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Define the employee profile, assign their work station terminal, and customize exact module visibility on their screen.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetToRoleDefaultModules}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Reset to role standard defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Reset Role Defaults</span>
                </button>
              </div>

              {/* 1. Quick Station Presets Banner */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Quick Station Template Presets (Auto-Configures Modules & Permissions)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {STATION_PRESETS.map((preset) => {
                    const isCurrentMatch = formData.assignedStation === preset.name || formData.stationCode === preset.code;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyStationPreset(preset)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isCurrentMatch
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-lg">{preset.icon}</span>
                        <span className="text-[11px] font-bold leading-tight line-clamp-1">{preset.name.split(' ')[0]}</span>
                        <span className="text-[9px] font-mono text-slate-400">{preset.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Employee Profile & Credentials */}
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  1. Staff Identity & Passcode
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">
                      Full Employee Name <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="e.g. Rahul Sharma, Priya Mehta"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* 4-Digit Login Passcode */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        Login PIN (4-Digits) <span className="text-amber-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowFormPin(prev => !prev)}
                        className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {showFormPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showFormPin ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showFormPin ? "text" : "password"}
                        required
                        maxLength={6}
                        value={formData.pin}
                        onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                        placeholder="••••"
                        className="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono tracking-widest placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs font-bold text-slate-300">
                      Primary Station Role <span className="text-amber-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {(['cashier', 'waiter', 'kitchen', 'manager', 'owner'] as StaffRole[]).map((r) => {
                        const meta = ROLE_CONFIG[r];
                        const isSelected = formData.role === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              const defaultMods = getDefaultModulesForRole(r);
                              const defaultPerms = getDefaultPermissionsForRole(r);
                              setFormData({ 
                                ...formData, 
                                role: r,
                                allowedModules: defaultMods,
                                permissions: defaultPerms,
                                assignedStation: meta.defaultStation,
                                stationCode: meta.defaultStationCode,
                              });
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-base">{meta.icon}</span>
                              <span className="text-xs font-bold capitalize">{r}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{meta.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Employee Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Employee Code / Badge ID
                    </label>
                    <input
                      type="text"
                      value={formData.employeeCode}
                      onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. EMP-105"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 00000"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="staff@restaurant.com"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Physical Station Assignment */}
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5" />
                  2. Station Hardware & Terminal Assignment
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Assigned Station Name <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.assignedStation}
                      onChange={(e) => setFormData({ ...formData, assignedStation: e.target.value })}
                      placeholder="e.g. Main Counter POS #1, Bar Station, Kitchen Line"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Station Terminal Code <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.stationCode}
                      onChange={(e) => setFormData({ ...formData, stationCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. STN-POS-01, STN-KIT-01"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Station Module Visibility Matrix (CRITICAL REQUIREMENT) */}
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-700">
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <LayoutGrid className="w-3.5 h-3.5" />
                      3. Permission to Visibility During Add Staff (Module Matrix)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Toggle exact modules and navigation tabs this staff member is authorized to view on their screen.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllModules}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-bold border border-slate-700 transition-colors cursor-pointer"
                    >
                      Select All (10)
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllModules}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-bold border border-slate-700 transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {APP_MODULES.map((module) => {
                    const Icon = MODULE_ICONS[module.id] || LayoutGrid;
                    const isChecked = formData.allowedModules.includes(module.id);

                    return (
                      <div
                        key={module.id}
                        onClick={() => handleToggleModule(module.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                          isChecked
                            ? 'bg-amber-400/10 border-amber-400/70 shadow-xs'
                            : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="pt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </div>

                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                              {module.label}
                            </span>
                            {module.badge && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${module.badgeColor || 'bg-slate-700 text-slate-300'}`}>
                                {module.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {module.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. Granular Operational Permissions */}
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  4. Granular Operational Security Permissions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'canApplyDiscounts' as const, label: 'Apply Custom Bill Discounts', desc: 'Can apply percentage or fixed discounts on active POS checkout bills' },
                    { key: 'canVoidCancelOrders' as const, label: 'Void / Cancel Active Orders', desc: 'Can void live kitchen items or cancel unpaid dining invoices' },
                    { key: 'canModifyMenuPricing' as const, label: 'Edit Menu Catalog & Dish Pricing', desc: 'Can change item prices, recipe costs, and toggle item availability' },
                    { key: 'canManageExpenses' as const, label: 'Record & Manage Vendor Expenses', desc: 'Can add vendor ingredient bills, stock purchases, and delete expense entries' },
                    { key: 'canAccessFinancials' as const, label: 'View P&L Profit Margins & Financials', desc: 'Can view gross profits, EBITDA margins %, and net income reports' },
                    { key: 'canManageStaffRoster' as const, label: 'Manage Staff Roster & Station Setup', desc: 'Can add new staff accounts, assign station modules, and view passcodes' },
                    { key: 'canAccessSystemSettings' as const, label: 'Modify Restaurant & Tax Settings', desc: 'Can update restaurant business name, GSTIN, tax rates & print formats' },
                    { key: 'canReprintInvoices' as const, label: 'Reprint Past Receipts & Invoices', desc: 'Can access bill archive history and reprint customer payment receipts' },
                  ].map((perm) => {
                    const isChecked = Boolean(formData.permissions[perm.key]);
                    return (
                      <div
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/50'
                            : 'bg-slate-800/40 border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="pt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <span className={`text-xs font-bold block ${isChecked ? 'text-emerald-300' : 'text-slate-300'}`}>
                            {perm.label}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {perm.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. Live Experience Preview Simulation */}
              <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Live Screen Experience Simulation
                    </span>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      When <strong className="text-amber-400">{formData.displayName || 'Staff Member'}</strong> logs in at <strong className="text-indigo-300">{formData.assignedStation}</strong>, they will see <strong className="text-emerald-400">{formData.allowedModules.length} module{formData.allowedModules.length === 1 ? '' : 's'}</strong> on their navigation bar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  {formData.allowedModules.slice(0, 4).map(modId => (
                    <span key={modId} className="px-2 py-0.5 bg-slate-900 text-amber-300 rounded text-[10px] font-mono border border-slate-700">
                      {modId}
                    </span>
                  ))}
                  {formData.allowedModules.length > 4 && (
                    <span className="text-[10px] text-slate-400 font-bold">+{formData.allowedModules.length - 4}</span>
                  )}
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('roster')}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingStaffId ? 'Save Station & Module Configuration' : 'Register Staff & Deploy Station'}</span>
                </button>
              </div>

            </form>
          )}

          {/* =========================================================================
              TAB 4: ADMIN & OWNER DETAILS
             ========================================================================= */}
          {activeTab === 'admin_details' && (
            <form onSubmit={handleSaveAdminDetails} className="max-w-2xl mx-auto space-y-5">
              
              <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-lg">
                    👑
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Master Admin & Proprietor Profile</h3>
                    <p className="text-xs text-slate-400">
                      Configure Owner credentials, Master PIN authorization, and business leadership details.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Admin Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Admin / Owner Full Name <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={adminDetails.adminName}
                      onChange={(e) => setAdminDetails({ ...adminDetails, adminName: e.target.value })}
                      placeholder="e.g. Kuldeep Nawar"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Designation / Role Title
                    </label>
                    <input
                      type="text"
                      value={adminDetails.adminDesignation}
                      onChange={(e) => setAdminDetails({ ...adminDetails, adminDesignation: e.target.value })}
                      placeholder="e.g. Proprietor & Managing Director"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* Admin Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Admin Business Email
                    </label>
                    <input
                      type="email"
                      value={adminDetails.adminEmail}
                      onChange={(e) => setAdminDetails({ ...adminDetails, adminEmail: e.target.value })}
                      placeholder="owner@restaurant.com"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* Admin Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Admin Direct Contact
                    </label>
                    <input
                      type="tel"
                      value={adminDetails.adminPhone}
                      onChange={(e) => setAdminDetails({ ...adminDetails, adminPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* Admin Master PIN with Show/Hide Toggle */}
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Admin Master Authorization PIN (Overrides All Station & Module Restrictions)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAdminMasterPin(prev => !prev)}
                        className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {showAdminMasterPin ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Hide PIN</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Show PIN</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showAdminMasterPin ? "text" : "password"}
                        required
                        maxLength={6}
                        value={adminDetails.adminPin}
                        onChange={(e) => setAdminDetails({ ...adminDetails, adminPin: e.target.value.replace(/\D/g, '') })}
                        placeholder="••••"
                        className="w-full px-3 pr-10 py-2.5 bg-slate-800 border border-amber-400/50 rounded-xl text-xs text-amber-300 font-mono tracking-widest focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminMasterPin(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showAdminMasterPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      This master PIN allows bypassing station restrictions, approving bill voids, creating staff, and modifying restaurant settings.
                    </p>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Admin Details & Master PIN</span>
                  </button>
                </div>

              </div>

            </form>
          )}

        </div>

      </div>

      {/* Admin Authorization Prompt for restricted actions */}
      <AdminAuthModal
        isOpen={adminAuthPrompt.isOpen}
        onClose={() => setAdminAuthPrompt({ isOpen: false, actionName: '', onAuthSuccess: () => {} })}
        onAuthorized={() => {
          const fn = adminAuthPrompt.onAuthSuccess;
          setAdminAuthPrompt({ isOpen: false, actionName: '', onAuthSuccess: () => {} });
          fn();
        }}
        actionName={adminAuthPrompt.actionName}
        adminPin={profile.adminPin}
      />

    </div>
  );
};
