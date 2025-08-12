"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
  className?: string;
}

export function ContextMenu({
  items,
  position,
  onClose,
  className
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    if (isMobile) {
      // For mobile, position at bottom
      menu.style.left = '0';
      menu.style.bottom = '0';
      menu.style.top = 'auto';
      menu.style.width = '100%';
      menu.style.maxHeight = '70vh';
    } else {
      // For desktop, use original positioning logic
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;

      let x = position.x;
      let y = position.y;

      if (x + menuWidth > viewportWidth) {
        x = viewportWidth - menuWidth - 8;
      }

      if (y + menuHeight > viewportHeight) {
        y = viewportHeight - menuHeight - 8;
      }

      menu.style.left = `${Math.max(8, x)}px`;
      menu.style.top = `${Math.max(8, y)}px`;
      menu.style.bottom = 'auto';
      menu.style.width = 'auto';
      menu.style.maxHeight = 'none';
    }
  }, [position, isMobile]);

  if (isMobile) {
    return (
      <>
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 z-40 bg-black/50 animate-in fade-in"
          onClick={onClose}
        />
        {/* Mobile bottom sheet menu */}
        <div
          ref={menuRef}
          className={cn(
            "fixed z-50 w-full max-h-[70vh] overflow-y-auto",
            "bg-popover border-t rounded-t-xl shadow-lg",
            "animate-in slide-in-from-bottom-80 duration-300",
            className
          )}
          role="menu"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Drag handle */}
          <div className="sticky top-0 z-10 flex justify-center py-2 bg-popover">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
          
          {/* Menu items */}
          <div className="p-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item.onClick?.();
                  onClose();
                }}
                disabled={item.disabled}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-lg px-4 py-3 text-base outline-none transition-colors mb-1",
                  "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                  "disabled:pointer-events-none disabled:opacity-50",
                  item.danger && "hover:bg-destructive/10 hover:text-destructive"
                )}
                role="menuitem"
              >
                {item.icon && (
                  <span className="mr-3 inline-flex items-center justify-center h-5 w-5 text-muted-foreground">
                    {item.icon}
                  </span>
                )}
                <span className="text-left">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Desktop context menu
  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      role="menu"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            item.onClick?.();
            onClose();
          }}
          disabled={item.disabled}
          className={cn(
            "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            "disabled:pointer-events-none disabled:opacity-50",
            item.danger && "hover:bg-destructive/10 hover:text-destructive"
          )}
          role="menuitem"
        >
          {item.icon && (
            <span className="mr-2 inline-flex items-center justify-center h-4 w-4 text-muted-foreground">
              {item.icon}
            </span>
          )}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}