import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  CalendarClock,
  Ban,
  ShieldCheck,
  Loader2,
  Info,
} from 'lucide-react';
import { AppointmentStatus } from '../../types';

export const NeuCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ children, className = '', inset = false, size = 'md' }) => {
  const baseClass = inset
    ? size === 'sm'
      ? 'neu-inset-sm'
      : 'neu-inset'
    : size === 'sm'
      ? 'neu-raised-sm'
      : size === 'lg'
        ? 'neu-raised-lg'
        : 'neu-raised';

  return (
    <div className={`${baseClass} rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
};

export const NeuButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'primary' | 'danger' | 'success' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
  }
> = ({
  children,
  variant = 'default',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-3.5 py-2 text-xs min-h-[38px]'
      : size === 'lg'
        ? 'px-6 py-3 text-sm min-h-[46px]'
        : 'px-4 py-2.5 text-sm min-h-[42px]';

  let variantClasses = 'neu-btn text-[#172B4D] font-medium';
  if (variant === 'primary') {
    variantClasses = 'neu-btn-primary text-white font-semibold';
  } else if (variant === 'danger') {
    variantClasses = 'neu-btn text-[#C63D4D] font-semibold border-[#C63D4D]/25 hover:bg-[#C63D4D]/5';
  } else if (variant === 'success') {
    variantClasses = 'neu-btn text-[#16865C] font-semibold border-[#16865C]/25 hover:bg-[#16865C]/5';
  } else if (variant === 'ghost') {
    variantClasses = 'text-[#64748B] hover:text-[#172B4D] hover:bg-white/40 font-medium transition-colors';
  }

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : icon}
      {children}
    </button>
  );
};

export const StatusIndicator: React.FC<{
  status: AppointmentStatus | string;
}> = ({ status }) => {
  let colorClass = 'text-[#64748B]';
  let IconComp = Clock;

  switch (status) {
    case 'Confirmed':
    case 'Active':
    case 'Approved':
      colorClass = 'text-[#16865C]';
      IconComp = CheckCircle2;
      break;
    case 'Pending':
    case 'Pending Approval':
      colorClass = 'text-[#C68117]';
      IconComp = Clock;
      break;
    case 'Reschedule Requested':
    case 'Rescheduled':
      colorClass = 'text-[#3478F6]';
      IconComp = CalendarClock;
      break;
    case 'Rejected':
    case 'Cancelled':
    case 'Inactive':
      colorClass = 'text-[#C63D4D]';
      IconComp = XCircle;
      break;
    case 'Completed':
      colorClass = 'text-[#172B4D]';
      IconComp = ShieldCheck;
      break;
    case 'On Leave':
    case 'Blocked':
      colorClass = 'text-[#C68117]';
      IconComp = Ban;
      break;
    default:
      colorClass = 'text-[#64748B]';
      IconComp = Info;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${colorClass}`}>
      <IconComp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};

export const NeuInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    helperText?: string;
    error?: string;
    rightElement?: React.ReactNode;
  }
> = ({ label, helperText, error, rightElement, id, className = '', required, ...props }) => {
  const inputId = id || `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-semibold text-[#172B4D] flex items-center justify-between">
        <span>
          {label} {required && <span className="text-[#C63D4D]">*</span>}
        </span>
        {rightElement}
      </label>
      <input
        id={inputId}
        required={required}
        className={`neu-inset rounded-xl px-3.5 py-2.5 text-sm text-[#172B4D] placeholder:text-[#64748B]/70 focus:outline-none ${
          error ? 'ring-2 ring-[#C63D4D]' : ''
        } disabled:opacity-60 ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-[#C63D4D] font-medium flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#64748B]">{helperText}</p>
      ) : null}
    </div>
  );
};

export const NeuSelect: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    helperText?: string;
    error?: string;
    options: Array<{ value: string; label: string }>;
  }
> = ({ label, helperText, error, options, id, className = '', required, ...props }) => {
  const selectId = id || `select-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-xs font-semibold text-[#172B4D]">
        {label} {required && <span className="text-[#C63D4D]">*</span>}
      </label>
      <select
        id={selectId}
        required={required}
        className={`neu-inset rounded-xl px-3.5 py-2.5 text-sm text-[#172B4D] bg-[#E9EEF3] focus:outline-none ${
          error ? 'ring-2 ring-[#C63D4D]' : ''
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-[#C63D4D] font-medium flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#64748B]">{helperText}</p>
      ) : null}
    </div>
  );
};

export const NeuTextarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    helperText?: string;
    error?: string;
  }
> = ({ label, helperText, error, id, className = '', required, ...props }) => {
  const areaId = id || `textarea-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={areaId} className="text-xs font-semibold text-[#172B4D]">
        {label} {required && <span className="text-[#C63D4D]">*</span>}
      </label>
      <textarea
        id={areaId}
        required={required}
        className={`neu-inset rounded-xl px-3.5 py-2.5 text-sm text-[#172B4D] placeholder:text-[#64748B]/70 focus:outline-none ${
          error ? 'ring-2 ring-[#C63D4D]' : ''
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-[#C63D4D] font-medium flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#64748B]">{helperText}</p>
      ) : null}
    </div>
  );
};

export const NeuToggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="text-sm font-medium text-[#172B4D]">{label}</div>
        {description && <div className="text-xs text-[#64748B]">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
          checked ? 'bg-[#3478F6]' : 'neu-inset'
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export const NeuModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, subtitle, children, footer, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172B4D]/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`neu-raised-lg rounded-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden`}>
        <div className="px-6 py-4 border-b border-black/5 flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-[#172B4D]">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="neu-btn w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#172B4D] text-sm font-bold shrink-0"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-[#172B4D]">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-black/5 flex items-center justify-end gap-3 bg-[#E9EEF3]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = 'h-16 w-full' }) => (
  <div className={`neu-inset rounded-xl animate-pulse bg-[#dfe5ec] ${className}`} />
);
