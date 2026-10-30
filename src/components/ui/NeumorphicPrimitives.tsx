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
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}> = ({ children, className = '', inset = false, size = 'md', onClick }) => {
  const baseClass = inset
    ? size === 'sm'
      ? 'neu-inset-sm rounded-[16px] p-3.5 text-[#101B45] dark:text-[#F0F5FF]'
      : 'neu-inset rounded-[22px] p-5 text-[#101B45] dark:text-[#F0F5FF]'
    : size === 'sm'
      ? 'neu-raised-sm rounded-[20px] p-4 text-[#101B45] dark:text-[#F0F5FF]'
      : size === 'lg'
        ? 'neu-raised-lg rounded-[28px] p-6 sm:p-7 text-[#101B45] dark:text-[#F0F5FF]'
        : 'neu-raised rounded-[24px] p-5 sm:p-6 text-[#101B45] dark:text-[#F0F5FF]';

  return (
    <div onClick={onClick} className={`${baseClass} ${className}`}>
      {children}
    </div>
  );
};

export const NeuButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
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
      ? 'px-4 py-2 text-xs min-h-[38px]'
      : size === 'lg'
        ? 'px-7 py-3.5 text-sm min-h-[48px]'
        : 'px-5 py-2.5 text-sm min-h-[42px]';

  let variantClasses = 'neu-btn text-[#101B45] dark:text-[#F0F5FF] font-semibold';
  if (variant === 'primary') {
    variantClasses = 'neu-btn-primary text-white font-semibold';
  } else if (variant === 'danger') {
    variantClasses = 'neu-btn text-[#D63649] dark:text-[#F87171] font-semibold hover:text-[#B82538] dark:hover:text-[#FCA5A5]';
  } else if (variant === 'success') {
    variantClasses = 'neu-btn text-[#12805C] dark:text-[#34D399] font-semibold';
  } else if (variant === 'ghost') {
    variantClasses = 'text-[#68789D] dark:text-[#A5B4D0] hover:text-[#101B45] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 font-semibold transition-colors';
  }

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
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
  let colorClass = 'text-[#68789D] dark:text-[#A5B4D0]';
  let IconComp = Clock;

  switch (status) {
    case 'Confirmed':
    case 'Active':
    case 'Approved':
      colorClass = 'text-[#12805C] dark:text-[#34D399]';
      IconComp = CheckCircle2;
      break;
    case 'Pending':
    case 'Pending Approval':
      colorClass = 'text-[#C87A14] dark:text-[#FBBF24]';
      IconComp = Clock;
      break;
    case 'Reschedule Requested':
    case 'Rescheduled':
      colorClass = 'text-[#2674FF] dark:text-[#60A5FA]';
      IconComp = CalendarClock;
      break;
    case 'Rejected':
    case 'Cancelled':
    case 'Inactive':
    case 'Resigned':
      colorClass = 'text-[#D63649] dark:text-[#F87171]';
      IconComp = XCircle;
      break;
    case 'Completed':
      colorClass = 'text-[#101B45] dark:text-[#E2E8F0]';
      IconComp = ShieldCheck;
      break;
    case 'On Leave':
    case 'Blocked':
      colorClass = 'text-[#C87A14] dark:text-[#FBBF24]';
      IconComp = Ban;
      break;
    default:
      colorClass = 'text-[#68789D] dark:text-[#A5B4D0]';
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
    inputRightElement?: React.ReactNode;
  }
> = ({ label, helperText, error, rightElement, inputRightElement, id, className = '', required, ...props }) => {
  const inputId = id || `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  return (
    <div className={`flex flex-col gap-1.5 ${inputRightElement ? 'relative' : ''}`}>
      <label htmlFor={inputId} className="text-xs font-semibold text-[#101B45] dark:text-[#F0F5FF] flex items-center justify-between px-1">
        <span>
          {label} {required && <span className="text-[#D63649] dark:text-[#F87171]">*</span>}
        </span>
        {rightElement}
      </label>
      <input
        id={inputId}
        required={required}
        className={`neu-inset rounded-[18px] px-4 py-3 text-sm text-[#101B45] dark:text-[#F0F5FF] placeholder:text-[#68789D]/70 dark:placeholder:text-[#8FA1C7]/70 focus:outline-none ${
          inputRightElement ? 'pr-11' : ''
        } ${
          error ? 'ring-2 ring-[#D63649] dark:ring-[#F87171]' : ''
        } disabled:opacity-60 ${className}`}
        {...props}
      />
      {inputRightElement}
      {error ? (
        <p className="text-xs text-[#D63649] dark:text-[#F87171] font-medium flex items-center gap-1 px-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#68789D] dark:text-[#A5B4D0] px-1">{helperText}</p>
      ) : null}
    </div>
  );
};

export const NeuSelect: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    helperText?: string;
    error?: string;
    placeholder?: string;
    options: Array<{ value: string; label: string }>;
  }
> = ({ label, helperText, error, placeholder, options, id, className = '', required, ...props }) => {
  const selectId = id || `select-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-xs font-semibold text-[#101B45] dark:text-[#F0F5FF] px-1">
        {label} {required && <span className="text-[#D63649] dark:text-[#F87171]">*</span>}
      </label>
      <select
        id={selectId}
        required={required}
        className={`neu-inset rounded-[18px] px-4 py-3 text-sm text-[#101B45] dark:text-[#F0F5FF] bg-transparent dark:bg-[#0B1220] focus:outline-none ${
          error ? 'ring-2 ring-[#D63649] dark:ring-[#F87171]' : ''
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled className="bg-white dark:bg-[#0B1220] text-[#68789D] dark:text-[#8FA1C7]">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-white dark:bg-[#0B1220] text-[#101B45] dark:text-[#F0F5FF]"
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-[#D63649] dark:text-[#F87171] font-medium flex items-center gap-1 px-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#68789D] dark:text-[#A5B4D0] px-1">{helperText}</p>
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
      <label htmlFor={areaId} className="text-xs font-semibold text-[#101B45] dark:text-[#F0F5FF] px-1">
        {label} {required && <span className="text-[#D63649] dark:text-[#F87171]">*</span>}
      </label>
      <textarea
        id={areaId}
        required={required}
        className={`neu-inset rounded-[20px] px-4 py-3 text-sm text-[#101B45] dark:text-[#F0F5FF] placeholder:text-[#68789D]/70 dark:placeholder:text-[#8FA1C7]/70 focus:outline-none ${
          error ? 'ring-2 ring-[#D63649] dark:ring-[#F87171]' : ''
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-[#D63649] dark:text-[#F87171] font-medium flex items-center gap-1 px-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#68789D] dark:text-[#A5B4D0] px-1">{helperText}</p>
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
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <div className="text-sm font-semibold text-[#101B45] dark:text-[#F0F5FF]">{label}</div>
        {description && <div className="text-xs text-[#68789D] dark:text-[#A5B4D0]">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`w-13 h-7 rounded-full p-1 transition-all duration-200 cursor-pointer shrink-0 ${
          checked ? 'neu-btn-primary' : 'neu-inset'
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export const NeuModal: React.FC<{
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, open, onClose, title, subtitle, children, footer, maxWidth = 'max-w-lg' }) => {
  if (!(isOpen ?? open)) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101B45]/55 dark:bg-black/75 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`neu-raised-lg rounded-[28px] w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden border border-[#2674FF]/20 dark:border-white/10`}>
        <div className="px-6 py-5 border-b border-[#2674FF]/10 dark:border-white/10 flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-[#101B45] dark:text-[#F0F5FF]">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-[#68789D] dark:text-[#A5B4D0] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="neu-btn w-9 h-9 rounded-full flex items-center justify-center text-[#68789D] dark:text-[#A5B4D0] hover:text-[#101B45] dark:hover:text-white text-sm font-bold shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-[#101B45] dark:text-[#F0F5FF]">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-[#2674FF]/10 dark:border-white/10 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = 'h-16 w-full' }) => (
  <div className={`neu-inset rounded-[18px] animate-pulse ${className}`} />
);
