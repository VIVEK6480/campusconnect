"use client";

interface DashboardChartsProps {
  data: {
    users: number;
    students: number;
    faculty: number;
    admins: number;
    clubs: number;
    memberships: number;
    events: number;
  };
}

export default function DashboardCharts({
  data,
}: DashboardChartsProps) {
  const userData = [
    {
      label: "Students",
      value: data.students,
    },
    {
      label: "Faculty",
      value: data.faculty,
    },
    {
      label: "Admins",
      value: data.admins,
    },
  ];

  const maxUsers = Math.max(
    ...userData.map((item) => item.value),
    1
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* User distribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            User Distribution
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Registered users by role
          </p>
        </div>

        <div className="space-y-6">
          {userData.map((item) => {
            const percentage =
              (item.value / maxUsers) * 100;

            return (
              <div key={item.label}>
                <div className="mb-2 flex justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {item.label}
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {item.value}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-700"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform overview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            Platform Overview
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Current CampusConnect activity
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-blue-50 p-5">
            <p className="text-sm text-blue-600">
              Clubs
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-900">
              {data.clubs}
            </p>
          </div>

          <div className="rounded-xl bg-purple-50 p-5">
            <p className="text-sm text-purple-600">
              Events
            </p>

            <p className="mt-2 text-2xl font-bold text-purple-900">
              {data.events}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 p-5">
            <p className="text-sm text-blue-600">
              Memberships
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-900">
              {data.memberships}
            </p>
          </div>

          <div className="rounded-xl bg-orange-50 p-5">
            <p className="text-sm text-orange-600">
              Total Users
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-900">
              {data.users}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}