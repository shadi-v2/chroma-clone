"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { AlertCircle, AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning";
  icon?: "info" | "warning" | "destructive" | "success";
}

export interface AlertModalOptions {
  title?: string;
  message: string;
  buttonText?: string;
  variant?: "default" | "destructive" | "warning" | "success";
}

interface ConfirmationContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  modalAlert: (options: AlertModalOptions | string) => Promise<void>;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  // Confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmOptions>({ message: "" });
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);

  // Modal alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertModalOptions>({ message: "" });
  const alertResolveRef = useRef<(() => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      if (typeof options === "string") {
        setConfirmConfig({
          title: "Please Confirm",
          message: options,
          confirmText: "Confirm",
          cancelText: "Cancel",
          variant: "default",
        });
      } else {
        setConfirmConfig({
          title: options.title || "Please Confirm",
          message: options.message,
          confirmText: options.confirmText || "Confirm",
          cancelText: options.cancelText || "Cancel",
          variant: options.variant || "default",
          icon: options.icon,
        });
      }
      setConfirmOpen(true);
    });
  }, []);

  const modalAlert = useCallback((options: AlertModalOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      alertResolveRef.current = resolve;
      if (typeof options === "string") {
        setAlertConfig({
          title: "Notice",
          message: options,
          buttonText: "Dismiss",
          variant: "default",
        });
      } else {
        setAlertConfig({
          title: options.title || "Notice",
          message: options.message,
          buttonText: options.buttonText || "Dismiss",
          variant: options.variant || "default",
        });
      }
      setAlertOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    setConfirmOpen(false);
    confirmResolveRef.current?.(true);
  };

  const handleCancel = () => {
    setConfirmOpen(false);
    confirmResolveRef.current?.(false);
  };

  const handleAlertDismiss = () => {
    setAlertOpen(false);
    alertResolveRef.current?.();
  };

  return (
    <ConfirmationContext.Provider value={{ confirm, modalAlert }}>
      {children}

      {/* Global Confirmation Modal */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-emerald-950/15">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmConfig.variant === "destructive"
                    ? "bg-red-500/10 text-red-600"
                    : confirmConfig.variant === "warning"
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-emerald-950/10 text-emerald-950"
                }`}
              >
                {confirmConfig.variant === "destructive" ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : confirmConfig.variant === "warning" ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
              <AlertDialogTitle>{confirmConfig.title}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm">
              {confirmConfig.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {confirmConfig.cancelText || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                confirmConfig.variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : ""
              }
            >
              {confirmConfig.confirmText || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Global Alert Modal */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="border-emerald-950/15">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  alertConfig.variant === "destructive"
                    ? "bg-red-500/10 text-red-600"
                    : alertConfig.variant === "warning"
                    ? "bg-amber-500/10 text-amber-600"
                    : alertConfig.variant === "success"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-emerald-950/10 text-emerald-950"
                }`}
              >
                {alertConfig.variant === "destructive" ? (
                  <AlertCircle className="w-5 h-5" />
                ) : alertConfig.variant === "warning" ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : alertConfig.variant === "success" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
              <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm">
              {alertConfig.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAlertDismiss}>
              {alertConfig.buttonText || "Dismiss"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmationContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmationProvider");
  }
  return context;
}
