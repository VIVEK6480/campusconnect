"use client";

import Link from "next/link";
import {
  Bell,
  Menu,
  X,
} from "lucide-react";

interface TopNavbarProps {
  mobileMenuOpen: boolean;
  onMenuClick: () => void;
}

export default function TopNavbar({
  mobileMenuOpen,
  onMenuClick,
}: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-xl sm:px-6 lg:px-8">

      {/* LEFT */}
      <div className="flex min-w-0 items-center gap-3">

        {/* MOBILE MENU */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
        >
          {mobileMenuOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>

        {/* DESKTOP ADMIN PORTAL TITLE */}
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
            Admin Portal
          </p>

          <p className="truncate text-xs text-slate-500">
            Your campus, your administration.
          </p>
        </div>

        {/* MOBILE TITLE */}
        <div className="min-w-0 lg:hidden">
          <p className="truncate text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            Admin Portal
          </p>

          <p className="truncate text-xs text-slate-500">
            Your campus, your administration.
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-5">

        {/* NOTIFICATION */}
        <Link
          href="/admin/notifications"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
        >
          <Bell size={19} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </Link>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* ADMIN PROFILE */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">
              Administrator
            </p>

            <p className="text-xs text-slate-500">
              System Admin
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/20">
            A
          </div>
        </div>
      </div>
    </header>
  );
}