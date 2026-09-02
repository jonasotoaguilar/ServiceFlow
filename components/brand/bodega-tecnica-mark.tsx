import * as React from "react";

type Props = {
	className?: string;
	showServiceFlow?: boolean;
};

/**
 * Bodega Técnica lockup — server-safe, uses inline SVG.
 * Mark: 32×32 currentColor 2px, 8px square 2×2 slot one filled.
 * Wordmark "Bodega Técnica"; ServiceFlow muted and hidden at 390px.
 */
export function BodegaTecnicaMark({ className, showServiceFlow = true }: Readonly<Props>) {
	return (
		<div className={className ?? "flex items-center gap-3"}>
			<span
				className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-on-primary shrink-0"
				aria-hidden="true"
			>
				<svg
					viewBox="0 0 32 32"
					width={20}
					height={20}
					fill="none"
					stroke="currentColor"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<rect x="8" y="8" width="16" height="16" rx="1" />
					<line x1="16" y1="8" x2="16" y2="24" />
					<line x1="8" y1="16" x2="24" y2="16" />
					<rect x="8" y="8" width="8" height="8" fill="currentColor" stroke="none" />
				</svg>
			</span>
			<span className="flex flex-col leading-none">
				<span className="text-sm font-semibold tracking-tight text-foreground">Bodega Técnica</span>
				{showServiceFlow ? (
					<span className="hidden text-sm font-medium text-foreground-muted sm:inline">
						ServiceFlow
					</span>
				) : null}
			</span>
			{/* source reference for audit: assets/brand/bodega-tecnica-mark.svg */}
			<span className="sr-only">bodega-tecnica-mark.svg</span>
		</div>
	);
}

export default BodegaTecnicaMark;
