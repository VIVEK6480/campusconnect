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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.replace("/admin/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard";
    }

    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        flex w-[236px] flex-col
        bg-gradient-to-b from-[#070d22] via-[#080e24] to-[#050a1a]
        text-white shadow-2xl
        transition-transform duration-300 ease-in-out

        lg:translate-x-0
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* =====================================================
          LOGO
      ====================================================== */}

      <div className="flex h-[82px] shrink-0 items-center justify-between border-b border-white/10 px-5">
        <Link
          href="/admin/dashboard"
          onClick={onClose}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-600/25">
            <GraduationCap size={23} />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight">
              CampusConnect
            </h1>

            <p className="text-xs text-blue-300/80">
              Admin Portal
            </p>
          </div>
        </Link>

        {/* MOBILE CLOSE */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <div className="flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/45">
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
                  group flex items-center gap-3 rounded-xl
                  px-3 py-3 text-sm font-medium
                  transition-all duration-200

                  ${
                    active
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-900/30"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }
                `}
              >
                <span
                  className={`
                    transition
                    ${
                      active
                        ? "text-white"
                        : "text-slate-500 group-hover:text-blue-300"
                    }
                  `}
                >
                  <Icon size={18} />
                </span>

                <span className="flex-1">{item.label}</span>

                {active && (
                  <ChevronRight
                    size={15}
                    className="text-white/70"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* SYSTEM */}
        <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/45">
          System
        </p>

        <nav>
          <Link
            href="/admin/settings"
            onClick={onClose}
            className={`
              group flex items-center gap-3 rounded-xl
              px-3 py-3 text-sm font-medium transition
              ${
                pathname.startsWith("/admin/settings")
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }
            `}
          >
            <Settings
              size={18}
              className="text-slate-500 group-hover:text-blue-300"
            />

            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* =====================================================
          BOTTOM
      ====================================================== */}

      <div className="shrink-0 border-t border-white/10 p-4">
        {/* SYSTEM STATUS */}
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-blue-400/10 bg-blue-500/[0.06] px-3 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-400" />
          </span>

          <span className="text-xs font-medium text-blue-200">
            System Online
          </span>
        </div>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}