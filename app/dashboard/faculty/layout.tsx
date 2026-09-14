"use client";

import { Bell, Settings } from "lucide-react";
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

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<FacultyUser>(defaultFaculty);

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
          role: parsed.role ?? defaultFaculty.role,
          approvalStatus:
            parsed.approvalStatus ?? defaultFaculty.approvalStatus,
        });
      } catch (error) {
        console.error(
          "Faculty header user loading error:",
          error
        );
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /* =========================================================
     USER VALUES
  ========================================================== */

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

  return (
    <div className="min-h-screen w-full bg-[#edf4fa]">
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
        <div className="flex h-full w-full items-center justify-between px-5 sm:px-7">
          {/* =================================================
              LEFT SIDE
          ================================================== */}

          <div className="flex items-center gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3985b6]">
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

          <div className="flex items-center gap-3">
            {/* NOTIFICATION */}

            <button
              type="button"
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
                transition
                hover:border-[#9bcbe4]
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
            </button>

            {/* SETTINGS */}

            <button
              type="button"
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
                transition
                hover:border-[#9bcbe4]
                hover:text-[#3989b7]
                sm:flex
              "
            >
              <Settings size={18} />
            </button>

            {/* DIVIDER */}

            <div className="hidden h-8 w-px bg-[#dce6f0] sm:block" />

            {/* =================================================
                FACULTY PROFILE
                PATH: /faculty/profile
            ================================================== */}

            <Link
              href="/faculty/profile"
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
                  group-hover:bg-[#54bce5]
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