"use client";
import Link from "next/link";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";
import { LogoWordmark } from "./LogoWordmark";

function Header({ user }: { user: User }) {
  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <LogoWordmark />
        </Link>
        <nav className="hidden sm:block">
          <NavItems />
        </nav>

        <UserDropdown user={user} />
      </div>
    </header>
  );
}

export default Header;
