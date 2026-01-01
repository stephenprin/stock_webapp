"use client";
import Link from "next/link";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";
import { LogoWordmark } from "./LogoWordmark";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import StockSearchCommand from "./StockSearchCommand";
import { Button } from "./ui/button";

function Header({ user }: { user: User }) {
  const [searchOpen, setSearchOpen] = useState(false);
  
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

  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
          <LogoWordmark />
        </Link>
        <nav className="hidden sm:block">
          <NavItems />
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="hover:text-yellow-500 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
          <UserDropdown user={user} />
        </div>
        <StockSearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </header>
  );
}

export default Header;
