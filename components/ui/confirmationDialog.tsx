"use client";

import * as React from "react";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
}: Readonly<ConfirmationDialogProps>) {
  const iconContainerStyles =
    variant === "danger"
      ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
      : "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400";

  const confirmButtonStyles = (() => {
    if (variant === "danger") return "bg-red-600 hover:bg-red-700 text-white";
    if (variant === "warning")
      return "bg-orange-600 hover:bg-orange-700 text-white";
    return "bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200";
  })();

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 rounded-full p-2 ${iconContainerStyles}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-500 hover:text-white hover:bg-white/10 dark:text-zinc-400 dark:hover:text-white"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmButtonStyles}
          >
            {isLoading ? "Procesando..." : confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
