"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface PublicNavigationWrapperProps {
  headerSlot: React.ReactNode;
  footerSlot: React.ReactNode;
  children: React.ReactNode;
}

export default function PublicNavigationWrapper({
  headerSlot,
  footerSlot,
  children,
}: PublicNavigationWrapperProps) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  // In the admin & creator dashboard console, hide public header & footer completely
  if (isDashboard) {
    return <main className="flex-1 min-h-screen">{children}</main>;
  }

  return (
    <>
      {headerSlot}
      <main className="flex-1">{children}</main>
      {footerSlot}
    </>
  );
}
