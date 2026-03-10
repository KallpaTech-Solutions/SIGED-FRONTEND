import React from 'react';
import { AlertTriangle, Trash2, Power, Info } from 'lucide-react';

const VARIANTS = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    accentBorder: 'border-red-200',
    confirmBg: 'bg-red-600 hover:bg-red-700',
    confirmShadow: 'shadow-red-500/25',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    accentBorder: 'border-amber-200',
    confirmBg: 'bg-amber-600 hover:bg-amber-700',
    confirmShadow: 'shadow-amber-500/25',
  },
  info: {
    icon: Info,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    accentBorder: 'border-primary/20',
    confirmBg: 'bg-primary hover:bg-primary-700',
    confirmShadow: 'shadow-primary/25',
  },
  default: {
    icon: Power,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    accentBorder: 'border-slate-200',
    confirmBg: 'bg-primary hover:bg-primary-700',
    confirmShadow: 'shadow-primary/25',
  },
};

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirmar acción',
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  variant = 'default',
}) {
  if (!isOpen) return null;

  const v = VARIANTS[variant] || VARIANTS.default;
  const Icon = v.icon;

  const messageStr = typeof message === 'string' 
    ? message 
    : (message?.message || (typeof message === 'object' ? '¿Está seguro de continuar?' : String(message ?? '')));

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" 
        onClick={onCancel}
        aria-hidden="true"
      />
      <div 
        className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className={`p-8 border-b-2 ${v.accentBorder}`}>
          <div className="flex items-start gap-5">
            <div className={`w-14 h-14 rounded-2xl ${v.iconBg} flex items-center justify-center shrink-0`}>
              <Icon size={28} className={v.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="confirm-title" className="text-lg font-bold text-slate-800 tracking-tight font-montserrat mb-2">
                {title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {messageStr}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 flex gap-3 justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider text-slate-600 hover:bg-slate-200/80 transition-all border border-slate-200"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider text-white transition-all shadow-lg ${v.confirmBg} ${v.confirmShadow}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
