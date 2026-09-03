import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SiteStatusProvider } from "@/components/providers/site-status-provider";
import { HydrationLoader } from "@/components/ui/hydration-loader";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Rimreserve | Professional Booking Management",
    template: "%s | Rimreserve",
  },
  description:
    "Rimreserve - Professional booking management system. View availability and book time slots with real-time calendar.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Rimreserve",
    description: "Professional booking management system for time slot reservations.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <SiteStatusProvider minDisplayMs={2000}>
              <HydrationLoader>
                {children}
              </HydrationLoader>
              <Toaster richColors position="top-right" />
            </SiteStatusProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
