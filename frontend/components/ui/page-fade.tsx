"use client";
import { usePathname } from "next/navigation";
import React from "react";

export default function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="fade-in">
      {children}
    </div>
  );
}


