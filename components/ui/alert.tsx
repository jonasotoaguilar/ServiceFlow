"use client";

import * as React from "react";
import { X, AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

export type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
	variant: AlertVariant;
	title?: string;
	message: string;
	onClose?: () => void;
}

const alertStyles: Record<
	AlertVariant,
	{ container: string; icon: string; iconBg: string }
> = {
	error: {
		container: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
		icon: "text-red-600 dark:text-red-400",
		iconBg: "bg-red-100 dark:bg-red-900/30",
	},
	success: {
		container: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
		icon: "text-green-600 dark:text-green-400",
		iconBg: "bg-green-100 dark:bg-green-900/30",
	},
	warning: {
		container: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
		icon: "text-yellow-600 dark:text-yellow-400",
		iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
	},
	info: {
		container: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
		icon: "text-blue-600 dark:text-blue-400",
		iconBg: "bg-blue-100 dark:bg-blue-900/30",
	},
};

const icons: Record<AlertVariant, React.ElementType> = {
	error: XCircle,
	success: CheckCircle,
	warning: AlertCircle,
	info: Info,
};

export function Alert({
	variant,
	title,
	message,
	onClose,
}: Readonly<AlertProps>) {
	const styles = alertStyles[variant];
	const Icon = icons[variant];

	return (
		<div
			className={`relative flex items-start gap-3 rounded-lg border p-4 ${styles.container}`}
		>
			<div className={`flex-shrink-0 rounded-full p-1 ${styles.iconBg}`}>
				<Icon className={`h-4 w-4 ${styles.icon}`} />
			</div>
			<div className="flex-1 min-w-0">
				{title && <p className="font-semibold text-sm">{title}</p>}
				<p className="text-sm leading-relaxed">{message}</p>
			</div>
			{onClose && (
				<button
					type="button"
					onClick={onClose}
					className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
				>
					<X className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}
