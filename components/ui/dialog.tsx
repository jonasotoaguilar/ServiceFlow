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
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div
				className={`glass-effect w-full ${maxWidths[maxWidth]} rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
			>
				<div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
					<div>
						<h2 className="text-xl font-bold text-white">{title}</h2>
					</div>
					<div className="flex items-center gap-2">
						{headerActions}
						<button
							type="button"
							onClick={onClose}
							className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg"
						>
							<X className="h-5 w-5" />
						</button>
					</div>
				</div>
				<div className="px-6 py-6 overflow-y-auto custom-scrollbar">{children}</div>
			</div>
		</div>
	);
}
