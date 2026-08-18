import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ADMIN_PIN } from '../utils/permissions';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: () => void;
  actionTitle?: string;
  actionDescription?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
  actionTitle = 'Admin Authorization Required',
  actionDescription = 'Staff and cashiers cannot edit or delete data. Please enter the Admin / Owner PIN (8888) to authorize this action.',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.trim() === ADMIN_PIN) {
      setError(null);
      setPin('');
      onAuthorized();
      onClose();
    } else {
      setError('Invalid Admin PIN. (Default Owner PIN: 8888)');
      setPin('');
    }
  };

  const handleNumpad = (digit: string) => {
    setError(null);
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      if (next === ADMIN_PIN) {
        setPin('');
        onAuthorized();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100 p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-white">{actionTitle}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{actionDescription}</p>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setError(null);
                setPin(e.target.value);
              }}
              placeholder="Admin PIN"
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center tracking-[0.5em] text-base focus:outline-hidden focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleNumpad(digit)}
                className="py-2 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm rounded-xl border border-slate-700/60 transition-all cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin(prev => prev.slice(0, -1))}
              className="py-2 bg-slate-800/60 hover:bg-slate-700 active:scale-95 text-slate-400 font-bold text-xs rounded-xl border border-slate-700/60 transition-all cursor-pointer"
            >
              ⌫ Clear
            </button>
            <button
              type="button"
              onClick={() => handleNumpad('0')}
              className="py-2 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm rounded-xl border border-slate-700/60 transition-all cursor-pointer"
            >
              0
            </button>
            <button
              type="submit"
              className="py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
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
