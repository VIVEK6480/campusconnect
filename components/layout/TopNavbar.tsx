"use client";

import { useState } from "react";
import {
  Bell,
  Search,
  RefreshCw,
  UserCircle,
  Menu,
} from "lucide-react";

interface TopNavbarProps {
  mobileMenuOpen: boolean;
  onMenuClick: () => void;
}

export default function TopNavbar({
  mobileMenuOpen,
  onMenuClick,
}: TopNavbarProps) {
  const [search, setSearch] = useState("");

  return (
    <header className="sticky top-0 z-30 h-[76px] border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-[1500px] items-center justify-between gap-6 px-5 sm:px-6 xl:px-8">
        {/* ===================================================
            LEFT SIDE
        ==================================================== */}

        <div className="flex min-w-0 flex-1 items-center gap-5">
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

          <div className="hidden min-w-[190px] shrink-0 sm:block">
            <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-blue-600">
              Admin Portal
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              Your campus, under your control.
            </p>
          </div>

          {/* SEARCH */}

          <div className="hidden min-w-0 max-w-[460px] flex-1 lg:block xl:max-w-[520px]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search anything..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
        </div>

        {/* ===================================================
            RIGHT SIDE
        ==================================================== */}

        <div className="flex shrink-0 items-center gap-3">
          {/* REFRESH */}

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="hidden h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:flex"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {/* NOTIFICATIONS */}

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Bell size={18} />

            <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* DIVIDER */}

          <div className="hidden h-9 w-px bg-slate-200 sm:block" />

          {/* ADMIN PROFILE */}

          <div className="hidden items-center gap-3 sm:flex">
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