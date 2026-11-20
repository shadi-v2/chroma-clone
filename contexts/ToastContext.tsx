"use client";

import React, { createContext, useContext, useCallback, ReactNode } from "react";
import { GooeyToaster, gooeyToast } from "@/components/ui/goey-toaster";

export type ToastType = "success" | "error" | "info" | "warning";

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
  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      if (type === "success") {
        gooeyToast.success(message, { duration });
      } else if (type === "error") {
        gooeyToast.error(message, { duration: duration || 5000 });
      } else if (type === "warning") {
        gooeyToast.warning(message, { duration });
      } else {
        gooeyToast.info(message, { duration });
      }
    },
    []
  );

  const success = useCallback(
    (msg: string, dur?: number) => gooeyToast.success(msg, { duration: dur }),
    []
  );
  const error = useCallback(
    (msg: string, dur?: number) => gooeyToast.error(msg, { duration: dur || 5000 }),
    []
  );
  const info = useCallback(
    (msg: string, dur?: number) => gooeyToast.info(msg, { duration: dur }),
    []
  );
  const warning = useCallback(
    (msg: string, dur?: number) => gooeyToast.warning(msg, { duration: dur }),
    []
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      <GooeyToaster position="bottom-right" />
    </ToastContext.Provider>
  );
};
