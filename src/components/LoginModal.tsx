import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  Building2,
  Delete
} from 'lucide-react';
import { RestaurantProfile, StaffUser, StaffRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  profile: RestaurantProfile;
  staffList?: StaffUser[];
  onLoginSuccess: (user: StaffUser) => void;
  onOpenStaffManagement?: () => void;
  isLocked?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  profile,
  staffList = [],
  onLoginSuccess,
  isLocked = false,
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      status: 'active' as const,
    },
  ];

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const enteredPin = pinInput.trim();
    if (!enteredPin) {
      setErrorMsg('Please enter your 4-digit staff passcode.');
      return;
    }

    // Match against current staff list or admin master PIN
    const masterAdminPin = profile.adminPin || '8888';
    const matchedStaff = currentAccounts.find(s => s.pin === enteredPin) || 
      (enteredPin === masterAdminPin ? (currentAccounts.find(s => s.role === 'owner') || {
        id: 'staff-owner-master',
        displayName: profile.adminName || 'Admin / Owner',
        role: 'owner' as StaffRole,
        pin: masterAdminPin,
        email: profile.adminEmail || '',
        phone: profile.adminPhone || '',
      }) : undefined);

    if (matchedStaff) {
      setSuccessMsg(`Welcome, ${matchedStaff.displayName}!`);
      setTimeout(() => {
        onLoginSuccess({
          ...matchedStaff,
          shiftStartedAt: new Date().toISOString()
        });
        setPinInput('');
        setSuccessMsg(null);
      }, 350);
    } else {
      setErrorMsg('Invalid staff passcode. Please check your PIN or ask the administrator.');
      setPinInput('');
    }
  };

  const handleNumpadPress = (digit: string) => {
    setErrorMsg(null);
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      
      // Auto-validate if 4 digits matches
      const masterAdminPin = profile.adminPin || '8888';
      const match = currentAccounts.find(s => s.pin === nextPin) ||
        (nextPin === masterAdminPin ? (currentAccounts.find(s => s.role === 'owner') || {
          id: 'staff-owner-master',
          displayName: profile.adminName || 'Admin / Owner',
          role: 'owner' as StaffRole,
          pin: masterAdminPin,
          email: profile.adminEmail || '',
          phone: profile.adminPhone || '',
        }) : undefined);
      
      if (match) {
        setSuccessMsg(`Welcome, ${match.displayName}!`);
        setTimeout(() => {
          onLoginSuccess({
            ...match,
            shiftStartedAt: new Date().toISOString()
          });
          setPinInput('');
          setSuccessMsg(null);
        }, 350);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setPinInput(prev => prev.slice(0, -1));
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
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {profile.city || profile.address ? `${profile.city || 'Restaurant'}` : 'Authorized POS Terminal'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {isLocked ? 'Terminal Locked • Enter Authorized Staff Passcode' : 'Staff Passcode Authentication & POS Entry'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">

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

          {/* PIN Input Box */}
          <form onSubmit={handlePinSubmit} className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">
                Enter 4-Digit Staff PIN Passcode
              </label>
              <button
                type="button"
                onClick={() => setShowPin(prev => !prev)}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                title={showPin ? "Hide PIN digits" : "Show PIN digits"}
              >
                {showPin ? (
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
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPin ? "text" : "password"}
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setErrorMsg(null);
                  setPinInput(e.target.value.replace(/\D/g, ''));
                }}
                placeholder={showPin ? "1234" : "••••"}
                autoFocus
                className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono text-center tracking-[0.6em] text-xl focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowPin(prev => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Touch & Mouse POS Numpad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumpadPress(digit)}
                  className="py-3 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-bold text-base rounded-xl border border-slate-700/60 transition-all cursor-pointer shadow-xs"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 bg-slate-800/60 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs rounded-xl border border-slate-700/60 transition-all cursor-pointer flex items-center justify-center gap-1"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
                <span>Clear</span>
              </button>
              <button
                type="button"
                onClick={() => handleNumpadPress('0')}
                className="py-3 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-bold text-base rounded-xl border border-slate-700/60 transition-all cursor-pointer shadow-xs"
              >
                0
              </button>
              <button
                type="submit"
                className="py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            </div>
          </form>

        </div>

        {/* Footer Security Badge */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Protected POS Security
          </span>
          <span className="text-[10px] text-slate-400">
            Contact Admin to register staff
          </span>
        </div>

      </div>
    </div>
  );
};
