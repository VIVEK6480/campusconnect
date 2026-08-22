"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  GraduationCap,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";

export default function FacultyForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const res = await fetch(
        "/api/auth/faculty/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.message ||
            "Unable to process your password reset request."
        );
        return;
      }

      /*
       * SUCCESS
       *
       * Keep the entered email so the confirmation
       * screen can display it.
       */
      setSentEmail(normalizedEmail);
      setEmailSent(true);
      setMessage("");
      setEmail("");
    } catch (err) {
      console.error(
        "FACULTY FORGOT PASSWORD ERROR:",
        err
      );

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06111d] text-white">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(
              circle at 12% 18%,
              rgba(34,211,238,0.16),
              transparent 28%
            ),
            radial-gradient(
              circle at 88% 78%,
              rgba(14,165,233,0.15),
              transparent 30%
            ),
            radial-gradient(
              circle at 50% 50%,
              rgba(59,130,246,0.05),
              transparent 45%
            ),
            linear-gradient(
              135deg,
              #06111d 0%,
              #091827 48%,
              #07121f 100%
            )
          `,
        }}
      />

      {/* =====================================================
          GRID
      ====================================================== */}

      <div
        className="absolute inset-0 opacity-[0.035]"
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

      {/* =====================================================
          BACKGROUND GLOWS
      ====================================================== */}

      <div className="absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.07] blur-[120px]" />

      <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-sky-500/[0.08] blur-[130px]" />

      <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.025] blur-[120px]" />

      {/* =====================================================
          FLOATING PARTICLES
      ====================================================== */}

      <div className="absolute left-[12%] top-[27%] h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300/70 shadow-[0_0_25px_rgba(103,232,249,0.9)]" />

      <div className="absolute right-[15%] top-[31%] h-3 w-3 animate-pulse rounded-full bg-sky-300/60 shadow-[0_0_25px_rgba(125,211,252,0.9)]" />

      <div className="absolute bottom-[23%] right-[11%] h-2 w-2 animate-pulse rounded-full bg-cyan-200/60 shadow-[0_0_20px_rgba(103,232,249,0.8)]" />

      <div className="absolute bottom-[32%] left-[17%] h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300/50 shadow-[0_0_15px_rgba(125,211,252,0.8)]" />

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">

        {/* ===================================================
            OUTER GLOW
        ==================================================== */}

        <div className="absolute h-[680px] w-[680px] rounded-[40px] bg-cyan-500/[0.025] blur-[100px]" />

        {/* ===================================================
            GRADIENT BORDER
        ==================================================== */}

        <div className="group relative w-full max-w-3xl rounded-[32px] p-[1px] shadow-[0_0_80px_rgba(34,211,238,0.08)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_110px_rgba(34,211,238,0.15)]">

          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-cyan-300/50 via-sky-500/15 to-blue-500/40 opacity-90" />

          {/* =================================================
              CARD
          ================================================== */}

          <div className="relative overflow-hidden rounded-[31px] border border-white/[0.07] bg-[#081422]/95 p-8 backdrop-blur-2xl sm:p-10 md:p-12">

            {/* Inner glow */}

            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[70%] -translate-x-1/2 rounded-full bg-cyan-400/[0.06] blur-[70px]" />

            <div className="pointer-events-none absolute bottom-[-100px] right-[-80px] h-64 w-64 rounded-full bg-sky-500/[0.05] blur-[80px]" />

            <div className="relative z-10">

              {/* =================================================
                  BRAND
              ================================================== */}

              <div className="flex items-center gap-5">

                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-white shadow-xl shadow-cyan-500/20 transition-all duration-500 group-hover:scale-105 group-hover:shadow-cyan-400/30">

                  <div className="absolute inset-0 rounded-2xl bg-cyan-400/30 blur-md" />

                  <GraduationCap
                    size={31}
                    className="relative z-10"
                  />

                </div>

                <div>

                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    CampusConnect
                  </h1>

                  <p className="mt-1 text-sm text-slate-400 sm:text-base">
                    Smart Campus Management
                  </p>

                </div>

              </div>

              {/* =================================================
                  DIVIDER
              ================================================== */}

              <div className="my-9 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent sm:my-10" />

              {/* =================================================
                  SUCCESS SCREEN
              ================================================== */}

              {emailSent ? (
                <div className="flex flex-col items-center text-center">

                  {/* Success Icon */}

                  <div className="relative mb-7">

                    <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />

                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] shadow-[0_0_40px_rgba(34,211,238,0.12)]">

                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/[0.08]">

                        <Check
                          size={25}
                          strokeWidth={2.5}
                          className="text-cyan-300"
                        />

                      </div>

                    </div>

                  </div>

                  {/* Heading */}

                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">

                    Check your{" "}

                    <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                      email
                    </span>

                  </h2>

                  {/* Description */}

                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">

                    A password reset link has been sent to{" "}

                    <span className="font-medium text-cyan-300">
                      {sentEmail}
                    </span>

                  </p>

                  {/* =================================================
                      WHAT TO DO NEXT
                  ================================================== */}

                  <div className="mt-8 w-full max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 text-left shadow-[0_15px_40px_rgba(0,0,0,0.15)]">

                    <h3 className="text-sm font-semibold text-slate-200">
                      What to do next
                    </h3>

                    <div className="mt-4 space-y-4">

                      <div className="flex items-start gap-3">

                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/[0.10] text-cyan-300">

                          <Mail size={13} />

                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                          Check your faculty email inbox for
                          the password reset message.
                        </p>

                      </div>

                      <div className="flex items-start gap-3">

                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/[0.10] text-cyan-300">

                          <ShieldCheck size={13} />

                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                          If you do not see it, check your
                          spam or junk folder.
                        </p>

                      </div>

                      <div className="flex items-start gap-3">

                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/[0.10] text-cyan-300">

                          <ArrowLeft size={13} />

                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                          Open the reset link in the email to
                          create your new password.
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      RETURN BUTTON
                  ================================================== */}

                  <Link
                    href="/faculty/login"
                    className="group/return mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-7 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(6,182,212,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:from-cyan-400 hover:to-sky-400 hover:shadow-[0_15px_40px_rgba(6,182,212,0.28)]"
                  >

                    Return to Faculty Portal

                    <ArrowLeft
                      size={17}
                      className="rotate-180 transition-transform duration-300 group-hover/return:translate-x-1"
                    />

                  </Link>

                </div>
              ) : (
                <>
                  {/* =================================================
                      FACULTY BADGE
                  ================================================== */}

                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-4 py-2 text-xs font-medium text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.05)]">

                    <ShieldCheck size={15} />

                    Secure Faculty Account Recovery

                  </div>

                  {/* =================================================
                      HEADING
                  ================================================== */}

                  <div className="mb-9">

                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">

                      Forgot your{" "}

                      <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                        password?
                      </span>

                    </h2>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                      Enter your faculty email address and we
                      will send you secure instructions to reset
                      your CampusConnect faculty account password.
                    </p>

                  </div>

                  {/* =================================================
                      ERROR
                  ================================================== */}

                  {error && (
                    <div className="mb-7 rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3.5 text-sm leading-6 text-red-300 shadow-[0_10px_30px_rgba(127,29,29,0.08)]">
                      {error}
                    </div>
                  )}

                  {/* =================================================
                      FORM
                  ================================================== */}

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-7"
                  >

                    <div>

                      <label
                        htmlFor="email"
                        className="mb-3 block text-sm font-semibold text-slate-200"
                      >
                        Faculty Email Address
                      </label>

                      <div className="group/input relative">

                        <Mail
                          size={20}
                          className="absolute left-5 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition-colors duration-300 group-focus-within/input:text-cyan-400"
                        />

                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                            setMessage("");
                          }}
                          placeholder="faculty@campusconnect.com"
                          required
                          disabled={loading}
                          className="h-15 w-full rounded-xl border border-white/[0.10] bg-white/[0.035] pl-14 pr-5 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 hover:border-white/[0.16] focus:border-cyan-400/60 focus:bg-cyan-400/[0.025] focus:ring-4 focus:ring-cyan-400/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                        />

                      </div>

                    </div>

                    {/* =================================================
                        SEND BUTTON
                    ================================================== */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="group/button relative flex h-15 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-500 to-sky-500 text-sm font-semibold text-white shadow-[0_10px_35px_rgba(6,182,212,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:from-cyan-400 hover:via-cyan-400 hover:to-sky-400 hover:shadow-[0_15px_45px_rgba(6,182,212,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/button:translate-x-full" />

                      {loading ? (
                        <>
                          <span className="relative z-10 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                          <span className="relative z-10">
                            Sending...
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="relative z-10">
                            Send Reset Instructions
                          </span>

                          <Send
                            size={18}
                            className="relative z-10 transition-transform duration-300 group-hover/button:translate-x-1"
                          />
                        </>
                      )}

                    </button>

                  </form>
                </>
              )}

              {/* =================================================
                  SECURITY NOTE
              ================================================== */}

              <div className="mt-9 flex items-center justify-center gap-2 text-xs text-slate-500">

                <ShieldCheck
                  size={14}
                  className="text-cyan-500/70"
                />

                Your faculty account information is protected

              </div>

              {/* =================================================
                  FOOTER DIVIDER
              ================================================== */}

              <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* =================================================
                  BACK TO LOGIN
              ================================================== */}

              <div className="mt-7 text-center">

                <Link
                  href="/faculty/login"
                  className="group/back inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors duration-300 hover:text-cyan-300"
                >

                  <ArrowLeft
                    size={16}
                    className="transition-transform duration-300 group-hover/back:-translate-x-1"
                  />

                  Back to Faculty Login

                </Link>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}