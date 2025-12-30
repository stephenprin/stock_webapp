import { LogoWordmark } from "@/components/LogoWordmark";
import Link from "next/link";
import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/better-auth/auth";

async function Layout({ children }: { children: React.ReactNode }) {  
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-6">
          <Link href="/" className="inline-block">
            <LogoWordmark />
          </Link>
          <Link 
            href="/support" 
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Support
          </Link>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Layout;
