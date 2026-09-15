"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Bell,
  BookOpen,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Settings,
  ClipboardCheck,
  ChevronRight,
} from "lucide-react";

type StudentUser = {
  id?: string;
  name?: string;
  email?: string;
  studentId?: string;
  image?: string | null;
  photo?: string | null;
  profileImage?: string | null;
  avatar?: string | null;
};

export default function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mounted] = useState(true);

  const [student, setStudent] = useState<StudentUser>({
    name: "Student",
    email: "CampusConnect User",
    image: null,
  });

  const getToken = () => {
    try {
      return localStorage.getItem("token") || "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const img =
            parsedUser?.profileImage ||
            parsedUser?.image ||
            parsedUser?.photo ||
            parsedUser?.avatar ||
            null;

          setStudent((prev) => ({
            ...prev,
            id: parsedUser?.id,
            name: parsedUser?.name || parsedUser?.fullName || "Student",
            email: parsedUser?.email || "CampusConnect User",
            studentId: parsedUser?.studentId || parsedUser?.studentID,
            image: img,
            photo: img,
            profileImage: img,
            avatar: img,
          }));
        }

        const token = getToken();
        const response = await fetch("/api/student/profile", {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: "application/json",
          },
          credentials: "include",
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.student) {
            const img =
              data.student.profileImage ||
              data.student.image ||
              data.student.photo ||
              data.student.avatar ||
              null;

            setStudent((prev) => ({
              ...prev,
              id: data.student.id || prev.id,
              name: data.student.name || prev.name,
              email: data.student.email || prev.email,
              image: img,
              photo: img,
              profileImage: img,
              avatar: img,
            }));
          }
        }
      } catch (error) {
        console.error("STUDENT DATA LOAD ERROR:", error);
      }
    };

    loadStudentData();

    const handleStorageUpdate = () => {
      loadStudentData();
    };

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("student-profile-updated", handleStorageUpdate);
    window.addEventListener("campusconnect-profile-updated", handleStorageUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("student-profile-updated", handleStorageUpdate);
      window.removeEventListener("campusconnect-profile-updated", handleStorageUpdate);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const token = getToken();
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Local storage error:", error);
    }

    router.push("/auth/login");
  };

  const navigate = (href: string) => {
    setMobileMenu(false);
    router.push(href);
  };

  const studentName = student.name || "Student";
  const studentEmail = student.email || "Campus Member";

  const studentPhoto =
    student.profileImage ||
    student.image ||
    student.photo ||
    student.avatar ||
    null;

  const studentInitial =
    studentName.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">
      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenu((previous) => !previous)}
            aria-label="Toggle menu"
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-emerald-600"
          >
            {mobileMenu ? <X size={21} /> : <Menu size={21} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/20">
              <GraduationCap size={19} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">CampusConnect</p>
              <p className="text-[10px] text-emerald-600 leading-tight">Student Portal</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => navigate("/notifications")}
            className="relative rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-emerald-600"
          >
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/student/settings")}
            className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-slate-50 text-left"
          >
            {mounted && studentPhoto ? (
              <img
                src={studentPhoto}
                alt={studentName}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-emerald-400/20"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-white">
                {studentInitial}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* STUDENT SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#071c16] text-white shadow-2xl transition-transform duration-300 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-[82px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
            <GraduationCap size={23} />
          </div>
          <div>
            <h1 className="text-lg font-bold">CampusConnect</h1>
            <p className="text-xs text-emerald-300/70">Student Portal</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/40">
            Main Menu
          </p>

          <nav className="space-y-1">
            <SidebarItem
              href="/dashboard/student"
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active={pathname === "/dashboard/student"}
              onNavigate={() => setMobileMenu(false)}
              routerPush={router.push}
            />

            <SidebarItem
              href="/clubs"
              icon={<Building2 size={18} />}
              label="Clubs"
              active={pathname.startsWith("/clubs")}
              onNavigate={() => setMobileMenu(false)}
              routerPush={router.push}
            />

            <SidebarItem
              href="/events"
              icon={<CalendarDays size={18} />}
              label="Events"
              active={pathname.startsWith("/events")}
              onNavigate={() => setMobileMenu(false)}
              routerPush={router.push}
            />

            <SidebarItem
              href="/activities"
              icon={<BookOpen size={18} />}
              label="Activities"
              active={pathname.startsWith("/activities")}
              onNavigate={() => setMobileMenu(false)}
              routerPush={router.push}
            />

            <SidebarItem
              href="/dashboard/student/attendance"
              icon={<ClipboardCheck size={18} />}
              label="Attendance"
              active={pathname.startsWith("/dashboard/student/attendance")}
              onNavigate={() => setMobileMenu(false)}
              routerPush={router.push}
            />

            <SidebarItem
              href="/notifications"
              icon={<Bell size={18} />}
              label="Notifications"
              active={pathname.startsWith("/notifications")}
              onNavigate={() => setMobileMenu(false)}
              routerPush={router.push}
            />
          </nav>

          <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/40">
            Account
          </p>

          <nav className="space-y-1">
            <SidebarItem
              href="/dashboard/student/settings"
              icon={<Settings size={18} />}
              label="Settings"
              active={pathname.startsWith("/dashboard/student/settings")}
              onNavigate={() => setMobileMenu(false)}
              routerPush={router.push}
            />
          </nav>
        </div>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard/student/settings")}
            className="mb-3 flex w-full items-center gap-3 rounded-xl bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.08]"
          >
            {mounted && studentPhoto ? (
              <img
                src={studentPhoto}
                alt={studentName}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 font-bold text-white">
                {studentInitial}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{studentName}</p>
              <p className="truncate text-xs text-slate-400">{studentEmail}</p>
            </div>

            <Settings size={16} className="shrink-0 text-slate-500" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {mobileMenu && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* MAIN AREA */}
      <main className="min-h-screen w-full lg:pl-[270px]">
        <header className="sticky top-0 z-30 hidden h-[82px] items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur lg:flex xl:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Student Portal
            </p>
            <p className="mt-1 text-sm text-slate-500">Your campus, your experience.</p>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => navigate("/notifications")}
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-emerald-600"
            >
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>

            <div className="h-8 w-px bg-slate-200" />

            <button
              type="button"
              onClick={() => navigate("/dashboard/student/settings")}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-50"
            >
              {mounted && studentPhoto ? (
                <img
                  src={studentPhoto}
                  alt={studentName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">
                  {studentInitial}
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-slate-800">{studentName}</p>
                <p className="text-xs text-slate-500">Campus Member</p>
              </div>
            </button>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  active = false,
  onNavigate,
  routerPush,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  onNavigate?: () => void;
  routerPush: (url: string) => void;
}) {
  const handleNavigation = () => {
    if (onNavigate) {
      onNavigate();
    }
    routerPush(href);
  };

  return (
    <button
      type="button"
      onClick={handleNavigation}
      className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition ${
        active
          ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-950/30"
          : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <span
        className={`transition ${
          active ? "text-white" : "text-slate-500 group-hover:text-emerald-300"
        }`}
      >
        {icon}
      </span>
      <span>{label}</span>
      {active && <ChevronRight size={15} className="ml-auto text-white/70" />}
    </button>
  );
}