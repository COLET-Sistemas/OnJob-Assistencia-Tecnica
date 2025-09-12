"use client";

import { ToastProvider } from "./ToastContainer";
import ForbiddenErrorHandler from "./ForbiddenErrorHandler";

export default function ClientToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      {children}
      <ForbiddenErrorHandler />
    </ToastProvider>
  );
}
