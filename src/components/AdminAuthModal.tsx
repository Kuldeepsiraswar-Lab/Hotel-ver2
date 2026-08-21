import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, X, AlertCircle, Eye, EyeOff, Delete } from 'lucide-react';
import { ADMIN_PIN } from '../utils/permissions';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized?: () => void;
  onSuccess?: () => void;
  actionTitle?: string;
  actionDescription?: string;
  actionName?: string;
  adminPin?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
  onSuccess,
  actionTitle = 'Admin Authorization Required',
  actionDescription,
  actionName,
  adminPin,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetAdminPin = adminPin || ADMIN_PIN;
  const descriptionText = actionDescription || 
    (actionName ? `Please enter the Admin Master PIN to authorize ${actionName}.` : 'Staff and cashier accounts require Admin Master PIN authorization for this action.');

  const triggerSuccess = () => {
    if (onAuthorized) onAuthorized();
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.trim() === targetAdminPin) {
      setError(null);
      setPin('');
      triggerSuccess();
    } else {
      setError('Invalid Admin Master PIN. Authorization failed.');
      setPin('');
    }
  };

  const handleNumpad = (digit: string) => {
    setError(null);
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      if (next === targetAdminPin) {
        setPin('');
        triggerSuccess();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100 p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-white">{actionTitle}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{descriptionText}</p>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400">Master Passcode</span>
            <button
              type="button"
              onClick={() => setShowPin(prev => !prev)}
              className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {showPin ? (
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
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPin ? "text" : "password"}
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setError(null);
                setPin(e.target.value.replace(/\D/g, ''));
              }}
              placeholder="••••"
              autoFocus
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center tracking-[0.5em] text-base focus:outline-hidden focus:border-amber-400"
            />
            <button
              type="button"
              onClick={() => setShowPin(prev => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleNumpad(digit)}
                className="py-2.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm rounded-xl border border-slate-700/60 transition-all cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin(prev => prev.slice(0, -1))}
              className="py-2.5 bg-slate-800/60 hover:bg-slate-700 active:scale-95 text-slate-400 font-bold text-xs rounded-xl border border-slate-700/60 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Delete className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              type="button"
              onClick={() => handleNumpad('0')}
              className="py-2.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm rounded-xl border border-slate-700/60 transition-all cursor-pointer"
            >
              0
            </button>
            <button
              type="submit"
              className="py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Authorize</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
