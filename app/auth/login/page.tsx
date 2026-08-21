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
  CalendarDays,
  Building2,
  BookOpen,
} from "lucide-react";

export default function StudentLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      console.warn("AUTH CLEANUP ERROR:", error);
    }

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error) {
      console.warn("LOCAL STORAGE CLEANUP ERROR:", error);
    }
  }

  // =========================================================
  // ROLE BASED REDIRECT
  // =========================================================

  function redirectByRole(role?: string) {
    switch (role) {
      case "STUDENT":
        router.replace("/dashboard/student");
        break;

      case "FACULTY":
        router.replace("/dashboard/faculty");
        break;

      case "COORDINATOR":
        router.replace("/dashboard/coordinator");
        break;

      case "ADMIN":
        router.replace("/dashboard/admin");
        break;

      case "SUPER_ADMIN":
        router.replace("/dashboard/super-admin");
        break;

      default:
        setError(
          "Your account role is not configured for dashboard access."
        );
        break;
    }
  }

  // =========================================================
  // LOGIN
  // =========================================================

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // -------------------------------------------------------
      // CLEAN PREVIOUS SESSION
      // -------------------------------------------------------

      await clearAuthentication();

      // -------------------------------------------------------
      // VALIDATION
      // -------------------------------------------------------

      const cleanEmail = email.trim();

      if (!cleanEmail || !password) {
        setError(
          "Email / Campus User ID and password are required."
        );

        setLoading(false);
        return;
      }

      // -------------------------------------------------------
      // LOGIN API
      // -------------------------------------------------------

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          email: cleanEmail.toLowerCase(),
          campusUserId: cleanEmail.toUpperCase(),
          password,
        }),
      });

      // -------------------------------------------------------
      // RESPONSE TYPE
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // READ RESPONSE
      // -------------------------------------------------------

      try {
        data = await res.json();
      } catch {
        setError("Invalid response from the server.");
        return;
      }

      console.log("LOGIN RESPONSE:", data);

      // -------------------------------------------------------
      // APPROVAL STATUS
      // -------------------------------------------------------

      const approvalStatus =
        data.approvalStatus ||
        data.user?.approvalStatus;

      const rejectionReason =
        data.rejectionReason ||
        data.user?.rejectionReason;

      // -------------------------------------------------------
      // PENDING
      // -------------------------------------------------------

      if (approvalStatus === "PENDING") {
        await clearAuthentication();

        if (data.user?.role === "FACULTY") {
          setError(
            "Your faculty account is still waiting for approval."
          );
        } else {
          setError(
            "Your account is still waiting for Admin/Faculty approval."
          );
        }

        return;
      }

      // -------------------------------------------------------
      // REJECTED
      // -------------------------------------------------------

      if (approvalStatus === "REJECTED") {
        await clearAuthentication();

        if (rejectionReason) {
          setError(
            `Your registration was rejected. Reason: ${rejectionReason}`
          );
        } else {
          setError("Your registration was rejected.");
        }

        return;
      }

      // -------------------------------------------------------
      // API ERROR
      // -------------------------------------------------------

      if (!res.ok || !data.success) {
        setError(
          data.message ||
            "Invalid email / Campus User ID or password."
        );

        await clearAuthentication();

        return;
      }

      // -------------------------------------------------------
      // USER CHECK
      // -------------------------------------------------------

      if (!data.user) {
        setError(
          "User information was not returned by the server."
        );

        await clearAuthentication();

        return;
      }

      // -------------------------------------------------------
      // ROLE CHECK
      // -------------------------------------------------------

      const role = data.user.role;

      if (!role) {
        setError(
          "Your account role was not returned by the server."
        );

        await clearAuthentication();

        return;
      }

      // -------------------------------------------------------
      // APPROVAL CHECK
      //
      // Keep the existing approval behavior for Student
      // and Faculty accounts.
      // -------------------------------------------------------

      if (
        (role === "STUDENT" || role === "FACULTY") &&
        data.user.approvalStatus &&
        data.user.approvalStatus !== "APPROVED"
      ) {
        await clearAuthentication();

        if (data.user.approvalStatus === "PENDING") {
          if (role === "FACULTY") {
            setError(
              "Your faculty account is still waiting for approval."
            );
          } else {
            setError(
              "Your account is still waiting for Admin/Faculty approval."
            );
          }
        } else if (
          data.user.approvalStatus === "REJECTED"
        ) {
          if (data.user.rejectionReason) {
            setError(
              `Your registration was rejected. Reason: ${data.user.rejectionReason}`
            );
          } else {
            setError(
              "Your registration was rejected."
            );
          }
        } else {
          setError(
            "Your account is not approved for access."
          );
        }

        return;
      }

      // -------------------------------------------------------
      // STORE TOKEN
      // -------------------------------------------------------

      if (data.token) {
        localStorage.setItem(
          "token",
          data.token
        );
      }

      // -------------------------------------------------------
      // STORE USER
      // -------------------------------------------------------

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // -------------------------------------------------------
      // SUCCESS
      // -------------------------------------------------------

      console.log(
        "LOGIN SUCCESS:",
        data.user.email,
        "ROLE:",
        role
      );

      // -------------------------------------------------------
      // ROLE BASED DASHBOARD
      // -------------------------------------------------------

      redirectByRole(role);

      router.refresh();

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      await clearAuthentication();

      setError(
        "Unable to connect to the server. Please check that the CampusConnect server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061512] text-white">

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
                rgba(16, 185, 129, 0.30),
                transparent 32%
              ),
              radial-gradient(
                circle at 90% 20%,
                rgba(20, 184, 166, 0.25),
                transparent 34%
              ),
              radial-gradient(
                circle at 80% 90%,
                rgba(59, 130, 246, 0.20),
                transparent 34%
              ),
              linear-gradient(
                135deg,
                #020908 0%,
                #061512 50%,
                #071d19 100%
              )
            `,
          }}
        />

        <div className="absolute -left-48 -top-32 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-[130px]" />

        <div className="absolute -right-48 top-20 h-[580px] w-[580px] rounded-full bg-teal-500/10 blur-[140px]" />

        <div className="absolute -bottom-48 right-[5%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.04]"
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

      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">

        <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/50 backdrop-blur-xl lg:grid-cols-2">

          {/* =================================================
              LEFT
          ================================================== */}

          <section className="relative hidden min-h-[680px] overflow-hidden border-r border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950/60 to-blue-700/15 p-12 lg:flex lg:flex-col lg:justify-between">

            <div>

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
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

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                  <GraduationCap size={15} />
                  Campus Portal
                </div>

                <h2 className="max-w-xl text-5xl font-bold leading-tight tracking-tight">
                  Your campus.
                  <br />

                  <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-blue-300 bg-clip-text text-transparent">
                    Your experience.
                  </span>
                </h2>

                <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                  Access your CampusConnect dashboard,
                  clubs, events, activities, announcements
                  and everything happening around your campus.
                </p>

              </div>

              <div className="mt-12 grid grid-cols-3 gap-3">

                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <Building2
                    size={21}
                    className="text-emerald-400"
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Clubs
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Join &amp; Explore
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <CalendarDays
                    size={21}
                    className="text-teal-400"
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Events
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Discover
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <BookOpen
                    size={21}
                    className="text-blue-400"
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Activities
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Participate
                  </p>
                </div>

              </div>

            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck
                size={15}
                className="text-emerald-400"
              />
              Secure campus access
            </div>

          </section>

          {/* =================================================
              RIGHT
          ================================================== */}

          <section className="flex min-h-[680px] items-center justify-center bg-[#071512]/85 p-6 sm:p-10 lg:p-14">

            <div className="w-full max-w-md">

              <div className="mb-10 flex items-center gap-3 lg:hidden">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
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

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                  <GraduationCap size={14} />
                  Campus Portal
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-white">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Sign in to access your CampusConnect dashboard.
                </p>

              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
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
                    Email / Campus User ID
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
                      placeholder="Email or VKT-1234"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      required
                      autoComplete="username"
                      disabled={loading}
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:bg-white/[0.07] focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
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

                    <Link
                      href="/auth/forgot-password?portal=student"
                      className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300 hover:underline"
                    >
                      Forgot password?
                    </Link>

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
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:bg-white/[0.07] focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
                      }
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-emerald-300 disabled:cursor-not-allowed"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition duration-300 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 hover:shadow-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in

                      <ArrowRight
                        size={18}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}

                </button>

              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                Don&apos;t have an account?{" "}

                <Link
                  href="/auth/register"
                  className="font-semibold text-emerald-400 transition hover:text-emerald-300"
                >
                  Create an account
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600">
                <ShieldCheck size={14} />
                Your connection is protected
              </div>

              <div className="mt-10 border-t border-white/5 pt-6 text-center">

                <p className="text-xs text-slate-600">
                  CampusConnect Login Portal
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