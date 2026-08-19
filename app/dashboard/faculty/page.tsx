"use client";

import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FacultyUser = {
  id?: string;
  name?: string;
  email?: string;
  facultyId?: string;
  role?: string;
};

const defaultFaculty: FacultyUser = {
  id: "",
  name: "Vivek Kumar",
  email: "faculty@campusconnect.com",
  facultyId: "RNT-9457",
  role: "Faculty Member",
};

/* =========================================================
   NAVIGATION
========================================================= */

const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard/faculty",
    icon: GraduationCap,
  },
  {
    title: "Students",
    href: "/students",
    icon: Users,
  },
  {
    title: "Student Approval",
    href: "/dashboard/faculty/approvals/students",
    icon: CheckCircle2,
  },
  {
    title: "Attendance",
    href: "/dashboard/faculty/attendance",
    icon: ClipboardCheck,
  },
  {
    title: "Events",
    href: "/events",
    icon: CalendarDays,
  },
  {
    title: "Faculty Profile",
    href: "/faculty/profile",
    icon: UserCircle,
  },
];

const accountNavigation = [
  {
    title: "Account Security",
    href: "/faculty/security",
    icon: ShieldCheck,
  },
];

const quickAccess = [
  {
    title: "Student Management",
    description:
      "View and manage student information, academic records and assigned students.",
    href: "/students",
    icon: Users,
    action: "Open Student Management",
  },
  {
    title: "Student Approval",
    description:
      "Review student registration requests and approve eligible student accounts.",
    href: "/dashboard/faculty/approvals/students",
    icon: CheckCircle2,
    action: "Open Student Approval",
  },
  {
    title: "Attendance",
    description:
      "Record attendance and monitor student attendance information.",
    href: "/dashboard/faculty/attendance",
    icon: ClipboardCheck,
    action: "Open Attendance",
  },
  {
    title: "Events & Activities",
    description:
      "View campus events, academic activities and upcoming schedules.",
    href: "/events",
    icon: CalendarDays,
    action: "Open Events & Activities",
  },
];

export default function FacultyDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<FacultyUser>(defaultFaculty);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* =========================================================
     LOAD FACULTY
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
          const storedFaculty = localStorage.getItem(key);

          if (!storedFaculty) {
            continue;
          }

          try {
            const candidate = JSON.parse(storedFaculty);

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
          id: parsed.id || defaultFaculty.id,
          name: parsed.name || defaultFaculty.name,
          email: parsed.email || defaultFaculty.email,
          facultyId:
            parsed.facultyId || defaultFaculty.facultyId,
          role: parsed.role || defaultFaculty.role,
        });
      } catch {
        // Keep default faculty information.
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const facultyName = user.name || "Vivek Kumar";
  const facultyEmail =
    user.email || "faculty@campusconnect.com";
  const facultyId = user.facultyId || "RNT-9457";
  const facultyRole = user.role || "Faculty Member";

  const initials = facultyName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /* =========================================================
     SIGN OUT
  ========================================================== */

  function handleSignOut() {
    try {
      localStorage.removeItem("facultyUser");
      localStorage.removeItem("faculty");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("facultyToken");
    } catch {
      // Ignore localStorage errors.
    }

    router.push("/faculty/login");
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef4fa] text-[#0d1728]">

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#07111f]/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-[270px] shrink-0
          flex-col
          border-r border-[#23344d]
          bg-[#0b1423]
          text-white
          shadow-[8px_0_35px_rgba(5,15,30,0.16)]
          transition-transform duration-300
          lg:translate-x-0
          ${
            mobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* BRAND */}

        <div className="flex h-[92px] shrink-0 items-center justify-between border-b border-[#223149] px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#54bce5] shadow-[0_8px_25px_rgba(84,188,229,0.25)]">
              <GraduationCap
                size={25}
                strokeWidth={2}
                className="text-white"
              />
            </div>

            <div className="min-w-0">
              <h1 className="font-serif text-[19px] font-bold tracking-tight text-white">
                CampusConnect
              </h1>

              <p className="mt-0.5 text-[11px] font-medium text-[#91a4bb]">
                Faculty Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-2 text-[#8fa3bb] transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* NAVIGATION */}

        <div className="flex-1 overflow-y-auto px-4 py-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63758d]">
            Main Menu
          </p>

          <nav className="space-y-1.5">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const active = index === 0;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() =>
                    setMobileSidebarOpen(false)
                  }
                  className={`
                    group flex h-11 w-full items-center gap-3
                    rounded-xl px-3.5
                    text-[13px] font-medium
                    transition-all duration-200
                    ${
                      active
                        ? "bg-[#17263a] text-[#64c8ee] shadow-[inset_3px_0_0_#54bce5]"
                        : "text-[#9aabc0] hover:bg-[#142135] hover:text-white"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className={
                      active
                        ? "text-[#63c9ef]"
                        : "text-[#8195ad] group-hover:text-[#63c9ef]"
                    }
                  />

                  <span>{item.title}</span>

                  {active && (
                    <ChevronRight
                      size={16}
                      className="ml-auto text-[#63c9ef]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="my-7 h-px bg-[#223149]" />

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63758d]">
            Account
          </p>

          <nav className="space-y-1.5">
            {accountNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() =>
                    setMobileSidebarOpen(false)
                  }
                  className="group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium text-[#9aabc0] transition-all duration-200 hover:bg-[#142135] hover:text-white"
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className="text-[#8195ad] group-hover:text-[#63c9ef]"
                  />

                  <span>{item.title}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleSignOut}
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[13px] font-medium text-[#9aabc0] transition-all duration-200 hover:bg-[#142135] hover:text-white"
            >
              <LogOut
                size={18}
                strokeWidth={1.8}
                className="text-[#8195ad] group-hover:text-[#63c9ef]"
              />

              <span>Sign Out</span>
            </button>
          </nav>
        </div>

        {/* SIDEBAR USER */}

        <div className="shrink-0 border-t border-[#223149] p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[#111e2f] px-3.5 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#54bce5] text-[12px] font-bold text-white">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">
                {facultyName}
              </p>

              <p className="truncate text-[11px] text-[#8296ae]">
                {facultyRole}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="min-h-screen w-full min-w-0 lg:pl-[270px]">

        {/* ===================================================
            TOP HEADER
        =================================================== */}

        <header className="sticky top-0 z-30 h-[86px] w-full border-b border-[#dce6f0] bg-white/95 backdrop-blur-xl">
          <div className="flex h-full w-full items-center justify-between px-5 sm:px-6">

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setMobileSidebarOpen(true)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#263a53] shadow-sm lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3985b6]">
                  Faculty Portal
                </p>

                <p className="mt-1 hidden text-[11px] text-[#71839a] sm:block">
                  Academic management workspace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">

              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#4f6680] shadow-sm transition hover:border-[#9bcbe4] hover:bg-[#f4f9fd] hover:text-[#398fbe]"
              >
                <Bell
                  size={18}
                  strokeWidth={1.8}
                />

                <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-[#54bce5]" />
              </button>

              <button
                type="button"
                aria-label="Settings"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#4f6680] shadow-sm transition hover:border-[#9bcbe4] hover:bg-[#f4f9fd] hover:text-[#398fbe] sm:flex"
              >
                <Settings
                  size={18}
                  strokeWidth={1.8}
                />
              </button>

              <div className="mx-1 hidden h-8 w-px bg-[#dce6f0] sm:block" />

              <div className="hidden items-center gap-2.5 sm:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#69acd2] text-[12px] font-bold text-white">
                  {initials}
                </div>

                <div>
                  <p className="text-[12px] font-semibold text-[#18283d]">
                    {facultyName}
                  </p>

                  <p className="text-[10px] text-[#72849a]">
                    {facultyRole}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <main className="relative min-h-[calc(100vh-86px)] w-full overflow-hidden bg-[#edf4fa] px-5 py-6 sm:px-6">

          {/* BACKGROUND GRID */}

          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(88,157,197,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(88,157,197,0.08) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />

            <div className="absolute left-[20%] top-[8%] h-[450px] w-[450px] rounded-full bg-[#dceef8] opacity-50 blur-3xl" />

            <div className="absolute right-[5%] top-[30%] h-[350px] w-[350px] rounded-full bg-[#e4f2f9] opacity-60 blur-3xl" />
          </div>

          {/* IMPORTANT:
              NO mx-auto
              NO max-w
          */}

          <div className="relative mx-auto w-full min-w-0 max-w-none">

            {/* =================================================
                WELCOME
            ================================================= */}

            <section className="relative w-full overflow-hidden rounded-[23px] border border-[#263951] bg-gradient-to-br from-[#0d1728] via-[#101d30] to-[#14273b] px-7 py-6 shadow-[0_18px_45px_rgba(10,27,48,0.18)] sm:px-9 sm:py-7 lg:px-10 lg:py-7">

              <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#54bce5]/20" />

              <div className="pointer-events-none absolute -right-3 top-12 h-40 w-40 rounded-full border border-[#54bce5]/10" />

              <div className="pointer-events-none absolute bottom-[-100px] left-[42%] h-64 w-64 rounded-full bg-[#54bce5]/5 blur-3xl" />

              <div className="relative z-10 max-w-[1100px]">

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#54bce5]/30 bg-[#54bce5]/10 px-3.5 py-1.5 text-[11px] font-semibold text-[#76d0f1]">
                  <GraduationCap size={14} />
                  Faculty Dashboard
                </div>

                <h1 className="font-serif text-[38px] font-bold leading-[0.98] tracking-[-0.03em] text-white sm:text-[45px] lg:text-[51px]">
                  Welcome back.
                  <br />
                  <span className="text-[#69c9ed]">
                    {facultyName}
                  </span>
                </h1>

                <p className="mt-4 max-w-[900px] text-[13px] leading-6 text-[#a7b7c9] sm:text-[14px]">
                  Manage your academic responsibilities,
                  students, attendance, schedules and campus
                  activities from your Faculty Dashboard.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">

                  <div className="inline-flex items-center gap-2 rounded-full border border-[#49c997]/30 bg-[#49c997]/10 px-3.5 py-2 text-[11px] font-semibold text-[#72dcb4]">
                    <CheckCircle2 size={14} />
                    Account Approved
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-[#7890aa]/30 bg-white/[0.04] px-3.5 py-2 text-[11px] font-medium text-[#b3c0d0]">
                    <UserCircle size={14} />

                    Faculty ID:

                    <span className="font-bold text-white">
                      {facultyId}
                    </span>
                  </div>

                </div>
              </div>

              <div className="absolute bottom-6 right-7 hidden h-[92px] w-[92px] items-center justify-center rounded-[21px] border border-[#54bce5]/25 bg-[#15273b]/90 shadow-[0_20px_45px_rgba(0,0,0,0.2)] lg:flex">
                <GraduationCap
                  size={46}
                  strokeWidth={1.5}
                  className="text-[#67bfe6]"
                />
              </div>
            </section>

            {/* =================================================
                STATS
            ================================================= */}

            <section className="mt-5 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                title="Students"
                value="0"
                description="Students assigned to you"
                icon={Users}
              />

              <StatCard
                title="Student Approvals"
                value="0"
                description="Pending student approval requests"
                icon={CheckCircle2}
              />

              <StatCard
                title="Attendance"
                value="0"
                description="Attendance records"
                icon={ClipboardCheck}
              />

              <StatCard
                title="Events"
                value="0"
                description="Upcoming campus events"
                icon={CalendarDays}
              />

            </section>

            {/* =================================================
                QUICK ACCESS
            ================================================= */}

            <section className="mt-8 w-full">

              <div className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#438bb8]">
                  Quick Access
                </p>

                <h2 className="mt-1 font-serif text-[25px] font-bold tracking-tight text-[#0d1728]">
                  Explore Faculty Portal
                </h2>
              </div>

              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {quickAccess.map((item) => {
                  const Icon = item.icon;

                  return (
                    <QuickAccessCard
                      key={item.title}
                      title={item.title}
                      description={item.description}
                      href={item.href}
                      action={item.action}
                      Icon={Icon}
                    />
                  );
                })}

              </div>
            </section>

            {/* =================================================
                LOWER INFORMATION
            ================================================= */}

            <section className="mt-5 grid w-full grid-cols-1 gap-4 lg:grid-cols-2">

              {/* FACULTY INFORMATION */}

              <div className="rounded-[20px] border border-[#d9e4ee] bg-white p-6 shadow-[0_8px_25px_rgba(30,60,90,0.06)]">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef7fc] text-[#4d9ac4]">
                    <UserCircle
                      size={21}
                      strokeWidth={1.7}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-serif text-[18px] font-bold text-[#142238]">
                      Faculty Information
                    </h3>

                    <p className="mt-1 text-[12px] text-[#72849a]">
                      Your CampusConnect faculty account details.
                    </p>
                  </div>

                </div>

                <div className="mt-5 space-y-3">

                  <FacultyInfoRow
                    label="Name"
                    value={facultyName}
                  />

                  <FacultyInfoRow
                    label="Email"
                    value={facultyEmail}
                  />

                  <FacultyInfoRow
                    label="Faculty ID"
                    value={facultyId}
                  />

                  <FacultyInfoRow
                    label="Role"
                    value={facultyRole}
                  />

                </div>

                <Link
                  href="/faculty/profile"
                  className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#3989b7] transition hover:text-[#1d658d]"
                >
                  Open Faculty Profile
                  <ChevronRight size={14} />
                </Link>

              </div>

              {/* ACCOUNT SECURITY */}

              <div className="rounded-[20px] border border-[#d9e4ee] bg-white p-6 shadow-[0_8px_25px_rgba(30,60,90,0.06)]">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef8f4] text-[#3ba77c]">
                    <ShieldCheck
                      size={21}
                      strokeWidth={1.7}
                    />
                  </div>

                  <div>
                    <h3 className="font-serif text-[18px] font-bold text-[#142238]">
                      Account Security
                    </h3>

                    <p className="mt-1 text-[12px] leading-6 text-[#72849a]">
                      Review your account security and password settings.
                    </p>
                  </div>

                </div>

                <div className="mt-5 flex items-center justify-between rounded-xl border border-[#cdebdc] bg-[#f1faf5] px-4 py-3">

                  <div className="flex items-center gap-2.5">

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dff5e9] text-[#39a477]">
                      <CheckCircle2 size={17} />
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-[#315b48]">
                        Account Status
                      </p>

                      <p className="text-[10px] text-[#6d8c7d]">
                        Your faculty account is active
                      </p>
                    </div>

                  </div>

                  <span className="rounded-full border border-[#bde4cf] bg-white px-3 py-1.5 text-[10px] font-bold text-[#31986d]">
                    Approved
                  </span>

                </div>

                <Link
                  href="/faculty/security"
                  className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#3989b7] transition hover:text-[#1d658d]"
                >
                  Open Security
                  <ChevronRight size={14} />
                </Link>

              </div>

            </section>

            <div className="h-8" />

          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   FACULTY INFORMATION ROW
========================================================= */

type FacultyInfoRowProps = {
  label: string;
  value: string;
};

function FacultyInfoRow({
  label,
  value,
}: FacultyInfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#edf1f5] bg-[#fafcfe] px-4 py-2.5">

      <span className="text-[11px] font-medium text-[#75889d]">
        {label}
      </span>

      <span className="max-w-[65%] truncate text-right text-[11px] font-semibold text-[#1b2b40]">
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="group min-w-0 rounded-[19px] border border-[#d8e3ed] bg-white p-4 shadow-[0_7px_22px_rgba(30,60,90,0.055)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#b9d8e9] hover:shadow-[0_12px_28px_rgba(30,70,100,0.09)]">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#687c93]">
            {title}
          </p>

          <p className="mt-2 font-serif text-[27px] font-bold leading-none text-[#0b1728]">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf7fc] text-[#53a7d4] transition-colors duration-200 group-hover:bg-[#54bce5] group-hover:text-white">
          <Icon
            size={18}
            strokeWidth={1.8}
          />
        </div>

      </div>

      <p className="mt-4 text-[10px] leading-5 text-[#7890a8]">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   QUICK ACCESS CARD
========================================================= */

type QuickAccessCardProps = {
  title: string;
  description: string;
  href: string;
  action: string;
  Icon: React.ElementType;
};

function QuickAccessCard({
  title,
  description,
  href,
  action,
  Icon,
}: QuickAccessCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[205px] min-w-0 flex-col overflow-hidden rounded-[20px] border border-[#d8e3ed] bg-white p-5 shadow-[0_7px_22px_rgba(30,60,90,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#54bce5] hover:shadow-[0_18px_35px_rgba(8,27,48,0.2)] sm:p-5"
    >

      <div className="flex items-start justify-between">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf7fc] text-[#4ba4d2] transition-all duration-200 group-hover:bg-[#54bce5] group-hover:text-white">
          <Icon
            size={20}
            strokeWidth={1.7}
          />
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf7fc] text-[#aec0d1] transition-all duration-200 group-hover:translate-x-0.5 group-hover:bg-[#54bce5] group-hover:text-white">
          <ChevronRight
            size={17}
            strokeWidth={1.8}
          />
        </div>

      </div>

      <div className="mt-7">

        <h3 className="font-serif text-[17px] font-bold text-[#142238]">
          {title}
        </h3>

        <p className="mt-2 text-[11px] leading-5 text-[#73869b]">
          {description}
        </p>

      </div>

      <div className="mt-auto pt-5 text-[10px] font-semibold text-[#438eb9]">
        {action} →
      </div>

      <div className="pointer-events-none absolute -bottom-14 -right-14 h-32 w-32 rounded-full bg-[#54bce5]/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

    </Link>
  );
}