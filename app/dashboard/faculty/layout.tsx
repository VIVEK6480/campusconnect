/* app/dashboard/faculty/layout.tsx */
"use client";

import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type FacultyUser = {
  id?: string;
  name?: string;
  email?: string;
  facultyId?: string;
  campusUserId?: string | null;
  role?: string;
  approvalStatus?: string;
};

const defaultFaculty: FacultyUser = {
  id: "",
  name: "Faculty",
  email: "faculty@campusconnect.com",
  facultyId: "FACULTY",
  role: "Faculty Member",
  approvalStatus: "APPROVED",
};

const mobileNavItems = [
  { label: "Dashboard", href: "/dashboard/faculty", icon: Home },
  {
    label: "Registration Applications",
    href: "/dashboard/faculty/registration",
    icon: ClipboardCheck,
  },
  {
    label: "Attendance",
    href: "/dashboard/faculty/attendance",
    icon: Users,
  },
  {
    label: "Events",
    href: "/dashboard/faculty/events",
    icon: CalendarDays,
  },
  {
    label: "Activities",
    href: "/dashboard/faculty/activities",
    icon: BookOpen,
  },
  {
    label: "Notifications",
    href: "/dashboard/faculty/notifications",
    icon: Bell,
  },
  {
    label: "Faculty Profile",
    href: "/dashboard/faculty/profile",
    icon: UserCircle,
  },
  {
    label: "Settings",
    href: "/dashboard/faculty/settings",
    icon: Settings,
  },
];

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<FacultyUser>(defaultFaculty);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* =========================================================
     LOAD FACULTY USER
  ========================================================== */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const possibleKeys = [
          "facultyUser",
          "faculty",
          "currentFaculty",
          "user",
        ];

        let parsed: FacultyUser | null = null;

        for (const key of possibleKeys) {
          const stored = localStorage.getItem(key);

          if (!stored) {
            continue;
          }

          try {
            const candidate = JSON.parse(stored);

            if (
              candidate &&
              typeof candidate === "object" &&
              candidate.email
            ) {
              parsed = candidate;
              break;
            }
          } catch {
            continue;
          }
        }

        if (!parsed) {
          return;
        }

        setUser({
          id: parsed.id ?? defaultFaculty.id,
          name: parsed.name ?? defaultFaculty.name,
          email: parsed.email ?? defaultFaculty.email,
          facultyId:
            parsed.facultyId ??
            parsed.campusUserId ??
            defaultFaculty.facultyId,
          campusUserId: parsed.campusUserId ?? null,
          role: parsed.role ?? defaultFaculty.role,
          approvalStatus:
            parsed.approvalStatus ?? defaultFaculty.approvalStatus,
        });
      } catch (error) {
        console.error("Faculty header user loading error:", error);
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /* Close mobile drawer when route/page navigation happens. */
  useEffect(() => {
    const closeDrawer = () => setMobileSidebarOpen(false);
    window.addEventListener("faculty-sidebar-close", closeDrawer);

    return () => {
      window.removeEventListener("faculty-sidebar-close", closeDrawer);
    };
  }, []);

  /* Lock page scroll while the mobile drawer is open. */
  useEffect(() => {
    if (!mobileSidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  const facultyName = user.name || "Faculty";
  const facultyRole = user.role || "Faculty Member";

  const initials =
    facultyName
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "FC";

  function closeMobileSidebar() {
    setMobileSidebarOpen(false);
  }

  function handleSignOut() {
    try {
      localStorage.removeItem("facultyUser");
      localStorage.removeItem("faculty");
      localStorage.removeItem("currentFaculty");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Faculty logout storage error:", error);
    }

    closeMobileSidebar();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen w-full bg-[#edf4fa]">
      {/* =====================================================
          MOBILE SIDEBAR OVERLAY
          ONLY VISIBLE BELOW LG
      ====================================================== */}
      <div
        className={`fixed inset-0 z-[180] lg:hidden ${
          mobileSidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileSidebarOpen}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close faculty sidebar"
          onClick={closeMobileSidebar}
          className={`absolute inset-0 bg-[#071525]/45 backdrop-blur-[2px] transition-opacity duration-300 ${
            mobileSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Drawer */}
        <aside
          className={`absolute left-0 top-0 flex h-full w-[286px] max-w-[86vw] flex-col border-r border-[#d8e5ee] bg-white shadow-[15px_0_50px_rgba(20,48,72,0.18)] transition-transform duration-300 ease-out ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex h-[82px] shrink-0 items-center justify-between border-b border-[#e2eaf0] px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#54bce5] text-white shadow-[0_8px_18px_rgba(84,188,229,0.22)]">
                <GraduationCap size={20} />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#3985b6]">
                  CampusConnect
                </p>
                <p className="mt-0.5 font-serif text-[17px] font-bold text-[#17283d]">
                  Faculty Portal
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeMobileSidebar}
              aria-label="Close sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce6f0] bg-[#f8fbfd] text-[#5d7288] transition-all hover:border-[#9bcbe4] hover:bg-[#edf8fc] hover:text-[#3989b7]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Faculty mini profile */}
          <div className="mx-4 mt-5 rounded-2xl border border-[#dce8ef] bg-[#f6fbfe] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#69acd2] text-[12px] font-bold text-white shadow-sm">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-[#18283d]">
                  {facultyName}
                </p>
                <p className="mt-0.5 truncate text-[9px] uppercase tracking-wide text-[#72849a]">
                  {facultyRole}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-5 flex-1 overflow-y-auto px-4 pb-4">
            <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#9aaab8]">
              Menu
            </p>

            <div className="space-y-1">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileSidebar}
                    className="group flex h-11 items-center gap-3 rounded-xl px-3 text-[11px] font-semibold text-[#526a80] transition-all duration-200 hover:translate-x-0.5 hover:bg-[#edf8fc] hover:text-[#3284b2]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f8fc] text-[#69acd2] transition-all duration-200 group-hover:bg-[#54bce5] group-hover:text-white group-hover:shadow-[0_7px_16px_rgba(84,188,229,0.22)]">
                      <Icon size={16} />
                    </span>

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom actions */}
          <div className="shrink-0 border-t border-[#e2eaf0] p-4">
            <Link
              href="/dashboard/faculty/settings"
              onClick={closeMobileSidebar}
              className="group mb-2 flex h-11 items-center gap-3 rounded-xl px-3 text-[11px] font-semibold text-[#526a80] transition-all hover:bg-[#edf8fc] hover:text-[#3284b2]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f8fc] text-[#69acd2] transition group-hover:bg-[#54bce5] group-hover:text-white">
                <Settings size={16} />
              </span>
              Settings
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[11px] font-semibold text-[#6e7180] transition-all hover:bg-red-50 hover:text-red-600"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f7f8fa] text-[#7c8794] transition group-hover:bg-red-100 group-hover:text-red-600">
                <LogOut size={16} />
              </span>
              Sign Out
            </button>
          </div>
        </aside>
      </div>

      {/* =====================================================
          COMMON FACULTY HEADER
          DESKTOP: STARTS AFTER 270px SIDEBAR
      ====================================================== */}
      <header
        className="
          sticky top-0 z-[100]
          h-[82px]
          w-full
          border-b border-[#dce6f0]
          bg-white/95
          backdrop-blur-xl

          lg:ml-[270px]
          lg:w-[calc(100%-270px)]
        "
      >
        <div className="flex h-full w-full items-center justify-between px-4 sm:px-7">
          {/* =================================================
              LEFT SIDE
          ================================================== */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {/* MOBILE HAMBURGER */}
            <button
              type="button"
              aria-label="Open faculty sidebar"
              aria-expanded={mobileSidebarOpen}
              onClick={() => setMobileSidebarOpen(true)}
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-xl
                border border-[#dce6f0]
                bg-white
                text-[#4f6680]
                shadow-sm
                transition-all duration-200
                hover:border-[#9bcbe4]
                hover:bg-[#f1f8fc]
                hover:text-[#3989b7]
                active:scale-95
                lg:hidden
              "
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3985b6] sm:text-[11px] sm:tracking-[0.2em]">
                Faculty Portal
              </p>

              <p className="mt-1 hidden text-[11px] text-[#71839a] sm:block">
                Academic management workspace
              </p>
            </div>
          </div>

          {/* =================================================
              RIGHT SIDE
          ================================================== */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* NOTIFICATION */}

            <Link
              href="/dashboard/faculty/notifications"
              aria-label="Notifications"
              className="
                relative
                flex h-10 w-10
                items-center justify-center
                rounded-xl
                border border-[#dce6f0]
                bg-white
                text-[#4f6680]
                shadow-sm
                transition-all duration-200
                hover:-translate-y-0.5
                hover:border-[#9bcbe4]
                hover:bg-[#f1f8fc]
                hover:text-[#3989b7]
              "
            >
              <Bell size={18} />

              <span
                className="
                  absolute
                  right-[9px]
                  top-[8px]
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[#54bce5]
                "
              />
            </Link>

            {/* SETTINGS */}

            <Link
              href="/dashboard/faculty/settings"
              aria-label="Settings"
              className="
                hidden
                h-10 w-10
                items-center justify-center
                rounded-xl
                border border-[#dce6f0]
                bg-white
                text-[#4f6680]
                shadow-sm
                transition-all duration-200
                hover:-translate-y-0.5
                hover:border-[#9bcbe4]
                hover:bg-[#f1f8fc]
                hover:text-[#3989b7]
                sm:flex
              "
            >
              <Settings size={18} />
            </Link>

            {/* DIVIDER */}

            <div className="hidden h-8 w-px bg-[#dce6f0] sm:block" />

            {/* =================================================
                FACULTY PROFILE
                MOBILE: hidden
            ================================================== */}

            <Link
              href="/dashboard/faculty/profile"
              aria-label="Open Faculty Profile"
              className="
                hidden
                items-center
                gap-2.5
                rounded-xl
                px-2
                py-1.5
                transition-all
                duration-200
                hover:bg-[#f1f8fc]
                sm:flex
              "
            >
              {/* AVATAR */}

              <div
                className="
                  flex
                  h-10 w-10
                  shrink-0
                  items-center justify-center
                  rounded-full
                  bg-[#69acd2]
                  text-[12px]
                  font-bold
                  text-white
                  transition-all
                  duration-200
                "
              >
                {initials}
              </div>

              {/* NAME + ROLE */}

              <div>
                <p className="text-[12px] font-semibold text-[#18283d]">
                  {facultyName}
                </p>

                <p className="text-[10px] uppercase text-[#72849a]">
                  {facultyRole}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================
          FACULTY PANEL CONTENT
      ====================================================== */}

      <div className="w-full">{children}</div>
    </div>
  );
}
