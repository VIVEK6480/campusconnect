 "use client";

import {
  Bell,
  RefreshCw,
  UserCircle,
  Menu,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TopNavbarProps {
  mobileMenuOpen: boolean;
  onMenuClick: () => void;
}

type AdminProfile = {
  name?: string | null;
  email?: string | null;
  profileImage?: string | null;
  role?: string | null;
};

type AdminSettingsResponse = {
  success?: boolean;
  message?: string;
  user?: AdminProfile;
};

export default function TopNavbar({
  mobileMenuOpen,
  onMenuClick,
}: TopNavbarProps) {
  const router = useRouter();

  const [adminProfile, setAdminProfile] =
    useState<AdminProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAdminProfile = async () => {
      try {
        const response = await fetch(
          "/api/admin/settings",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data: AdminSettingsResponse =
          await response.json();

        if (
          !cancelled &&
          data.success &&
          data.user
        ) {
          setAdminProfile(data.user);
        }
      } catch (error) {
        console.error(
          "TOP NAVBAR ADMIN PROFILE ERROR:",
          error
        );
      }
    };

    const timer = window.setTimeout(() => {
      void loadAdminProfile();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const adminName =
    adminProfile?.name?.trim() ||
    "Administrator";

  const adminRole =
    adminProfile?.role === "SUPER_ADMIN"
      ? "Super Admin"
      : "System Admin";

  const adminInitial =
    adminName.charAt(0).toUpperCase() || "A";

  const openSettings = () => {
    router.push("/admin/settings");
  };

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

          {/* ADMIN PROFILE / SETTINGS */}

          <button
            type="button"
            onClick={openSettings}
            aria-label="Open Admin Settings"
            className="group hidden items-center gap-2 rounded-2xl px-2 py-1.5 text-left transition hover:bg-blue-50 sm:flex"
          >

            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 transition group-hover:text-blue-700">
                {adminName}
              </p>

              <p className="text-[11px] text-slate-400 transition group-hover:text-blue-500">
                {adminRole}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/20 ring-2 ring-white transition duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-blue-500/30">
              {adminProfile?.profileImage ? (
                <img
                  src={adminProfile.profileImage}
                  alt={adminName}
                  className="h-full w-full object-cover"
                />
              ) : (
                adminInitial
              )}
            </div>

          </button>

          {/* MOBILE PROFILE */}

          <button
            type="button"
            onClick={openSettings}
            aria-label="Open Admin Settings"
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full transition hover:scale-105 sm:hidden"
          >
            {adminProfile?.profileImage ? (
              <img
                src={adminProfile.profileImage}
                alt={adminName}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <UserCircle
                size={28}
                className="text-blue-600"
              />
            )}
          </button>

        </div>
      </div>
    </header>
  );
}
