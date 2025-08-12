"use client";

import React, { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, footer, className }: DialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const ids = useMemo(() => ({
    titleId: title ? `dialog-title-${Math.random().toString(36).slice(2)}` : undefined,
    descId: description ? `dialog-desc-${Math.random().toString(36).slice(2)}` : undefined,
  }), [title, description]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ids.titleId}
        aria-describedby={ids.descId}
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border bg-popover text-popover-foreground p-5 shadow-lg",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
      >
        {(title || description) && (
          <div className="mb-3">
            {title && <h3 id={ids.titleId} className="text-lg font-semibold">{title}</h3>}
            {description && <p id={ids.descId} className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        )}
        {children}
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}


