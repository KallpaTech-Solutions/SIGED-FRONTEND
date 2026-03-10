import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const TYPES = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
    text: 'text-emerald-800',
    shadow: 'shadow-emerald-500/10',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-200',
    iconColor: 'text-red-600',
    text: 'text-red-800',
    shadow: 'shadow-red-500/10',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
    text: 'text-amber-800',
    shadow: 'shadow-amber-500/10',
  },
  info: {
    icon: Info,
    bg: 'bg-primary/5 border-primary/20',
    iconColor: 'text-primary',
    text: 'text-slate-800',
    shadow: 'shadow-primary/10',
  },
};

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  const t = TYPES[type] || TYPES.info;
  const Icon = t.icon;

  const messageStr = typeof message === 'string' 
    ? message 
    : (message?.message || (typeof message === 'object' ? 'Operación completada' : String(message ?? '')));

  useEffect(() => {
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-2xl border-2 shadow-lg ${t.bg} ${t.shadow} animate-fade-in min-w-[280px] max-w-md`}
      role="alert"
    >
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${t.iconColor}`}>
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <p className={`flex-1 text-sm font-semibold ${t.text}`}>{messageStr}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 p-1.5 rounded-lg hover:bg-black/5 transition-colors text-slate-400 hover:text-slate-600"
        aria-label="Cerrar"
      >
        <X size={18} />
      </button>
    </div>
  );
}
