"use client";

import { useState } from "react";
import { X, AlertCircle, Check, Loader2 } from "lucide-react";
import clsx from "clsx";

// ── Button ─────────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "text-white font-semibold",
  secondary: "font-medium",
  ghost: "font-medium",
  danger: "text-white font-semibold",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  className,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const sizeClasses = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" }[size];

  const variantStyle: React.CSSProperties =
    variant === "primary"
      ? { background: "var(--accent)", border: "1px solid transparent" }
      : variant === "secondary"
      ? { background: "var(--surface-overlay)", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }
      : variant === "ghost"
      ? { background: "transparent", border: "1px solid transparent", color: "var(--text-secondary)" }
      : { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" };

  return (
    <button
      className={clsx(
        "inline-flex items-center gap-2 rounded-lg transition-all duration-150",
        sizeClasses,
        BUTTON_VARIANTS[variant],
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{ ...variantStyle, ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  idea: { bg: "rgba(85,85,128,0.2)", text: "var(--text-muted)" },
  brief: { bg: "rgba(136,136,176,0.2)", text: "var(--text-secondary)" },
  draft: { bg: "rgba(240,180,41,0.15)", text: "var(--gold)" },
  review: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  approved: { bg: "rgba(45,212,191,0.15)", text: "var(--jade)" },
  published: { bg: "rgba(110,86,207,0.2)", text: "var(--accent-light)" },
  active: { bg: "rgba(45,212,191,0.15)", text: "var(--jade)" },
  paused: { bg: "rgba(240,180,41,0.15)", text: "var(--gold)" },
  completed: { bg: "rgba(45,212,191,0.15)", text: "var(--jade)" },
  running: { bg: "rgba(240,180,41,0.15)", text: "var(--gold)" },
  failed: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
};

export function Badge({ status, label }: { status: string; label?: string }) {
  const colors = STATUS_COLORS[status] ?? { bg: "rgba(136,136,176,0.2)", text: "var(--text-secondary)" };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-full"
      style={{ background: colors.bg, color: colors.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.text }} />
      {label ?? status}
    </span>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, footer, width = 540 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full rounded-2xl animate-fade-up"
        style={{
          maxWidth: width,
          background: "var(--surface-raised)",
          border: "1px solid var(--border-bright)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md transition-colors hover:bg-surface-overlay"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 px-6 py-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FormField ──────────────────────────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}

export function FormField({ label, error, children, required, hint }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
        {required && <span style={{ color: "var(--ember)" }}>*</span>}
      </div>
      {children}
      {hint && !error && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{hint}</p>}
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ options, placeholder, style, className, ...props }: SelectProps) {
  return (
    <select
      className={className}
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
        ...style,
      }}
      {...props}
    >
      {placeholder && (
        <option value="" style={{ background: "var(--surface-raised)" }}>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "var(--surface-raised)" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── PageHeader ─────────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(110,86,207,0.1)", border: "1px solid var(--border-bright)" }}
      >
        <Icon size={22} style={{ color: "var(--accent-light)" }} />
      </div>
      <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      {description && (
        <p className="text-sm mb-5 max-w-xs" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// ── Confirm dialog ─────────────────────────────────────────────────────────────
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={420}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
        </>
      }
    >
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
    </Modal>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const show = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const ToastEl = toast ? (
    <div
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-up shadow-2xl"
      style={{
        background: toast.type === "success" ? "rgba(45,212,191,0.15)" : "rgba(239,68,68,0.15)",
        border: `1px solid ${toast.type === "success" ? "rgba(45,212,191,0.4)" : "rgba(239,68,68,0.4)"}`,
        backdropFilter: "blur(8px)",
      }}
    >
      {toast.type === "success" ? (
        <Check size={15} style={{ color: "var(--jade)" }} />
      ) : (
        <AlertCircle size={15} style={{ color: "#ef4444" }} />
      )}
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {toast.message}
      </p>
    </div>
  ) : null;

  return { show, ToastEl };
}
