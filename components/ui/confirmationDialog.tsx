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
			? "bg-destructive/10 text-destructive border border-destructive/20"
			: variant === "warning"
				? "bg-pending-bg text-pending-fg border border-pending-border"
				: "bg-surface-muted text-foreground-muted border border-border";

	const confirmButtonStyles = (() => {
		if (variant === "danger")
			return "bg-destructive hover:bg-destructive/90 text-destructive-foreground";
		if (variant === "warning")
			return "bg-pending-bg hover:bg-pending-bg/90 text-pending-fg border border-pending-border";
		return "bg-primary hover:bg-primary-hover text-on-primary";
	})();

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title={title}>
			<div className="space-y-4">
				<div className="flex items-start gap-4">
					<div className={`mt-0.5 rounded-full p-2 ${iconContainerStyles}`}>
						<AlertTriangle className="h-5 w-5" />
					</div>
					<p className="text-sm text-foreground-muted leading-relaxed">{description}</p>
				</div>

				<div className="flex justify-end gap-3 pt-4 border-t border-border">
					<Button
						variant="ghost"
						onClick={onClose}
						disabled={isLoading}
						className="text-foreground-muted hover:text-foreground hover:bg-surface-muted"
					>
						{cancelText}
					</Button>
					<Button onClick={onConfirm} disabled={isLoading} className={confirmButtonStyles}>
						{isLoading ? "Procesando..." : confirmText}
					</Button>
				</div>
			</div>
		</Dialog>
	);
}
