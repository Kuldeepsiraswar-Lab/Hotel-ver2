import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Users,
  Building2,
  UserPlus,
  Crown,
  Phone,
  Mail,
  User,
  ArrowLeft
} from 'lucide-react';
import { RestaurantProfile, StaffUser, StaffRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  profile: RestaurantProfile;
  staffList?: StaffUser[];
  onLoginSuccess: (user: StaffUser) => void;
  onRegisterStaff?: (staff: StaffUser) => void;
  onOpenStaffManagement?: () => void;
  isLocked?: boolean;
}

const ROLE_EMOJIS: Record<string, string> = {
  owner: '👑',
  manager: '📋',
  cashier: '💳',
  waiter: '🍽️',
  kitchen: '🔥',
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  profile,
  staffList = [],
  onLoginSuccess,
  onRegisterStaff,
  onOpenStaffManagement,
  isLocked = false,
}) => {
  const [viewMode, setViewMode] = useState<'login' | 'register'>('login');
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Staff Registration form state
  const [regForm, setRegForm] = useState<{
    displayName: string;
    role: StaffRole;
    pin: string;
    phone: string;
    email: string;
    employeeCode: string;
  }>({
    displayName: '',
    role: 'cashier',
    pin: '',
    phone: '',
    email: '',
    employeeCode: '',
  });

  if (!isOpen) return null;

  const currentAccounts = staffList.length > 0 ? staffList : [
    {
      id: 'staff-owner',
      displayName: profile.adminName || 'Kuldeep Nawar (Owner)',
      email: profile.adminEmail || 'admin@restaurant.com',
      role: 'owner' as StaffRole,
      pin: profile.adminPin || '8888',
      phone: profile.adminPhone || '',
      employeeCode: 'ADM-001',
    },
    {
      id: 'staff-manager',
      displayName: 'Sophia Martinez (Manager)',
      email: 'manager@restaurant.com',
      role: 'manager' as StaffRole,
      pin: '1234',
      phone: '+91 98765 11223',
      employeeCode: 'MGR-002',
    },
    {
      id: 'staff-cashier',
      displayName: 'Alexander Chen (Cashier)',
      email: 'cashier@restaurant.com',
      role: 'cashier' as StaffRole,
      pin: '0000',
      phone: '+91 98765 33445',
      employeeCode: 'CSH-003',
    },
  ];

  // Handle Quick PIN Authentication
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const enteredPin = pinInput.trim();
    if (!enteredPin) {
      setErrorMsg('Please enter your 4-digit staff PIN.');
      return;
    }

    // Match against current staff list or admin master PIN
    const matchedStaff = currentAccounts.find(s => s.pin === enteredPin) || 
      (enteredPin === (profile.adminPin || '8888') ? currentAccounts.find(s => s.role === 'owner') : undefined);

    if (matchedStaff) {
      setSuccessMsg(`Welcome, ${matchedStaff.displayName}!`);
      setTimeout(() => {
        onLoginSuccess({
          ...matchedStaff,
          shiftStartedAt: new Date().toISOString()
        });
      }, 400);
    } else {
      const pinsHint = currentAccounts.map(s => `${s.displayName.split(' ')[0]}: ${s.pin}`).join(', ');
      setErrorMsg(`Invalid PIN code. Active accounts: ${pinsHint}`);
      setPinInput('');
    }
  };

  const handleQuickPinSelect = (staff: StaffUser) => {
    setPinInput(staff.pin || '');
    setErrorMsg(null);
    setSuccessMsg(`Signing in as ${staff.displayName}...`);
    setTimeout(() => {
      onLoginSuccess({
        ...staff,
        shiftStartedAt: new Date().toISOString()
      });
    }, 350);
  };

  const handleNumpadPress = (digit: string) => {
    setErrorMsg(null);
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      
      // Auto-validate if 4 digits
      const match = currentAccounts.find(s => s.pin === nextPin) ||
        (nextPin === (profile.adminPin || '8888') ? currentAccounts.find(s => s.role === 'owner') : undefined);
      
      if (match) {
        setSuccessMsg(`Welcome, ${match.displayName}!`);
        setTimeout(() => {
          onLoginSuccess({
            ...match,
            shiftStartedAt: new Date().toISOString()
          });
        }, 350);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setPinInput(prev => prev.slice(0, -1));
  };

  // Handle In-Login Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regForm.displayName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!regForm.pin.trim() || regForm.pin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits.');
      return;
    }

    const pinExists = currentAccounts.some(s => s.pin === regForm.pin);
    if (pinExists) {
      setErrorMsg(`PIN ${regForm.pin} is already registered. Please pick another 4-digit code.`);
      return;
    }

    const newStaff: StaffUser = {
      id: `staff-${Date.now()}`,
      displayName: regForm.displayName.trim(),
      role: regForm.role,
      pin: regForm.pin.trim(),
      phone: regForm.phone.trim(),
      email: regForm.email.trim() || `${regForm.displayName.toLowerCase().replace(/\s+/g, '')}@restaurant.com`,
      employeeCode: regForm.employeeCode.trim() || `EMP-00${currentAccounts.length + 1}`,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    if (onRegisterStaff) {
      onRegisterStaff(newStaff);
    }

    setSuccessMsg(`Successfully registered ${newStaff.displayName}! Logging in...`);
    setTimeout(() => {
      onLoginSuccess({
        ...newStaff,
        shiftStartedAt: new Date().toISOString(),
      });
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        
        {/* Top Header Banner */}
        <div className="p-6 bg-linear-to-b from-slate-800 to-slate-900 border-b border-slate-800 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-400/20">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
            ) : (
              <Lock className="w-7 h-7" />
            )}
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            {profile.name || 'Restaurant Billing POS'}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-xs text-amber-400 font-semibold">
              Admin: {profile.adminName || 'Kuldeep Nawar'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {isLocked ? 'Terminal Locked • Enter Staff Passcode' : 'Staff Passcode Authentication & POS Entry'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
          <button
            type="button"
            onClick={() => {
              setViewMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'login'
                ? 'bg-slate-800 text-amber-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In (PIN)</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setViewMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'register'
                ? 'bg-slate-800 text-amber-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register New Staff</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="font-medium flex-1">{errorMsg}</p>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="font-medium flex-1">{successMsg}</p>
            </div>
          )}

          {/* VIEW MODE 1: LOGIN */}
          {viewMode === 'login' ? (
            <div className="space-y-4">
              {/* PIN Input Box */}
              <form onSubmit={handlePinSubmit} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    Enter 4-Digit Staff PIN
                  </label>
                  <span className="text-[11px] text-amber-400 font-medium font-mono">
                    Admin PIN: {profile.adminPin || '8888'}
                  </span>
                </div>
                
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => {
                      setErrorMsg(null);
                      setPinInput(e.target.value);
                    }}
                    placeholder="••••"
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono text-center tracking-[0.6em] text-lg focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                {/* Touch & Mouse POS Numpad */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleNumpadPress(digit)}
                      className="py-2.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm rounded-xl border border-slate-700/60 transition-all cursor-pointer shadow-xs"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="py-2.5 bg-slate-800/60 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs rounded-xl border border-slate-700/60 transition-all cursor-pointer flex items-center justify-center"
                    title="Backspace"
                  >
                    ⌫ Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumpadPress('0')}
                    className="py-2.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm rounded-xl border border-slate-700/60 transition-all cursor-pointer shadow-xs"
                  >
                    0
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Enter</span>
                  </button>
                </div>
              </form>

              {/* Fast Staff Selection Cards */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Or 1-Click Fast Login:</span>
                  </p>
                  {onOpenStaffManagement && (
                    <button
                      type="button"
                      onClick={onOpenStaffManagement}
                      className="text-[11px] text-amber-400 hover:underline font-semibold cursor-pointer"
                    >
                      Manage Roster
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                  {currentAccounts.map((staff) => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => handleQuickPinSelect(staff)}
                      className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/60 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-700 group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-200 flex items-center justify-center font-bold text-xs transition-colors">
                          {ROLE_EMOJIS[staff.role] || '👤'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                            {staff.displayName}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            PIN: {staff.pin} • Role: {staff.role}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: REGISTRATION */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="text-left">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Register Employee / Staff Account</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Add cashiers, waiters, kitchen staff or managers to this terminal.
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regForm.displayName}
                    onChange={(e) => setRegForm({ ...regForm, displayName: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Role & Access Level <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { role: 'cashier' as StaffRole, label: 'Cashier (POS & Billing)', icon: '💳' },
                    { role: 'waiter' as StaffRole, label: 'Waiter (Table Orders)', icon: '🍽️' },
                    { role: 'kitchen' as StaffRole, label: 'Kitchen (Chef / KOT)', icon: '🔥' },
                    { role: 'manager' as StaffRole, label: 'Manager (Full Floor)', icon: '📋' },
                  ].map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setRegForm({ ...regForm, role: r.role })}
                      className={`p-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        regForm.role === r.role
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{r.icon}</span>
                      <span className="truncate">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PIN Code */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    4-Digit PIN <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={regForm.pin}
                      onChange={(e) => setRegForm({ ...regForm, pin: e.target.value.replace(/\D/g, '') })}
                      placeholder="••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono tracking-wider focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Employee ID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    value={regForm.employeeCode}
                    onChange={(e) => setRegForm({ ...regForm, employeeCode: e.target.value.toUpperCase() })}
                    placeholder={`EMP-00${currentAccounts.length + 1}`}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white uppercase placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Submit & Back buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Complete Registration & Login</span>
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Footer Security Badge */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Terminal Security Locked
          </span>
          <span className="font-mono text-[10px]">PIN Authorization</span>
        </div>

      </div>
    </div>
  );
};
