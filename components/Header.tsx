"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = "" }) => {
  return (
    <header
      className={`
        w-full 
        bg-card border-b border-border
        shadow-sm
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
            aria-label="WordyWay - Go to homepage"
          >
            <Image
              src="/logo.png"
              alt="WordyWay Logo"
              width={150}
              height={150}
              className="object-contain"
              priority
            />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-card-foreground transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/workbook"
              className="text-sm font-medium text-muted-foreground hover:text-card-foreground transition-colors duration-200"
            >
              Workbooks
            </Link>
          </nav>

          {/* Theme Toggle */}
          <div className="flex items-center">
            <ThemeToggle size="md" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
