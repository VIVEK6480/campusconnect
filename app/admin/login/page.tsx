"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
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
  Building2,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const text = await response.text();

      let data: {
        success?: boolean;
        message?: string;
        user?: {
          id: string;
          name: string;
          email: string;
          role: string;
          profileImage?: string | null;
        };
      } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error("Invalid server response:", text);
        setError(
          `Server returned an invalid response (${response.status}).`
        );
        return;
      }

      console.log("ADMIN LOGIN STATUS:", response.status);
      console.log("ADMIN LOGIN RESPONSE:", data);

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            `Login failed (${response.status}). Please check your credentials.`
        );
        return;
      }

      if (!data.user) {
        setError(
          "Login succeeded, but administrator information was not returned."
        );
        return;
      }

      const role = String(data.user.role).toUpperCase();

      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        setError(
          "Access denied. This account is not an administrator."
        );
        return;
      }

      /*
       * The application uses the HTTP-only token cookie.
       * Remove old authentication values left by previous versions.
       */
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      } catch {
        // Ignore browser storage errors.
      }

      console.log("ADMIN LOGIN SUCCESS:", data.user.email);
      console.log("ADMIN ROLE:", data.user.role);

      /*
       * Use a complete browser navigation instead of router.push().
       * This makes the browser send the newly-created HTTP-only
       * authentication cookie to the admin dashboard.
       */
      window.location.replace("/admin/dashboard");
    } catch (err) {
      console.error("ADMIN LOGIN ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06101f] text-white">
      {/* ========================================================= */}
      {/* BACKGROUND */}
      {/* ========================================================= */}

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(
                circle at 8% 18%,
                rgba(37, 99, 235, 0.30),
                transparent 32%
              ),
              radial-gradient(
                circle at 92% 15%,
                rgba(59, 130, 246, 0.28),
                transparent 34%
              ),
              radial-gradient(
                circle at 78% 88%,
                rgba(139, 92, 246, 0.22),
                transparent 34%
              ),
              radial-gradient(
                circle at 18% 88%,
                rgba(29, 78, 216, 0.18),
                transparent 34%
              ),
              linear-gradient(
                135deg,
                #02060c 0%,
                #06101f 45%,
                #0b1b35 100%
              )
            `,
          }}
        />

        <div className="absolute -left-48 -top-32 h-[520px] w-[520px] rounded-full bg-blue-500/10 blur-[130px]" />

        <div className="absolute -right-48 top-20 h-[580px] w-[580px] rounded-full bg-blue-500/10 blur-[140px]" />

        <div className="absolute -bottom-48 right-[5%] h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[130px]" />

        <div className="absolute bottom-[-220px] left-[25%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[130px]" />

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

        <div className="absolute left-[10%] top-[20%] h-3 w-3 animate-pulse rounded-full bg-blue-300 shadow-[0_0_35px_rgba(147,197,253,1)]" />

        <div className="absolute right-[14%] top-[28%] h-2.5 w-2.5 animate-pulse rounded-full bg-blue-300 shadow-[0_0_30px_rgba(147,197,253,1)]" />

        <div className="absolute bottom-[20%] left-[18%] h-2 w-2 animate-pulse rounded-full bg-blue-300 shadow-[0_0_28px_rgba(147,197,253,1)]" />

        <div className="absolute bottom-[24%] right-[28%] h-2 w-2 animate-pulse rounded-full bg-violet-300 shadow-[0_0_25px_rgba(196,181,253,1)]" />
      </div>

      {/* ========================================================= */}
      {/* MAIN */}
      {/* ========================================================= */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/50 backdrop-blur-xl lg:grid-cols-2">

          {/* ===================================================== */}
          {/* LEFT SIDE */}
          {/* ===================================================== */}

          <section className="relative hidden min-h-[680px] overflow-hidden border-r border-white/10 bg-gradient-to-br from-blue-500/15 via-slate-950/60 to-violet-700/15 p-12 lg:flex lg:flex-col lg:justify-between">

            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl" />

            <div className="relative z-10">
              {/* LOGO */}

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25">
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

              {/* HERO */}

              <div className="mt-28">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                  <Sparkles size={15} />
                  Next Generation Campus Platform
                </div>

                <h2 className="max-w-xl text-5xl font-bold leading-tight tracking-tight">
                  One platform.
                  <br />
                  <span className="bg-gradient-to-r from-blue-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                    Entire campus.
                  </span>
                </h2>

                <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                  Manage students, clubs, events, memberships,
                  announcements and campus activities from one
                  powerful administration platform.
                </p>
              </div>

              {/* FEATURE CARDS */}

              <div className="mt-12 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-blue-500/[0.06]">
                  <Users
                    className="text-blue-400"
                    size={21}
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Students
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Management
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-blue-500/[0.06]">
                  <Building2
                    className="text-blue-400"
                    size={21}
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Clubs
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Activities
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-violet-500/[0.06]">
                  <CalendarDays
                    className="text-violet-400"
                    size={21}
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Events
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Planning
                  </p>
                </div>
              </div>
            </div>

            {/* SECURITY */}

            <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck
                size={15}
                className="text-blue-400"
              />

              Secure administrative access
            </div>
          </section>

          {/* ===================================================== */}
          {/* RIGHT SIDE */}
          {/* ===================================================== */}

          <section className="flex min-h-[680px] items-center justify-center bg-[#071321]/85 p-6 sm:p-10 lg:p-14">
            <div className="w-full max-w-md">

              {/* MOBILE LOGO */}

              <div className="mb-10 flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500">
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

              {/* HEADING */}

              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">
                  <ShieldCheck size={14} />
                  Admin Portal
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-white">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Sign in to access your CampusConnect
                  administration dashboard.
                </p>
              </div>

              {/* ERROR */}

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300"
                >
                  {error}
                </div>
              )}

              {/* FORM */}

              <form
                onSubmit={handleLogin}
                className="mt-8 space-y-5"
              >
                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="email"
                      type="email"
                      placeholder="admin@campusconnect.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) {
                          setError("");
                        }
                      }}
                      required
                      autoComplete="email"
                      disabled={loading}
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* PASSWORD */}

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
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) {
                          setError("");
                        }
                      }}
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setShowPassword((value) => !value);
                      }}
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-blue-300 disabled:cursor-not-allowed"
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

                  {/* FORGOT PASSWORD */}

                  <div className="mt-3 flex justify-end">
                    <Link
                      href="/auth/forgot-password?portal=admin"
                      className="group inline-flex items-center gap-1 text-sm font-medium text-blue-300 transition hover:text-blue-200 hover:underline"
                    >
                      Forgot password?

                      <ArrowRight
                        size={14}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </Link>
                  </div>
                </div>

                {/* LOGIN BUTTON */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-300 hover:from-blue-500 hover:via-blue-400 hover:to-blue-600 hover:shadow-blue-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to Admin Portal

                      <ArrowRight
                        size={18}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* SECURITY */}

              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600">
                <ShieldCheck size={14} />
                Your connection is protected
              </div>

              {/* FOOTER */}

              <div className="mt-10 border-t border-white/5 pt-6 text-center">
                <p className="text-xs text-slate-600">
                  CampusConnect Administration System
                </p>

                <p className="mt-1 text-xs text-slate-700">
                  Secure campus management platform
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}