import * as React from "react";

type Props = {
	className?: string;
	showServiceFlow?: boolean;
};

/**
 * Bodega Técnica lockup — refined shelf-grid mark.
 * Geometry: 18×18 outer at 7,7 rx1.5, optical 1.5px at 32, 9×9 filled bay top-left.
 * Palette preserved: bg-primary text-on-primary (7.04:1). Inline SVG synced with brand mark asset.
 * Accessibility: decorative mark aria-hidden, wordmark carries visible name, no duplicate hidden announcement.
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
					strokeWidth={1.5}
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<rect x="7" y="7" width="18" height="18" rx="1.5" />
					<line x1="16" y1="7" x2="16" y2="25" />
					<line x1="7" y1="16" x2="25" y2="16" />
					<rect x="7" y="7" width="9" height="9" fill="currentColor" stroke="none" />
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
		</div>
	);
}

export default BodegaTecnicaMark;
