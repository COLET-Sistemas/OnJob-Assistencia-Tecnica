"use client";

import { ToastProvider } from "./ToastContainer";

export default function ClientToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToastProvider>{children}</ToastProvider>;
}
