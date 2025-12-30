"use client";

import { useState, useEffect } from "react";
import { NAV_ITEMS } from "@/lib/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Search } from "lucide-react";
import StockSearchCommand from "./StockSearchCommand";

function NavItems() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut: Cmd+K or Ctrl+K to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";

    return pathname.startsWith(path);
  };

  return (
    <>
    <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
      {NAV_ITEMS.map(({ href, label }) => {
          // Make Search navigation item trigger the search command dialog
          if (href === "/search") {
            return (
              <li key={href}>
                <button
                  onClick={() => setSearchOpen(true)}
                  className={`hover:text-yellow-500 transition-colors flex items-center gap-2 ${
                    isActive(href) ? "text-gray-100" : ""
                  }`}
                >
                  <Search className="h-4 w-4" />
                  {label}
                </button>
              </li>
            );
          }

        return (
          <li key={href}>
            <Link
              href={href}
              className={`hover:text-yellow-500 transition-colors ${
                isActive(href) ? "text-gray-100" : ""
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
      <StockSearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

export default NavItems;
