import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?:
		| "default"
		| "secondary"
		| "destructive"
		| "outline"
		| "success"
		| "warning";
}

function Badge({
	className,
	variant = "default",
	...props
}: Readonly<BadgeProps>) {
	const variants = {
		default:
			"border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
		secondary:
			"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive:
			"border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
		outline: "text-foreground",
		success:
			"border-transparent bg-emerald-500 text-emerald-950 dark:bg-emerald-500 dark:text-emerald-950",
		warning:
			"border-transparent bg-amber-500 text-amber-950 dark:bg-amber-500 dark:text-amber-950",
	};

	return (
		<div
			className={cn(
				"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 dark:border-zinc-800 dark:focus:ring-zinc-300",
				variants[variant],
				className,
			)}
			{...props}
		/>
	);
}

export { Badge };
