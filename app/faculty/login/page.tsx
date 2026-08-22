"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
  CalendarDays,
  ClipboardCheck,
  UserCheck,
  UserPlus,
  KeyRound,
} from "lucide-react";

export default function FacultyLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // CLEAR OLD AUTHENTICATION
  // =========================================================

  async function clearAuthentication() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (error) {
      console.warn(
        "AUTH CLEANUP ERROR:",
        error
      );
    }

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error) {
      console.warn(
        "LOCAL STORAGE CLEANUP ERROR:",
        error
      );
    }
  }

  // =========================================================
  // FACULTY LOGIN
  // =========================================================

  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await clearAuthentication();

      const cleanEmail = email.trim();

      if (!cleanEmail || !password) {
        setError(
          "Email / Faculty User ID and password are required."
        );

        setLoading(false);
        return;
      }

      const res = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            email:
              cleanEmail.toLowerCase(),
            campusUserId:
              cleanEmail.toUpperCase(),
            password,
            portal: "faculty",
          }),
        }
      );

      let data: {
        success?: boolean;
        message?: string;
        token?: string;
        approvalStatus?: string;
        rejectionReason?: string | null;

        user?: {
          id?: string;
          campusUserId?: string | null;
          name?: string;
          email?: string;
          role?: string;
          profileImage?: string | null;
          approvalStatus?: string;
          rejectionReason?: string | null;
        };
      };

      try {
        data = await res.json();
      } catch {
        setError(
          "Invalid response from the server."
        );
        return;
      }

      console.log(
        "FACULTY LOGIN RESPONSE:",
        data
      );

      // =====================================================
      // API ERROR
      // =====================================================

      if (
        !res.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            "Invalid email / Faculty User ID or password."
        );

        await clearAuthentication();
        return;
      }

      // =====================================================
      // USER CHECK
      // =====================================================

      if (!data.user) {
        setError(
          "Faculty information was not returned by the server."
        );

        await clearAuthentication();
        return;
      }

      // =====================================================
      // FACULTY ROLE CHECK
      // =====================================================

      const role = String(
        data.user.role || ""
      )
        .trim()
        .toUpperCase();

      if (role !== "FACULTY") {
        console.warn(
          "NON-FACULTY LOGIN ATTEMPT:",
          data.user.role
        );

        await clearAuthentication();

        if (
          role === "ADMIN" ||
          role === "SUPER_ADMIN"
        ) {
          setError(
            "This is an administrator account. Please use the Admin Portal."
          );
        } else if (
          role === "STUDENT"
        ) {
          setError(
            "This is a student account. Please use the Student Portal."
          );
        } else if (
          role === "COORDINATOR"
        ) {
          setError(
            "This is a coordinator account. Please use the Coordinator Portal."
          );
        } else {
          setError(
            "This account is not a faculty account. Please use the correct portal."
          );
        }

        return;
      }

      // =====================================================
      // APPROVAL CHECK
      // =====================================================

      if (
        data.user.approvalStatus &&
        data.user.approvalStatus !==
          "APPROVED"
      ) {
        await clearAuthentication();

        if (
          data.user.approvalStatus ===
          "PENDING"
        ) {
          setError(
            "Your faculty account is still waiting for approval."
          );
        } else if (
          data.user.approvalStatus ===
          "REJECTED"
        ) {
          if (
            data.user.rejectionReason
          ) {
            setError(
              `Your faculty registration was rejected. Reason: ${data.user.rejectionReason}`
            );
          } else {
            setError(
              "Your faculty registration was rejected."
            );
          }
        } else {
          setError(
            "Your faculty account is not approved for access."
          );
        }

        return;
      }

      // =====================================================
      // STORE USER INFORMATION
      // =====================================================

      if (data.token) {
        localStorage.setItem(
          "token",
          data.token
        );
      }

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // =====================================================
      // LOGIN SUCCESS
      // =====================================================

      console.log(
        "FACULTY LOGIN SUCCESS:",
        data.user.email
      );

      router.replace(
        "/dashboard/faculty"
      );

      router.refresh();
    } catch (err) {
      console.error(
        "FACULTY LOGIN ERROR:",
        err
      );

      await clearAuthentication();

      setError(
        "Unable to connect to the server. Please check that the CampusConnect server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1220] text-white">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="absolute inset-0 overflow-hidden">

        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(
                circle at 10% 15%,
                rgba(34, 211, 238, 0.18),
                transparent 30%
              ),
              radial-gradient(
                circle at 90% 20%,
                rgba(56, 189, 248, 0.16),
                transparent 32%
              ),
              radial-gradient(
                circle at 80% 90%,
                rgba(14, 165, 233, 0.13),
                transparent 32%
              ),
              linear-gradient(
                135deg,
                #07111f 0%,
                #0b1628 48%,
                #0d1b2d 100%
              )
            `,
          }}
        />

        <div className="absolute -left-48 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-[130px]" />

        <div className="absolute -right-48 top-10 h-[580px] w-[580px] rounded-full bg-sky-400/10 blur-[140px]" />

        <div className="absolute -bottom-48 right-[5%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: `
              linear-gradient(
                rgba(255,255,255,0.8) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255,255,255,0.8) 1px,
                transparent 1px
              )
            `,
            backgroundSize: "55px 55px",
          }}
        />

        <div className="absolute left-[10%] top-[20%] h-3 w-3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_35px_rgba(103,232,249,1)]" />

        <div className="absolute right-[14%] top-[28%] h-2.5 w-2.5 animate-pulse rounded-full bg-sky-300 shadow-[0_0_30px_rgba(125,211,252,1)]" />

        <div className="absolute bottom-[20%] left-[18%] h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_28px_rgba(103,232,249,1)]" />

        <div className="absolute bottom-[24%] right-[28%] h-2 w-2 animate-pulse rounded-full bg-sky-300 shadow-[0_0_25px_rgba(125,211,252,1)]" />

      </div>

      {/* =====================================================
          MAIN CONTAINER
      ====================================================== */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-10">

        <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/40 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-2">

          {/* =================================================
              LEFT SIDE
          ================================================== */}

          <section className="relative hidden min-h-[680px] overflow-hidden border-r border-white/10 bg-gradient-to-br from-slate-900 via-[#0b1527] to-cyan-950/30 p-10 lg:flex lg:flex-col lg:justify-between xl:p-12">

            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />

            <div className="relative z-10">

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 shadow-lg shadow-cyan-500/20">
                  <GraduationCap size={30} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    CampusConnect
                  </h1>

                  <p className="text-sm text-slate-400">
                    Smart Campus Management
                  </p>
                </div>

              </div>

              <div className="mt-28">

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
                  <Sparkles size={15} />
                  Faculty Management Platform
                </div>

                <h2 className="max-w-xl text-5xl font-bold leading-tight tracking-tight">

                  Empower your.
                  <br />

                  <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-cyan-400 bg-clip-text text-transparent">
                    campus community.
                  </span>

                </h2>

                <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                  Manage students, attendance, academic
                  activities, schedules and faculty
                  responsibilities from one modern platform.
                </p>

              </div>

              <div className="mt-12 grid grid-cols-3 gap-3">

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-cyan-400/[0.05]">

                  <Users
                    size={21}
                    className="text-cyan-400"
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Students
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Management
                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-sky-400/30 hover:bg-sky-400/[0.05]">

                  <ClipboardCheck
                    size={21}
                    className="text-sky-400"
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Attendance
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Tracking
                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-cyan-400/[0.05]">

                  <CalendarDays
                    size={21}
                    className="text-cyan-400"
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Schedule
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Planning
                  </p>

                </div>

              </div>

            </div>

            <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">

              <ShieldCheck
                size={15}
                className="text-cyan-400"
              />

              Secure faculty access

            </div>

          </section>

          {/* =================================================
              RIGHT SIDE
          ================================================== */}

          <section className="flex min-h-[680px] items-center justify-center bg-[#0d1625]/95 p-6 sm:p-10 lg:p-14">

            <div className="w-full max-w-md">

              <div className="mb-10 flex items-center gap-3 lg:hidden">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500">
                  <GraduationCap size={24} />
                </div>

                <div>

                  <h1 className="font-bold">
                    CampusConnect
                  </h1>

                  <p className="text-xs text-slate-500">
                    Smart Campus Management
                  </p>

                </div>

              </div>

              <div>

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">

                  <UserCheck size={14} />

                  Faculty Portal

                </div>

                <h2 className="text-3xl font-bold tracking-tight text-white">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Sign in to access your CampusConnect
                  faculty dashboard.
                </p>

              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300"
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleLogin}
                className="mt-8 space-y-5"
              >

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email / Faculty User ID
                  </label>

                  <div className="relative">

                    <Mail
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="email"
                      name="email"
                      type="text"
                      placeholder="faculty@campusconnect.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(
                          e.target.value
                        );

                        if (error) {
                          setError("");
                        }
                      }}
                      required
                      autoComplete="username"
                      disabled={loading}
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                  </div>

                </div>

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-300"
                    >
                      Password
                    </label>

                    <span className="text-xs text-slate-600">
                      Secure access
                    </span>

                  </div>

                  <div className="relative">

                    <LockKeyhole
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(
                          e.target.value
                        );

                        if (error) {
                          setError("");
                        }
                      }}
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setShowPassword(
                          (value) =>
                            !value
                        );
                      }}
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-cyan-300 disabled:cursor-not-allowed"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >

                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}

                    </button>

                  </div>

                </div>

                <div className="-mt-1 flex justify-end">

                  <Link
                    href="/faculty/forgot-password"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 transition hover:text-cyan-300 hover:underline"
                  >
                    <KeyRound size={13} />
                    Forgot password?
                  </Link>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-400 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition duration-300 hover:from-cyan-400 hover:via-sky-400 hover:to-cyan-300 hover:shadow-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />

                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to Faculty Portal

                      <ArrowRight
                        size={18}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}

                </button>

              </form>

              <div className="mt-6">

                <div className="relative">

                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>

                  <div className="relative flex justify-center">

                    <span className="bg-[#0d1625] px-3 text-xs text-slate-600">
                      New to CampusConnect?
                    </span>

                  </div>

                </div>

                <Link
                  href="/faculty/register"
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.08]"
                >

                  <UserPlus size={17} />

                  Create Faculty Account

                </Link>

              </div>

              <div className="mt-6 text-center">

                <Link
                  href="/"
                  className="text-xs font-medium text-cyan-400 transition hover:text-cyan-300 hover:underline"
                >
                  ← Back to CampusConnect
                </Link>

              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600">

                <ShieldCheck size={14} />

                Your connection is protected

              </div>

              <div className="mt-8 border-t border-white/5 pt-6 text-center">

                <p className="text-xs text-slate-600">
                  CampusConnect Faculty Portal
                </p>

                <p className="mt-1 text-xs text-slate-700">
                  Smart campus management platform
                </p>

              </div>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}