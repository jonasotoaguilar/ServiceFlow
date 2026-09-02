import * as React from "react";

export type PageEmptyStateProps = {
	title: string;
	description: string;
	actionLabel: string;
	onAction: () => void;
};

/**
 * Reusable empty state — Spanish strings supplied via props.
 * Action is contextual; no English tokens.
 */
export function PageEmptyState({
	title,
	description,
	actionLabel,
	onAction,
}: Readonly<PageEmptyStateProps>) {
	return (
		<div className="flex flex-col items-center justify-center gap-4 rounded-sm border border-border bg-surface p-4 text-center">
			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-foreground">{title}</h3>
				<p className="text-sm text-foreground-muted">{description}</p>
			</div>
			<button
				type="button"
				onClick={onAction}
				className="inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover transition-colors"
			>
				{actionLabel}
			</button>
		</div>
	);
}

export default PageEmptyState;
