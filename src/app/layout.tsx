import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientToastProvider from "@/components/admin/ui/ClientToastProvider";
import { FeedbackProvider } from "@/context/FeedbackContext";
import AuthStorageCleaner from "@/components/AuthStorageCleaner";
import NotificacoesUpdater from "@/components/NotificacoesUpdater";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OnJob Assistência Técnica",
  description: "OnJob Assistência Técnica",
  icons: {
    icon: [
      { url: "/FaviconOnJob-16x16.svg", sizes: "16x16", type: "image/svg+xml" },
      { url: "/FaviconOnJob-32x32.svg", sizes: "32x32", type: "image/svg+xml" },
      { url: "/FaviconOnJob-96x96.svg", sizes: "96x96", type: "image/svg+xml" },
      {
        url: "/FaviconOnJob-180x180.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/FaviconOnJob-180x180.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <FeedbackProvider>
          <ClientToastProvider>
            <AuthStorageCleaner />
            <NotificacoesUpdater />
            {children}
          </ClientToastProvider>
        </FeedbackProvider>
      </body>
    </html>
  );
}
