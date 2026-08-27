import * as React from "react";
import { X } from "lucide-react";

interface DialogProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
	headerActions?: React.ReactNode;
}

const maxWidths = {
	sm: "max-w-[384px]",
	md: "max-w-[448px]",
	lg: "max-w-[512px]",
	xl: "max-w-[576px]",
	"2xl": "max-w-[672px]",
	"3xl": "max-w-[768px]",
};

export function Dialog({
	isOpen,
	onClose,
	title,
	children,
	maxWidth = "lg",
	headerActions,
}: Readonly<DialogProps>) {
	const dialogRef = React.useRef<HTMLDivElement>(null);
	const previousFocusRef = React.useRef<HTMLElement | null>(null);
	const titleId = React.useId();

	React.useEffect(() => {
		if (!isOpen) return;
		previousFocusRef.current = document.activeElement as HTMLElement | null;

		const dialogEl = dialogRef.current;
		if (!dialogEl) return;

		const getFocusable = () =>
			Array.from(
				dialogEl.querySelectorAll<HTMLElement>(
					'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
				),
			);

		// Focus first element on open
		const id = window.requestAnimationFrame(() => {
			const focusable = getFocusable();
			(focusable[0] ?? dialogEl).focus();
		});

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				onClose();
				return;
			}
			if (e.key === "Tab") {
				const focusable = getFocusable();
				if (focusable.length === 0) {
					e.preventDefault();
					return;
				}
				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				const active = document.activeElement as HTMLElement | null;
				if (!e.shiftKey && active === last) {
					e.preventDefault();
					first.focus();
				} else if (e.shiftKey && active === first) {
					e.preventDefault();
					last.focus();
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			window.cancelAnimationFrame(id);
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = prevOverflow;
			// Return focus to trigger
			previousFocusRef.current?.focus();
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: overlay dismiss via click — keyboard via Escape handler
		// biome-ignore lint/a11y/useKeyWithClickEvents: overlay click complement is Escape; inner dialog stops propagation
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40"
			onClick={onClose}
			aria-hidden={undefined}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: inner container stops propagation, keyboard handled at document */}
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				tabIndex={-1}
				className={`w-full ${maxWidths[maxWidth]} rounded-[12px] border border-border bg-surface text-foreground shadow-lg overflow-hidden flex flex-col max-h-[90dvh] focus:outline-none`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-surface">
					<h2 id={titleId} className="text-xl font-semibold text-foreground">
						{title}
					</h2>
					<div className="flex items-center gap-2">
						{headerActions}
						<button
							type="button"
							onClick={onClose}
							aria-label="Cerrar"
							className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							<X className="h-5 w-5" aria-hidden="true" />
						</button>
					</div>
				</div>
				<div className="px-6 py-6 overflow-y-auto custom-scrollbar">{children}</div>
			</div>
		</div>
	);
}
