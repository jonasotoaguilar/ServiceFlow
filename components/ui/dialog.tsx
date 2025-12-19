import * as React from "react";
import { X } from "lucide-react";
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
}: Readonly<DialogProps>) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg border border-zinc-200 bg-white shadow-lg duration-200 sm:rounded-lg dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-zinc-950 dark:focus:ring-zinc-300"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {children}
        </div>
      </div>
    </div>
  );
}
