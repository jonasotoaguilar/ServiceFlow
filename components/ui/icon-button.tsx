import * as React from "react";
import { cn } from "@/lib/utils";

type IconButtonVariant = "neutral" | "primary" | "danger" | "warning";

const variantClasses: Record<IconButtonVariant, string> = {
	neutral: "bg-surface border-border text-foreground-muted hover:bg-surface-muted hover:text-foreground",
	primary: "bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-on-primary",
	danger: "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive hover:text-white",
	warning: "bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500 hover:text-white",
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: IconButtonVariant;
}

export function IconButton({
	variant = "neutral",
	className,
	children,
	...props
}: IconButtonProps) {
	return (
		<button
			type="button"
			className={cn(
				"inline-flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
				variantClasses[variant],
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}

// compat aliases for task description
export const variantMap = variantClasses;
