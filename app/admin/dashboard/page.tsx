"use client";

import {
  Activity,
  Building2,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  Users,
  UserCog,
} from "lucide-react";

type StatCardProps = {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
};

function StatCard({
  title,
  value,
  description,
  icon,
}: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold text-slate-900">
            {value}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {description}
          </p>
        </div>

        {/* STAT CARD ICON */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

type QuickCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function QuickCard({
  icon,
  title,
  description,
}: QuickCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-center justify-between">

        {/* QUICK ACCESS ICON */}
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </div>

        {/* ARROW */}
        <ChevronRight
          size={20}
          className="text-slate-300 transition duration-200 group-hover:translate-x-1 group-hover:text-blue-500"
        />
      </div>

      <h3 className="mt-6 text-lg font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const stats = {
    totalUsers: 2,
    clubs: 2,
    events: 1,
    memberships: 1,
    students: 1,
    faculty: 0,
    admins: 1,
  };

  const quickAccess = [
    {
      icon: <Users size={21} />,
      title: "Users",
      description:
        "Manage students, faculty and administrators registered on CampusConnect.",
    },
    {
      icon: <Building2 size={21} />,
      title: "Clubs",
      description:
        "Manage campus clubs, coordinators, members and club activities.",
    },
    {
      icon: <CalendarDays size={21} />,
      title: "Events",
      description:
        "Create, manage and monitor events happening across the campus.",
    },
    {
      icon: <UserCog size={21} />,
      title: "Memberships",
      description:
        "View and manage student memberships across different campus clubs.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7fafc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">

        {/* ADMIN WELCOME BANNER */}
        <section className="relative mb-7 overflow-hidden rounded-[26px] bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#2563eb] px-8 py-9 shadow-lg sm:px-10 sm:py-10">

          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border border-white/10" />

          <div className="absolute right-32 top-10 h-24 w-24 rounded-full border border-white/10" />

          <div className="absolute bottom-[-70px] right-[28%] h-40 w-40 rounded-full bg-blue-400/10 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">

            <div className="max-w-3xl">

              {/* WELCOME BADGE */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/20 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 backdrop-blur-sm">
                <ShieldCheck size={16} />
                Welcome back
              </div>

              {/* HEADING */}
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Manage your campus.
                <br />
                <span className="text-blue-200">
                  Shape the experience.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100/80 sm:text-base">
                Monitor students, manage clubs, organize events
                and keep everything connected across your
                CampusConnect administration portal.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/admin/events";
              }}
              className="relative z-10 flex w-fit items-center gap-3 rounded-xl bg-white px-6 py-4 font-bold text-blue-800 shadow-lg transition duration-200 hover:-translate-y-1 hover:bg-blue-50"
            >
              Manage Events
              <ChevronRight size={19} />
            </button>

          </div>
        </section>

        {/* STAT CARDS */}
        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            description={`${stats.students} students`}
            icon={<Users size={23} />}
          />

          <StatCard
            title="Clubs"
            value={stats.clubs}
            description="Active clubs"
            icon={<Building2 size={23} />}
          />

          <StatCard
            title="Events"
            value={stats.events}
            description="Campus events"
            icon={<CalendarDays size={23} />}
          />

          <StatCard
            title="Memberships"
            value={stats.memberships}
            description="Club memberships"
            icon={<UserCog size={23} />}
          />

          <StatCard
            title="Students"
            value={stats.students}
            description="Registered students"
            icon={<GraduationCap size={23} />}
          />

          <StatCard
            title="Faculty"
            value={stats.faculty}
            description="Faculty members"
            icon={<UserCog size={23} />}
          />

        </section>

        {/* QUICK ACCESS */}
        <section className="mb-8">

          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              QUICK ACCESS
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Explore CampusConnect
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Quickly access important administration sections.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {quickAccess.map((item) => (
              <QuickCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>

        </section>

        {/* USER DISTRIBUTION + PLATFORM OVERVIEW */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* USER DISTRIBUTION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  User Distribution
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Registered users by role
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={20} />
              </div>

            </div>

            {/* STUDENTS */}
            <div className="mt-8">

              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  Students
                </span>

                <span className="text-sm font-bold text-slate-800">
                  {stats.students}
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width:
                      stats.students > 0 ? "100%" : "0%",
                  }}
                />
              </div>

            </div>

            {/* FACULTY */}
            <div className="mt-7">

              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  Faculty
                </span>

                <span className="text-sm font-bold text-slate-800">
                  {stats.faculty}
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width:
                      stats.faculty > 0 ? "100%" : "0%",
                  }}
                />
              </div>

            </div>

            {/* ADMINS */}
            <div className="mt-7">

              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  Admins
                </span>

                <span className="text-sm font-bold text-slate-800">
                  {stats.admins}
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width:
                      stats.admins > 0 ? "100%" : "0%",
                  }}
                />
              </div>

            </div>

          </div>

          {/* PLATFORM OVERVIEW */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Platform Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current CampusConnect activity
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Activity size={20} />
              </div>

            </div>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* CLUBS */}
              <div className="rounded-2xl bg-blue-50 p-6">

                <Building2
                  size={21}
                  className="text-blue-600"
                />

                <p className="mt-4 text-sm font-medium text-blue-700">
                  Clubs
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-950">
                  {stats.clubs}
                </p>

              </div>

              {/* EVENTS */}
              <div className="rounded-2xl bg-indigo-50 p-6">

                <CalendarDays
                  size={21}
                  className="text-indigo-600"
                />

                <p className="mt-4 text-sm font-medium text-indigo-700">
                  Events
                </p>

                <p className="mt-2 text-3xl font-bold text-indigo-950">
                  {stats.events}
                </p>

              </div>

              {/* MEMBERSHIPS */}
              <div className="rounded-2xl bg-sky-50 p-6">

                <UserCog
                  size={21}
                  className="text-sky-600"
                />

                <p className="mt-4 text-sm font-medium text-sky-700">
                  Memberships
                </p>

                <p className="mt-2 text-3xl font-bold text-sky-950">
                  {stats.memberships}
                </p>

              </div>

              {/* TOTAL USERS */}
              <div className="rounded-2xl bg-slate-100 p-6">

                <Users
                  size={21}
                  className="text-slate-600"
                />

                <p className="mt-4 text-sm font-medium text-slate-700">
                  Total Users
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {stats.totalUsers}
                </p>

              </div>

            </div>
          </div>

        </section>

        {/* ADMINISTRATION STATUS */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <ShieldCheck
                  size={23}
                  className="text-blue-600"
                />
              </div>

              <div>
                <p className="text-base font-bold text-slate-900">
                  CampusConnect Administration
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your administration dashboard is active and ready.
                </p>
              </div>

            </div>

          </div>

          {/* THIN BLUE LINE */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400" />

        </section>

      </div>
    </main>
  );
}