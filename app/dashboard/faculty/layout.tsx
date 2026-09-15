"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/* =========================================================
   FACULTY USER TYPE
========================================================= */

type FacultyUser = {
  id?: string;
  name?: string;
  email?: string;
  facultyId?: string;
  campusUserId?: string | null;
  role?: string;
  approvalStatus?: string;
  profileImage?: string | null;
};

/* =========================================================
   DEFAULT FACULTY
========================================================= */

const defaultFaculty: FacultyUser = {
  id: "",
  name: "Faculty",
  email: "faculty@campusconnect.com",
  facultyId: "FACULTY",
  role: "Faculty Member",
  approvalStatus: "APPROVED",
  profileImage: null,
};

/* =========================================================
   INSTANT LOCAL STORAGE EXTRACTOR (ZERO-LATENCY)
========================================================= */

function getInstantFacultyUser(): FacultyUser {
  if (typeof window === "undefined") return defaultFaculty;

  try {
    const cachedImage = localStorage.getItem("facultyProfileImage");
    const possibleKeys = [
      "facultyUser",
      "faculty",
      "currentFaculty",
      "user",
    ];

    for (const key of possibleKeys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        const candidate = JSON.parse(stored);
        if (candidate && typeof candidate === "object" && candidate.email) {
          return {
            id: candidate.id ?? defaultFaculty.id,
            name: candidate.name ?? defaultFaculty.name,
            email: candidate.email ?? defaultFaculty.email,
            facultyId:
              candidate.facultyId ??
              candidate.campusUserId ??
              defaultFaculty.facultyId,
            campusUserId: candidate.campusUserId ?? null,
            role: candidate.role ?? defaultFaculty.role,
            approvalStatus:
              candidate.approvalStatus ?? defaultFaculty.approvalStatus,
            profileImage:
              candidate.profileImage || cachedImage || null,
          };
        }
      } catch {
        continue;
      }
    }
  } catch {
    // Fallback to default
  }

  return defaultFaculty;
}

/* =========================================================
   MENU TYPES
========================================================= */

type MenuItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

/* =========================================================
   MAIN MENU
========================================================= */

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/faculty",
    icon: GraduationCap,
  },
  {
    label: "Students",
    href: "/dashboard/faculty/students",
    icon: Users,
  },
  {
    label: "Student Approval",
    href: "/dashboard/faculty/approvals/students",
    icon: CheckCircle2,
  },
  {
    label: "Attendance",
    href: "/dashboard/faculty/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "Events",
    href: "/dashboard/faculty/events",
    icon: CalendarDays,
  },
  {
    label: "Activities",
    href: "/dashboard/faculty/activities",
    icon: Activity,
  },
  {
    label: "Clubs",
    href: "/dashboard/faculty/clubs",
    icon: Users,
  },
  {
    label: "Notifications",
    href: "/dashboard/faculty/notifications",
    icon: Bell,
  },
];

/* =========================================================
   ACCOUNT MENU
========================================================= */

const accountItems: MenuItem[] = [
  {
    label: "Settings",
    href: "/faculty/profile",
    icon: Settings,
  },
];

/* =========================================================
   ACTIVE MENU HELPER
========================================================= */

function isFacultyPathActive(pathname: string, href: string) {
  if (href === "/dashboard/faculty") {
    return pathname === "/dashboard/faculty" || pathname === "/dashboard/faculty/";
  }
  return pathname.startsWith(href);
}

/* =========================================================
   SIDEBAR CONTENT PROPS
========================================================= */

type SidebarContentProps = {
  pathname: string;
  attendanceOpen: boolean;
  setAttendanceOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleSignOut: () => void;
  initials: string;
  facultyName: string;
  facultyRole: string;
  profileImage?: string | null;
  navigate: (href: string) => void;
};

/* =========================================================
   SIDEBAR COMPONENT
========================================================= */

function SidebarContent({
  pathname,
  attendanceOpen,
  setAttendanceOpen,
  setSidebarOpen,
  handleSignOut,
  initials,
  facultyName,
  facultyRole,
  profileImage,
  navigate,
}: SidebarContentProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [profileImage]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0d1424]">
      {/* BRAND HEADER */}
      <div className="flex h-[82px] shrink-0 items-center justify-between border-b border-[#263247] px-[24px]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] bg-[#6db6dd]">
            <GraduationCap
              size={24}
              strokeWidth={1.8}
              className="text-white"
            />
          </div>

          <div className="min-w-0">
            <h1 className="whitespace-nowrap font-serif text-[18px] font-bold tracking-[-0.2px] text-white">
              CampusConnect
            </h1>
            <p className="whitespace-nowrap font-serif text-[10px] text-[#8996aa]">
              Faculty Command Center
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Close Faculty Menu"
          onClick={() => setSidebarOpen(false)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8192a9] transition hover:bg-[#182337] hover:text-white lg:hidden"
        >
          <X size={19} />
        </button>
      </div>

      {/* SIDEBAR SCROLL CONTENT */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[18px] py-[22px] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#263247]">
        <p className="mb-[11px] px-[12px] font-serif text-[9px] font-bold uppercase tracking-[2px] text-[#6f8199]">
          Faculty Workspace
        </p>

        <nav className="space-y-[4px]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isFacultyPathActive(pathname, item.href);

            if (item.label === "Attendance") {
              const classAttendanceActive =
                pathname === "/dashboard/faculty/attendance/class";
              const eventAttendanceActive =
                pathname === "/dashboard/faculty/attendance/event";

              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={() => {
                      setAttendanceOpen((prev) => !prev);
                      navigate(item.href);
                    }}
                    className={`group relative flex h-[46px] w-full items-center rounded-[14px] px-[14px] text-left transition duration-200 ${
                      active
                        ? "bg-[#1b293e] text-[#75c6ec]"
                        : "text-[#9aa9bd] hover:bg-[#151f31] hover:text-[#c7d3e2]"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-0 h-full w-[3px] rounded-r-full bg-[#65bce5]" />
                    )}
                    <Icon
                      size={18}
                      strokeWidth={1.7}
                      className={`shrink-0 ${
                        active
                          ? "text-[#70c3eb]"
                          : "text-[#8799b0] group-hover:text-[#a9bdd2]"
                      }`}
                    />
                    <span className="ml-[12px] whitespace-nowrap font-serif text-[13px]">
                      Attendance
                    </span>
                    <ChevronRight
                      size={16}
                      className={`ml-auto text-[#70c3eb] transition-transform duration-200 ${
                        attendanceOpen ? "rotate-90" : "rotate-0"
                      }`}
                    />
                  </button>

                  <div
                    className={`relative ml-[14px] overflow-hidden border-l border-[#344157] pl-[10px] transition-all duration-300 ${
                      attendanceOpen
                        ? "mt-[4px] max-h-[140px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard/faculty/attendance/class")}
                      className={`flex h-[42px] w-full items-center rounded-[12px] px-[12px] text-left font-serif text-[12px] transition ${
                        classAttendanceActive
                          ? "bg-[#1b293e] text-white"
                          : "text-[#a9b5c7] hover:bg-[#151f31] hover:text-white"
                      }`}
                    >
                      Mark Class Attendance
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard/faculty/attendance/event")}
                      className={`flex h-[42px] w-full items-center rounded-[12px] px-[12px] text-left font-serif text-[12px] transition ${
                        eventAttendanceActive
                          ? "bg-[#1b293e] text-white"
                          : "text-[#a9b5c7] hover:bg-[#151f31] hover:text-white"
                      }`}
                    >
                      Mark Event Attendance
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigate(item.href)}
                className={`group relative flex h-[46px] w-full items-center rounded-[14px] px-[14px] text-left transition duration-200 ${
                  active
                    ? "bg-[#1b293e] text-[#75c6ec]"
                    : "text-[#9aa9bd] hover:bg-[#151f31] hover:text-[#c7d3e2]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-0 h-full w-[3px] rounded-r-full bg-[#65bce5]" />
                )}
                <Icon
                  size={18}
                  strokeWidth={1.7}
                  className={`shrink-0 ${
                    active
                      ? "text-[#70c3eb]"
                      : "text-[#8799b0] group-hover:text-[#a9bdd2]"
                  }`}
                />
                <span className="ml-[12px] whitespace-nowrap font-serif text-[13px]">
                  {item.label}
                </span>
                {active && (
                  <ChevronRight size={15} className="ml-auto text-[#70c3eb]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="my-[22px] h-px w-full bg-[#263247]" />

        <p className="mb-[11px] px-[12px] font-serif text-[9px] font-bold uppercase tracking-[2px] text-[#6f8199]">
          Account
        </p>

        <nav className="space-y-[4px]">
          {accountItems.map((item) => {
            const Icon = item.icon;
            const active = isFacultyPathActive(pathname, item.href);

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigate(item.href)}
                className={`group relative flex h-[46px] w-full items-center rounded-[14px] px-[14px] text-left transition duration-200 ${
                  active
                    ? "bg-[#1b293e] text-[#75c6ec]"
                    : "text-[#9aa9bd] hover:bg-[#151f31] hover:text-[#c7d3e2]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-0 h-full w-[3px] rounded-r-full bg-[#65bce5]" />
                )}
                <Icon
                  size={18}
                  strokeWidth={1.7}
                  className={
                    active
                      ? "text-[#70c3eb]"
                      : "text-[#8799b0] group-hover:text-[#a9bdd2]"
                  }
                />
                <span className="ml-[12px] whitespace-nowrap font-serif text-[13px]">
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleSignOut}
            className="group flex h-[46px] w-full items-center rounded-[14px] px-[14px] text-[#9aa9bd] transition duration-200 hover:bg-[#151f31] hover:text-[#c7d3e2]"
          >
            <LogOut
              size={18}
              strokeWidth={1.7}
              className="text-[#8799b0] group-hover:text-[#a9bdd2]"
            />
            <span className="ml-[12px] whitespace-nowrap font-serif text-[13px]">
              Sign Out
            </span>
          </button>
        </nav>

        {/* BOTTOM PROFILE CARD WITH INSTANT PHOTO */}
        <div className="mt-auto pt-[20px]">
          <div className="h-px w-full bg-[#263247]" />
          <button
            type="button"
            onClick={() => navigate("/faculty/profile")}
            className="mt-[14px] flex min-h-[66px] w-full items-center rounded-[16px] bg-[#151f31] px-[12px] text-left transition hover:bg-[#1a273a]"
          >
            <div className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#54bce5]/40 bg-[#69b5dc] font-serif text-[13px] font-bold text-white shadow-sm">
              {profileImage && !imgError ? (
                <img
                  src={profileImage}
                  alt={facultyName}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                  loading="eager"
                />
              ) : (
                initials
              )}
            </div>
            <div className="ml-[10px] min-w-0">
              <p className="truncate font-serif text-[12px] font-bold text-white">
                {facultyName}
              </p>
              <p className="truncate font-serif text-[9px] text-[#8b9ab0]">
                {facultyRole}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FACULTY LAYOUT
========================================================= */

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Instant zero-delay memory cache initialization
  const [user, setUser] = useState<FacultyUser>(getInstantFacultyUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(() =>
    pathname.startsWith("/dashboard/faculty/attendance")
  );
  const [isRefreshingPage, setIsRefreshingPage] = useState(false);
  const [headerImgError, setHeaderImgError] = useState(false);

  const navigate = (href: string) => {
    setSidebarOpen(false);
    router.push(href);
  };

  const syncProfile = (updated: Partial<FacultyUser>) => {
    if (updated.profileImage) {
      try {
        localStorage.setItem("facultyProfileImage", updated.profileImage);
      } catch {
        // Safe catch
      }
    }
    setHeaderImgError(false);
    setUser((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const loadUserData = async () => {
    // Phase 1: Instant sync from localStorage
    const local = getInstantFacultyUser();
    if (local.email && local.email !== defaultFaculty.email) {
      setUser(local);
    }

    // Phase 2: Live background fetch from backend
    try {
      const response = await fetch("/api/faculty/profile", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success && data.faculty) {
        const f = data.faculty;
        const freshUser: Partial<FacultyUser> = {
          id: f.id,
          name: f.name,
          email: f.email,
          facultyId: f.facultyId || f.campusUserId,
          campusUserId: f.campusUserId,
          role: f.role,
          approvalStatus: f.approvalStatus,
          profileImage: f.profileImage || null,
        };

        syncProfile(freshUser);

        // Update local storage so next refresh has this photo instantly
        try {
          const currentStored = localStorage.getItem("user") || localStorage.getItem("facultyUser");
          if (currentStored) {
            const parsed = JSON.parse(currentStored);
            localStorage.setItem("user", JSON.stringify({ ...parsed, ...freshUser }));
          }
        } catch {
          // ignore
        }
      }
    } catch (error) {
      console.error("Faculty profile background sync error:", error);
    }
  };

  const handleHeaderRefresh = () => {
    setIsRefreshingPage(true);
    void loadUserData();
    router.refresh();
    setTimeout(() => {
      setIsRefreshingPage(false);
    }, 600);
  };

  useEffect(() => {
    // Initial direct sync
    void loadUserData();

    // Listen to local changes (e.g. when user uploads photo in profile tab)
    const handleStorageChange = () => {
      const refreshed = getInstantFacultyUser();
      setUser(refreshed);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("faculty-profile-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("faculty-profile-updated", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/dashboard/faculty/attendance")) {
      setAttendanceOpen(true);
    }
  }, [pathname]);

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

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (logoutError) {
      console.error("Faculty logout API error:", logoutError);
    }

    try {
      [
        "facultyUser",
        "faculty",
        "currentFaculty",
        "user",
        "token",
        "facultyToken",
        "facultyProfileImage",
      ].forEach((key) => localStorage.removeItem(key));
    } catch (storageError) {
      console.error("Storage cleanup error:", storageError);
    }

    setSidebarOpen(false);
    router.replace("/faculty/login");
  };

  return (
    <div className="min-h-screen w-full bg-[#edf4fa] text-[#0d1727]">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed left-0 top-0 z-[120] hidden h-screen w-[310px] overflow-hidden border-r border-[#263247] bg-[#0d1424] lg:block">
        <SidebarContent
          pathname={pathname}
          attendanceOpen={attendanceOpen}
          setAttendanceOpen={setAttendanceOpen}
          setSidebarOpen={setSidebarOpen}
          handleSignOut={handleSignOut}
          initials={initials}
          facultyName={facultyName}
          facultyRole={facultyRole}
          profileImage={user.profileImage}
          navigate={navigate}
        />
      </aside>

      {/* MOBILE OVERLAY & SIDEBAR */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300"
          />

          <aside className="fixed left-0 top-0 z-[140] h-screen w-[310px] overflow-hidden border-r border-[#263247] bg-[#0d1424] shadow-2xl">
            <SidebarContent
              pathname={pathname}
              attendanceOpen={attendanceOpen}
              setAttendanceOpen={setAttendanceOpen}
              setSidebarOpen={setSidebarOpen}
              handleSignOut={handleSignOut}
              initials={initials}
              facultyName={facultyName}
              facultyRole={facultyRole}
              profileImage={user.profileImage}
              navigate={navigate}
            />
          </aside>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="min-h-screen w-full lg:pl-[310px]">
        {/* HEADER */}
        <header className="sticky top-0 z-[100] h-[82px] w-full border-b border-[#dce6f0] bg-white">
          <div className="flex h-full w-full items-center justify-between px-5 sm:px-8 lg:px-10">
            <div className="flex h-full min-w-0 items-center">
              <button
                type="button"
                aria-label="Open Faculty Menu"
                onClick={() => setSidebarOpen(true)}
                className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#4f6680] shadow-sm lg:hidden"
              >
                <Menu size={21} strokeWidth={2} />
              </button>

              <div className="flex h-full min-w-0 flex-col justify-center">
                <p className="whitespace-nowrap font-serif text-[11px] font-bold uppercase tracking-[0.22em] text-[#4d86b2]">
                  Faculty Portal
                </p>
                <p className="mt-[4px] hidden whitespace-nowrap font-serif text-[11px] text-[#71839a] sm:block">
                  Academic management workspace
                </p>
              </div>
            </div>

            <div className="flex h-full shrink-0 items-center gap-3">
              {/* REFRESH BUTTON */}
              <button
                type="button"
                aria-label="Refresh"
                title="Refresh"
                onClick={handleHeaderRefresh}
                disabled={isRefreshingPage}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce6f0] bg-white px-3.5 text-xs font-semibold text-[#526982] shadow-sm transition hover:border-[#9bcbe4] hover:text-[#3989b7] disabled:opacity-60"
              >
                <RefreshCw
                  size={14}
                  strokeWidth={2}
                  className={isRefreshingPage ? "animate-spin text-[#3989b7]" : ""}
                />
                <span>Refresh</span>
              </button>

              {/* NOTIFICATIONS BUTTON */}
              <button
                type="button"
                aria-label="Notifications"
                title="Notifications"
                onClick={() => navigate("/dashboard/faculty/notifications")}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#526982] shadow-sm transition hover:border-[#9bcbe4] hover:text-[#3989b7]"
              >
                <Bell size={19} strokeWidth={1.8} />
                <span className="absolute right-[8px] top-[7px] h-[6px] w-[6px] rounded-full bg-[#54bce5] ring-2 ring-white" />
              </button>

              <div className="mx-1 h-8 w-px shrink-0 bg-[#dce6f0]" />

              {/* PROFILE BUTTON (DISPLAYS PHOTO INSTANTLY) */}
              <button
                type="button"
                onClick={() => navigate("/faculty/profile")}
                className="group flex h-[52px] shrink-0 items-center gap-3 rounded-xl px-2 text-left transition hover:bg-[#f4f9fc]"
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#54bce5]/40 bg-[#69acd2] font-serif text-[12px] font-bold text-white shadow-sm transition group-hover:border-[#54bce5]">
                  {user.profileImage && !headerImgError ? (
                    <img
                      src={user.profileImage}
                      alt={facultyName}
                      className="h-full w-full object-cover"
                      onError={() => setHeaderImgError(true)}
                      loading="eager"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden min-w-0 flex-col justify-center sm:flex">
                  <p className="whitespace-nowrap font-serif text-[12px] font-bold text-[#18283d]">
                    {facultyName}
                  </p>
                  <p className="whitespace-nowrap font-serif text-[9px] uppercase tracking-[0.03em] text-[#72849a]">
                    {facultyRole}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="w-full min-w-0">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}