"use client";

import {
  Bell,
  RefreshCw,
  UserCircle,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface TopNavbarProps {
  mobileMenuOpen: boolean;
  onMenuClick: () => void;
}

export default function TopNavbar({
  mobileMenuOpen,
  onMenuClick,
}: TopNavbarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 h-[76px] border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="flex h-full w-full items-center justify-between gap-4 px-3 sm:px-4 md:px-5">

        {/* ===================================================
            LEFT SIDE
        ==================================================== */}

        <div className="flex min-w-0 items-center gap-4">

          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={19} />
          </button>

          {/* ADMIN TITLE */}

          <div className="min-w-[190px] shrink-0">
            <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-blue-600">
              Admin Portal
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              Your campus, under your control.
            </p>
          </div>
        </div>

        {/* ===================================================
            RIGHT SIDE
        ==================================================== */}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">

          {/* REFRESH */}

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="hidden h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:flex"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {/* NOTIFICATIONS */}

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/notifications"
              )
            }
            aria-label="Open Notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Bell size={18} />

            <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* DIVIDER */}

          <div className="hidden h-9 w-px bg-slate-200 sm:block" />

          {/* ADMIN PROFILE */}

          <div className="hidden items-center gap-2 sm:flex">

            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">
                Administrator
              </p>

              <p className="text-[11px] text-slate-400">
                System Admin
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/20">
              A
            </div>

          </div>

          {/* MOBILE PROFILE */}

          <div className="flex sm:hidden">
            <UserCircle
              size={28}
              className="text-blue-600"
            />
          </div>

        </div>
      </div>
    </header>
  );
}