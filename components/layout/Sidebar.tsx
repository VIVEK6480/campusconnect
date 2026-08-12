"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  ClipboardCheck,
  UserPlus,
  Megaphone,
  Award,
  Bell,
  Settings,
  LogOut,
  GraduationCap,
  X,
  ChevronRight,
  UserCheck,
  UserCog,
} from "lucide-react";

interface SidebarProps {
  mobileMenuOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Clubs",
    href: "/admin/clubs",
    icon: Building2,
  },
  {
    label: "Events",
    href: "/admin/events",
    icon: CalendarDays,
  },
  {
    label: "Attendance",
    href: "/admin/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "Memberships",
    href: "/admin/memberships",
    icon: UserPlus,
  },
  {
    label: "Student Approval",
    href: "/admin/student-approval",
    icon: UserCheck,
  },
  {
    label: "Faculty Approval",
    href: "/admin/faculty-approval",
    icon: UserCog,
  },
  {
    label: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone,
  },
  {
    label: "Certificates",
    href: "/admin/certificates",
    icon: Award,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
];

export default function Sidebar({
  mobileMenuOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === href;
    }

    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    router.replace("/admin/login");
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[248px] flex-col
          bg-gradient-to-b from-[#071127] via-[#08132a] to-[#050b1b]
          text-white shadow-[8px_0_30px_rgba(15,23,42,0.10)]
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"}
        `}
      >
        {/* =================================================
            BRAND
        ================================================== */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.08] px-5">
          <Link
            href="/admin/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-600/25">
              <GraduationCap size={21} />
            </div>

            <div>
              <h1 className="text-[15px] font-bold tracking-tight text-white">
                CampusConnect
              </h1>

              <p className="mt-0.5 text-[10px] font-medium text-blue-300">
                Admin Portal
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================== */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/45">
            Management
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    group flex h-10 items-center gap-3 rounded-xl
                    px-3 text-[13px] font-medium
                    transition-all duration-200
                    ${
                      active
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-900/30"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                    }
                  `}
                >
                  <Icon
                    size={17}
                    className={
                      active
                        ? "text-white"
                        : "text-slate-500 group-hover:text-blue-300"
                    }
                  />

                  <span className="flex-1">
                    {item.label}
                  </span>

                  {active && (
                    <ChevronRight
                      size={14}
                      className="text-white/70"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* SYSTEM */}
          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/45">
            System
          </p>

          <Link
            href="/admin/settings"
            onClick={onClose}
            className={`
              group flex h-10 items-center gap-3 rounded-xl
              px-3 text-[13px] font-medium transition
              ${
                pathname.startsWith("/admin/settings")
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }
            `}
          >
            <Settings
              size={17}
              className={
                pathname.startsWith("/admin/settings")
                  ? "text-white"
                  : "text-slate-500 group-hover:text-blue-300"
              }
            />

            <span>Settings</span>
          </Link>
        </div>

        {/* =================================================
            BOTTOM
        ================================================== */}
        <div className="shrink-0 border-t border-white/[0.08] p-3">
          {/* SYSTEM STATUS */}
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-blue-400/10 bg-blue-500/[0.06] px-3 py-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
            </span>

            <span className="text-[11px] font-medium text-blue-200">
              System Online
            </span>
          </div>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}