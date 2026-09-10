"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep maximum 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const success = useCallback(
    (msg: string, dur?: number) => addToast(msg, "success", dur),
    [addToast],
  );
  const error = useCallback(
    (msg: string, dur?: number) => addToast(msg, "error", dur || 5000),
    [addToast],
  );
  const info = useCallback(
    (msg: string, dur?: number) => addToast(msg, "info", dur),
    [addToast],
  );
  const warning = useCallback(
    (msg: string, dur?: number) => addToast(msg, "warning", dur),
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
              t.type === "success"
                ? "bg-emerald-950/95 text-cream-50 border-emerald-500/30 shadow-emerald-950/20"
                : t.type === "error"
                ? "bg-red-950/95 text-red-50 border-red-500/30 shadow-red-950/20"
                : t.type === "warning"
                ? "bg-amber-950/95 text-amber-50 border-amber-500/30 shadow-amber-950/20"
                : "bg-emerald-900/95 text-cream-50 border-emerald-700/30 shadow-emerald-950/20"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {t.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              {t.type === "error" && (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              {t.type === "warning" && (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              {t.type === "info" && (
                <Info className="w-5 h-5 text-sky-400 shrink-0" />
              )}
              <p className="text-xs sm:text-sm font-medium leading-snug break-words">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
