import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ConsoleFilter } from "@/components/ConsoleFilter";
import AutumnProviderWrapper from "@/components/providers/AutumnProviderWrapper";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
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
  title: "Stock tracker",
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
        <AutumnProviderWrapper>
          <ConsoleFilter />
          <ServiceWorkerRegister />
          {children}
          <Toaster />
        </AutumnProviderWrapper>
      </body>
    </html>
  );
}
