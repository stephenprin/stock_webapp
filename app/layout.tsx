import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ConsoleFilter } from "@/components/ConsoleFilter";
import { AutumnProvider } from "autumn-js/react";
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
  title: "Signal AI",
  description:
    "Track real time stock prices, news and get personalized company insights",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AutumnProvider 
          betterAuthUrl={process.env.NEXT_PUBLIC_BETTER_AUTH_URL}
          backendUrl={typeof window !== 'undefined' ? window.location.origin : undefined}
      >
        <ConsoleFilter />
        {children}
        <Toaster />
        </AutumnProvider>
      </body>
    </html>
  );
}
