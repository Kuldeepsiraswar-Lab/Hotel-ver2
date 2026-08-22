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
  ShieldAlert
} from 'lucide-react';
import { RestaurantProfile, StaffUser, StaffRole } from '../types';
import { isAdminOrOwner } from '../utils/permissions';
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

const ROLE_CONFIG: Record<StaffRole, { label: string; icon: string; badgeColor: string; desc: string; permissions: string }> = {
  owner: {
    label: 'Owner / Master Admin',
    icon: '👑',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    desc: 'Complete master privileges: full billing, data deletions, financial analytics, menu edits & settings.',
    permissions: 'Full Access • Edit & Delete Allowed'
  },
  manager: {
    label: 'Floor Manager',
    icon: '📋',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    desc: 'Shift supervision, customer table assignment, discount approvals & daily billing operations.',
    permissions: 'Management • Operations'
  },
  cashier: {
    label: 'Counter Cashier',
    icon: '💳',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    desc: 'Fast POS billing, generating invoices, receiving UPI/Card payments. Restricted from deleting records.',
    permissions: 'POS Billing & View Only'
  },
  waiter: {
    label: 'Server / Waiter',
    icon: '🍽️',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    desc: 'Table order punching, sending KOT to kitchen, customer servicing. View-only invoices.',
    permissions: 'Table Orders & View Only'
  },
  kitchen: {
    label: 'Kitchen / Chef',
    icon: '🔥',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    desc: 'Live Kitchen Order Display (KOT) station, marking dishes preparing & ready.',
    permissions: 'Kitchen Orders View'
  }
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
  const [activeTab, setActiveTab] = useState<'roster' | 'register' | 'admin_details'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
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
      });
      setEditingStaffId(null);
      setShowFormPin(false);
      setActiveTab('register');
    };

    // Strictly enforce Admin permission for staff creation
    if (isUserAdmin) {
      executeStartRegister();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        actionName: 'create a new staff member account',
        onAuthSuccess: executeStartRegister,
      });
    }
  };

  const handleStartEdit = (staff: StaffUser) => {
    const executeEdit = () => {
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
        actionName: `edit staff member "${staff.displayName}"`,
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
      createdAt: editingStaffId ? undefined : new Date().toISOString(),
    };

    const executeSave = () => {
      onSaveStaff(staffMember);
      showToast('success', `${editingStaffId ? 'Updated' : 'Successfully registered'} ${staffMember.displayName} (${ROLE_CONFIG[staffMember.role].label})!`);
      setActiveTab('roster');
      setEditingStaffId(null);
    };

    if (isUserAdmin || staffList.length === 0) {
      executeSave();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        actionName: `${editingStaffId ? 'update' : 'register new'} staff account`,
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

  const filteredStaff = staffList.filter(staff => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      (staff.displayName && staff.displayName.toLowerCase().includes(q)) ||
      (staff.email && staff.email.toLowerCase().includes(q)) ||
      (staff.phone && staff.phone.includes(searchQuery)) ||
      (staff.employeeCode && staff.employeeCode.toLowerCase().includes(q));
    
    const matchesRole = selectedRoleFilter === 'all' || staff.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-850 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/20 font-black text-lg">
              <Users className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">Staff Roster & Admin Center</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {staffList.length} Registered
                </span>
                {!isUserAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Admin Protected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Admin-controlled employee accounts, role assignments, security passcodes, and master credentials.
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
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-6 gap-2 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
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
            onClick={handleStartRegister}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'register'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{editingStaffId ? 'Edit Staff Member' : 'Register New Staff'}</span>
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
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
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
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 shrink-0 animate-in fade-in duration-200 ${
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
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: STAFF ROSTER */}
          {activeTab === 'roster' && (
            <div className="space-y-5">
              
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, ID, phone..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                {/* Role Filter Chips & Register Button */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto pb-1 sm:pb-0">
                  <div className="flex gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
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
                        {r === 'all' ? 'All' : r}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleStartRegister}
                    className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Staff</span>
                  </button>
                </div>

              </div>

              {/* Staff Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredStaff.map((staff) => {
                  const roleMeta = ROLE_CONFIG[staff.role] || ROLE_CONFIG.cashier;
                  const isCurrent = currentUser?.id === staff.id;
                  const isPinRevealed = Boolean(revealedPins[staff.id]);
                  const isCopied = copiedPinId === staff.id;

                  return (
                    <div
                      key={staff.id}
                      className="p-4 bg-slate-850/80 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 rounded-2xl transition-all flex flex-col justify-between group shadow-xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-700 border border-slate-600 text-slate-200 flex items-center justify-center font-bold text-lg shadow-xs">
                              {roleMeta.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                                  {staff.displayName}
                                </h3>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-500/30">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono">
                                ID: {staff.employeeCode || 'EMP-000'}
                              </p>
                            </div>
                          </div>

                          {/* Role Badge */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${roleMeta.badgeColor}`}>
                            {staff.role}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-750 text-xs text-slate-300">
                          {staff.phone && (
                            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{staff.phone}</span>
                            </div>
                          )}
                          {staff.email && (
                            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="truncate">{staff.email}</span>
                            </div>
                          )}

                          {/* Protected PIN Display */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2 text-[11px]">
                              <div className="flex items-center gap-1 text-slate-300 font-mono">
                                <KeyRound className="w-3 h-3 text-amber-400" />
                                <span className="font-semibold text-slate-400">PIN:</span>
                                <span className={isPinRevealed ? 'text-amber-300 font-bold' : 'text-slate-400 tracking-widest'}>
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

                            <span className="text-[10px] text-slate-500">
                              {roleMeta.permissions}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-750">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(staff)}
                          className="px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-slate-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaffWithAuth(staff)}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {filteredStaff.length === 0 && (
                <div className="text-center py-12 bg-slate-850/50 rounded-2xl border border-dashed border-slate-800">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">No staff members found</p>
                  <p className="text-xs text-slate-500 mt-1">Try modifying your search or filter</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: REGISTER / EDIT STAFF */}
          {activeTab === 'register' && (
            <form onSubmit={handleSubmitStaffForm} className="max-w-2xl mx-auto space-y-5">
              
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-amber-400" />
                    <span>{editingStaffId ? 'Edit Employee Details' : 'Admin Staff Registration'}</span>
                  </h3>
                  <span className="text-[11px] text-amber-400 font-medium">
                    Admin Authorization Protected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">
                      Full Name <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="e.g. Vikram Sharma, Anita Patel"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Role Assignment */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">
                      Staff Role & Permissions <span className="text-amber-400">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(['cashier', 'waiter', 'kitchen', 'manager', 'owner'] as StaffRole[]).map((r) => {
                        const meta = ROLE_CONFIG[r];
                        const isSelected = formData.role === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setFormData({ ...formData, role: r })}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base">{meta.icon}</span>
                              <span className="text-xs font-bold capitalize">{r}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-2">{meta.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4-Digit Passcode / PIN with Show Toggle */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        4-Digit POS Login PIN <span className="text-amber-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowFormPin(prev => !prev)}
                        className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {showFormPin ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Show</span>
                          </>
                        )}
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
                        className="w-full pl-9 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono tracking-wider placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPin(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showFormPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Employee Code / Badge */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Employee Code / Badge ID
                    </label>
                    <input
                      type="text"
                      value={formData.employeeCode}
                      onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. EMP-105"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 00000"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="staff@restaurant.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Notes & Shift description */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">
                      Special Notes / Designation
                    </label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="e.g. Afternoon shift lead, Barista certified, POS specialist"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-750">
                  <button
                    type="button"
                    onClick={() => setActiveTab('roster')}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingStaffId ? 'Save Changes' : 'Register Staff Member'}</span>
                  </button>
                </div>

              </div>

            </form>
          )}

          {/* TAB 3: ADMIN & OWNER DETAILS */}
          {activeTab === 'admin_details' && (
            <form onSubmit={handleSaveAdminDetails} className="max-w-2xl mx-auto space-y-5">
              
              <div className="bg-slate-850 p-6 rounded-2xl border border-slate-700/80 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-750">
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
                        Admin Master Authorization PIN (Overrides All Permissions)
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
                      This master PIN is requested when creating staff, deleting bills, modifying menu items, and editing system settings.
                    </p>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-750">
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
