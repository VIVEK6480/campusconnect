"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Building2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
  BookOpen,
  UserRoundCog,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02060a] text-white">

      {/* =====================================================
          PREMIUM LIVE BACKGROUND
          Center-converging ribbon system — 5 ribbons per side
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Base atmosphere — same dark green / navy character */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#16382f_0%,#0a1d19_30%,#061017_66%,#02050a_100%)]" />

        {/* Soft ambient glows */}
        <div className="aurora aurora-green absolute -left-[18%] -top-[20%] h-[680px] w-[680px] rounded-full bg-emerald-500/[0.10] blur-[145px]" />
        <div className="aurora aurora-cyan absolute -right-[18%] top-[2%] h-[680px] w-[680px] rounded-full bg-cyan-500/[0.075] blur-[155px]" />
        <div className="aurora aurora-blue absolute -bottom-[30%] left-[24%] h-[720px] w-[720px] rounded-full bg-blue-600/[0.065] blur-[165px]" />
        <div className="aurora aurora-violet absolute right-[8%] bottom-[0%] h-[520px] w-[520px] rounded-full bg-violet-600/[0.05] blur-[145px]" />

        {/* Fine technical grid */}
        <div
          className="tech-grid absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.75) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.75) 1px, transparent 1px)
            `,
            backgroundSize: "58px 58px",
          }}
        />

        {/* =================================================
            CENTER-CONVERGING RIBBONS
            EXACTLY FIVE flowing bands on each side.
            Left = emerald/teal, right = blue/cyan/violet.
        ================================================== */}
        <div className="absolute inset-0 overflow-hidden opacity-[0.88]">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1600 900"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="ccLeftRibbon" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0f3d32" stopOpacity="0.02" />
                <stop offset="28%" stopColor="#34d399" stopOpacity="0.22" />
                <stop offset="68%" stopColor="#5eead4" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.82" />
              </linearGradient>

              <linearGradient id="ccRightRibbon" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="#312e81" stopOpacity="0.02" />
                <stop offset="28%" stopColor="#4f46e5" stopOpacity="0.22" />
                <stop offset="68%" stopColor="#38bdf8" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.84" />
              </linearGradient>

              <linearGradient id="ccVioletRibbon" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="#312e81" stopOpacity="0.02" />
                <stop offset="55%" stopColor="#6366f1" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.64" />
              </linearGradient>

              <filter id="ccRibbonGlow" x="-20%" y="-100%" width="140%" height="300%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* LEFT — FIVE RIBBONS FLOW FROM THE LEFT EDGE INTO THE CENTER OF THE STUDENT CARD */}
            <g className="cc-ribbon-left" filter="url(#ccRibbonGlow)">
              <path d="M-120 330 C40 275 150 300 245 380 C315 440 365 515 410 600" fill="none" stroke="url(#ccLeftRibbon)" strokeWidth="34" strokeLinecap="round" opacity="0.62" />
              <path d="M-120 390 C35 335 145 355 235 420 C305 470 360 535 410 600" fill="none" stroke="url(#ccLeftRibbon)" strokeWidth="28" strokeLinecap="round" opacity="0.56" />
              <path d="M-120 455 C35 400 140 415 230 465 C300 505 355 555 410 600" fill="none" stroke="url(#ccLeftRibbon)" strokeWidth="22" strokeLinecap="round" opacity="0.50" />
              <path d="M-120 520 C35 470 145 475 230 505 C300 530 355 570 410 600" fill="none" stroke="url(#ccLeftRibbon)" strokeWidth="17" strokeLinecap="round" opacity="0.44" />
              <path d="M-120 585 C40 535 150 530 235 545 C305 560 360 585 410 600" fill="none" stroke="url(#ccLeftRibbon)" strokeWidth="12" strokeLinecap="round" opacity="0.38" />
            </g>

            {/* RIGHT — FIVE RIBBONS FLOW FROM THE RIGHT EDGE INTO THE CENTER OF THE FACULTY CARD */}
            <g className="cc-ribbon-right" filter="url(#ccRibbonGlow)">
              <path d="M1720 330 C1560 275 1450 300 1355 380 C1285 440 1235 515 1190 600" fill="none" stroke="url(#ccRightRibbon)" strokeWidth="34" strokeLinecap="round" opacity="0.62" />
              <path d="M1720 390 C1565 335 1455 355 1365 420 C1295 470 1240 535 1190 600" fill="none" stroke="url(#ccRightRibbon)" strokeWidth="28" strokeLinecap="round" opacity="0.56" />
              <path d="M1720 455 C1565 400 1460 415 1370 465 C1300 505 1245 555 1190 600" fill="none" stroke="url(#ccRightRibbon)" strokeWidth="22" strokeLinecap="round" opacity="0.50" />
              <path d="M1720 520 C1565 470 1455 475 1370 505 C1300 530 1245 570 1190 600" fill="none" stroke="url(#ccVioletRibbon)" strokeWidth="17" strokeLinecap="round" opacity="0.44" />
              <path d="M1720 585 C1560 535 1450 530 1365 545 C1295 560 1240 585 1190 600" fill="none" stroke="url(#ccVioletRibbon)" strokeWidth="12" strokeLinecap="round" opacity="0.38" />
            </g>

            {/* Subtle touch points aligned with the outer portal cards */}
            <circle cx="410" cy="600" r="4" fill="#67e8f9" opacity="0.12" />
            <circle cx="410" cy="600" r="16" fill="none" stroke="#5eead4" strokeWidth="1" opacity="0.06" />
            <circle cx="1190" cy="600" r="4" fill="#67e8f9" opacity="0.12" />
            <circle cx="1190" cy="600" r="16" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.06" />
          </svg>
        </div>

        {/* Floating background bubbles */}
        <span className="live-bubble bubble-1 absolute left-[8%] bottom-[-30px] h-3 w-3 rounded-full border border-emerald-200/30 bg-emerald-300/10 shadow-[0_0_20px_rgba(52,211,153,0.35)]" />
        <span className="live-bubble bubble-2 absolute left-[18%] bottom-[-40px] h-2 w-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 shadow-[0_0_18px_rgba(103,232,249,0.35)]" />
        <span className="live-bubble bubble-3 absolute left-[31%] bottom-[-35px] h-4 w-4 rounded-full border border-emerald-200/20 bg-emerald-300/[0.07] shadow-[0_0_24px_rgba(52,211,153,0.28)]" />
        <span className="live-bubble bubble-4 absolute left-[44%] bottom-[-25px] h-2.5 w-2.5 rounded-full border border-blue-200/25 bg-blue-300/10 shadow-[0_0_18px_rgba(96,165,250,0.3)]" />
        <span className="live-bubble bubble-5 absolute left-[57%] bottom-[-45px] h-3.5 w-3.5 rounded-full border border-cyan-200/25 bg-cyan-300/[0.07] shadow-[0_0_22px_rgba(103,232,249,0.3)]" />
        <span className="live-bubble bubble-6 absolute left-[69%] bottom-[-30px] h-2 w-2 rounded-full border border-violet-200/25 bg-violet-300/10 shadow-[0_0_18px_rgba(196,181,253,0.3)]" />
        <span className="live-bubble bubble-7 absolute left-[81%] bottom-[-50px] h-4 w-4 rounded-full border border-cyan-200/20 bg-cyan-300/[0.06] shadow-[0_0_24px_rgba(103,232,249,0.28)]" />
        <span className="live-bubble bubble-8 absolute left-[91%] bottom-[-35px] h-2.5 w-2.5 rounded-full border border-emerald-200/25 bg-emerald-300/10 shadow-[0_0_18px_rgba(52,211,153,0.3)]" />

        {/* Background moving light lines */}
        <div className="flow-line flow-line-1 absolute left-[-25%] top-[20%] h-px w-[52%] bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent" />
        <div className="flow-line flow-line-2 absolute right-[-25%] top-[39%] h-px w-[55%] bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
        <div className="flow-line flow-line-3 absolute left-[-30%] top-[58%] h-px w-[48%] bg-gradient-to-r from-transparent via-blue-300/22 to-transparent" />
        <div className="flow-line flow-line-4 absolute right-[-30%] top-[76%] h-px w-[50%] bg-gradient-to-r from-transparent via-violet-300/20 to-transparent" />

        {/* Network-style dots */}
        <div className="network-node absolute left-[12%] top-[25%] h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_16px_4px_rgba(52,211,153,0.38)]" />
        <div className="network-node absolute left-[27%] top-[17%] h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_14px_4px_rgba(103,232,249,0.35)]" />
        <div className="network-node absolute right-[18%] top-[24%] h-1.5 w-1.5 rounded-full bg-blue-300 shadow-[0_0_16px_4px_rgba(96,165,250,0.38)]" />
        <div className="network-node absolute right-[10%] top-[52%] h-1 w-1 rounded-full bg-violet-300 shadow-[0_0_14px_4px_rgba(196,181,253,0.32)]" />
        <div className="network-node absolute left-[18%] bottom-[23%] h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_16px_4px_rgba(52,211,153,0.34)]" />
        <div className="network-node absolute right-[22%] bottom-[18%] h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_16px_4px_rgba(103,232,249,0.34)]" />

        {/* Soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.42)_100%)]" />

        {/* Subtle scanline */}
        <div className="screen-scan absolute inset-x-0 top-0" />
      </div>

      {/* =====================================================
          LIVE BACKGROUND ANIMATIONS
      ===================================================== */}
      <style jsx global>{`
        @keyframes auroraGreen {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(70px, 55px, 0) scale(1.08); }
        }

        @keyframes auroraCyan {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-70px, 65px, 0) scale(1.08); }
        }

        @keyframes auroraBlue {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(60px, -50px, 0) scale(1.06); }
        }

        @keyframes auroraViolet {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-60px, -45px, 0) scale(1.08); }
        }

        .aurora-green { animation: auroraGreen 18s ease-in-out infinite; }
        .aurora-cyan { animation: auroraCyan 21s ease-in-out infinite; }
        .aurora-blue { animation: auroraBlue 24s ease-in-out infinite; }
        .aurora-violet { animation: auroraViolet 20s ease-in-out infinite; }

        @keyframes gridMove {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(58px, 58px, 0); }
        }

        .tech-grid { animation: gridMove 24s linear infinite; }

        @keyframes ribbonLeft {
          0%, 100% { transform: translate3d(-10px, 0, 0); }
          50% { transform: translate3d(18px, -5px, 0); }
        }

        @keyframes ribbonRight {
          0%, 100% { transform: translate3d(10px, 0, 0); }
          50% { transform: translate3d(-18px, 5px, 0); }
        }

        .cc-ribbon-left {
          transform-origin: 410px 600px;
          animation: ribbonLeft 9s ease-in-out infinite;
          will-change: transform;
        }

        .cc-ribbon-right {
          transform-origin: 1190px 600px;
          animation: ribbonRight 10s ease-in-out infinite;
          will-change: transform;
        }

        @keyframes bubbleRise {
          0% { transform: translate3d(0, 0, 0) scale(0.8); opacity: 0; }
          15% { opacity: 0.55; }
          70% { opacity: 0.35; }
          100% { transform: translate3d(20px, -110vh, 0) scale(1.2); opacity: 0; }
        }

        .live-bubble { animation: bubbleRise 13s linear infinite; }
        .bubble-2 { animation-delay: 2s; animation-duration: 16s; }
        .bubble-3 { animation-delay: 4s; animation-duration: 18s; }
        .bubble-4 { animation-delay: 1s; animation-duration: 14s; }
        .bubble-5 { animation-delay: 5s; animation-duration: 17s; }
        .bubble-6 { animation-delay: 3s; animation-duration: 15s; }
        .bubble-7 { animation-delay: 7s; animation-duration: 19s; }
        .bubble-8 { animation-delay: 6s; animation-duration: 14s; }

        @keyframes flowLine {
          0% { transform: translateX(-20%); opacity: 0; }
          15% { opacity: 0.8; }
          50% { opacity: 0.25; }
          85% { opacity: 0.7; }
          100% { transform: translateX(160%); opacity: 0; }
        }

        .flow-line { animation: flowLine 11s linear infinite; }
        .flow-line-2 { animation-delay: 3s; }
        .flow-line-3 { animation-delay: 6s; }
        .flow-line-4 { animation-delay: 8s; }

        @keyframes nodePulse {
          0%, 100% { transform: scale(0.75); opacity: 0.35; }
          50% { transform: scale(1.6); opacity: 1; }
        }

        .network-node { animation: nodePulse 4.5s ease-in-out infinite; }

        @keyframes screenScan {
          0% { transform: translateY(-110%); opacity: 0; }
          20% { opacity: 0.22; }
          50% { opacity: 0.05; }
          80% { opacity: 0.16; }
          100% { transform: translateY(520vh); opacity: 0; }
        }

        .screen-scan {
          height: 22%;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(52, 211, 153, 0.018),
            rgba(103, 232, 249, 0.012),
            transparent
          );
          animation: screenScan 17s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .aurora,
          .tech-grid,
          .cc-ribbon-left,
          .cc-ribbon-right,
          .live-bubble,
          .flow-line,
          .network-node,
          .screen-scan {
            animation: none !important;
          }
        }
      `}</style>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">

        <div className="w-full max-w-[1450px]">


          {/* =================================================
              HEADER
          ================================================= */}

          <header className="relative left-1/2 mb-10 flex w-screen -translate-x-1/2 items-center justify-between px-6 sm:px-8 lg:px-10">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">

                <GraduationCap size={27} />

              </div>

              <div>

                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  CampusConnect
                </h1>

                <p className="text-xs font-semibold text-slate-200 sm:text-sm">
                  Smart Campus Management
                </p>

              </div>

            </div>

            <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-slate-950/75 px-4 py-2 text-xs font-semibold text-slate-100 shadow-lg backdrop-blur-md sm:flex">

              <ShieldCheck
                size={15}
                className="text-emerald-400"
              />

              Secure Campus Platform

            </div>

          </header>


          {/* =================================================
              HERO
          ================================================= */}

          <section className="mb-10 text-center">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/[0.08] px-4 py-2 text-xs font-semibold text-emerald-200 shadow-lg shadow-emerald-500/5 sm:text-sm">

              <Sparkles size={15} />

              Welcome to CampusConnect

            </div>

            <h2 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-2xl sm:text-5xl lg:text-6xl">

              Everything your campus needs.

              <br />

              <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-blue-200 bg-clip-text text-transparent">

                Connected in one place.

              </span>

            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-200 drop-shadow-lg sm:text-base">

              Access clubs, events, activities, announcements and campus
              services from one modern platform.

            </p>

          </section>


          {/* =================================================
              THREE PORTALS
          ================================================= */}

          <section className="grid gap-5 lg:grid-cols-3">


            {/* =================================================
                STUDENT
            ================================================= */}

            <div className="group relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/80 via-[#101b1b]/95 to-[#071111]/95 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-emerald-400/50 hover:shadow-emerald-500/15">

              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/[0.08] blur-3xl transition duration-500 group-hover:bg-emerald-500/[0.16]" />

              <div className="absolute -bottom-28 -left-20 h-52 w-52 rounded-full bg-teal-500/[0.045] blur-3xl" />

              <div className="relative z-10">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">

                  <GraduationCap size={28} />

                </div>

                <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Student Portal
                </div>

                <h3 className="text-2xl font-bold text-white">
                  Welcome, Student
                </h3>

                <p className="mt-3 min-h-[72px] text-sm font-medium leading-6 text-slate-200">

                  Sign in to manage your campus activities, clubs, events,
                  memberships and notifications.

                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-100">

                    <Users
                      size={16}
                      className="text-emerald-400"
                    />

                    Clubs

                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-100">

                    <CalendarDays
                      size={16}
                      className="text-teal-400"
                    />

                    Events

                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-100">

                    <BookOpen
                      size={16}
                      className="text-blue-400"
                    />

                    Activities

                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-100">

                    <Sparkles
                      size={16}
                      className="text-violet-400"
                    />

                    Updates

                  </div>

                </div>

                <Link
                  href="/auth/login"
                  className="group/button mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-gradient-to-r from-emerald-400/[0.12] to-teal-400/[0.12] px-5 text-sm font-bold text-emerald-100 shadow-lg shadow-emerald-500/5 transition duration-300 hover:border-emerald-300/50 hover:from-emerald-500/20 hover:to-teal-500/20 hover:text-white hover:shadow-emerald-500/10"
                >

                  Student Login

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover/button:translate-x-1"
                  />

                </Link>

                <p className="mt-3 text-center text-xs font-semibold text-slate-300">
                  Student accounts only
                </p>

              </div>

            </div>


            {/* =================================================
                ADMIN
            ================================================= */}

            <div className="group relative overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-950/80 via-[#121a2a]/95 to-[#0a1020]/95 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-blue-400/50 hover:shadow-blue-500/15">

              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/[0.08] blur-3xl transition duration-500 group-hover:bg-blue-500/[0.16]" />

              <div className="absolute -bottom-28 -left-20 h-52 w-52 rounded-full bg-indigo-500/[0.04] blur-3xl" />

              <div className="relative z-10">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">

                  <ShieldCheck size={27} />

                </div>

                <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  Administration
                </div>

                <h3 className="text-2xl font-bold text-white">
                  Admin Portal
                </h3>

                <p className="mt-3 min-h-[72px] text-sm font-medium leading-6 text-slate-200">

                  Authorized administrators can manage users, clubs, events,
                  announcements and the complete CampusConnect platform.

                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-100">

                    <Users
                      size={16}
                      className="text-blue-400"
                    />

                    Users

                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-100">

                    <Building2
                      size={16}
                      className="text-indigo-400"
                    />

                    Clubs

                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-100">

                    <CalendarDays
                      size={16}
                      className="text-violet-400"
                    />

                    Events

                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-100">

                    <ShieldCheck
                      size={16}
                      className="text-emerald-400"
                    />

                    Security

                  </div>

                </div>

                <Link
                  href="/admin/login"
                  className="group/button mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-400/25 bg-blue-500/10 px-5 text-sm font-bold text-blue-200 transition duration-300 hover:border-blue-400/50 hover:bg-blue-500/20 hover:text-white"
                >

                  Login as Admin

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover/button:translate-x-1"
                  />

                </Link>

                <p className="mt-3 text-center text-xs font-semibold text-slate-300">
                  Authorized administration access only
                </p>

              </div>

            </div>


            {/* =================================================
                FACULTY
            ================================================= */}

            <div className="group relative overflow-hidden rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-[#17232c]/95 via-[#202c35]/95 to-[#101820]/95 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-cyan-300/55 hover:shadow-cyan-500/15">

              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/[0.07] blur-3xl transition duration-500 group-hover:bg-cyan-400/[0.14]" />

              <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-sky-500/[0.06] blur-3xl transition duration-500 group-hover:bg-sky-500/[0.12]" />

              <div className="relative z-10">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-500/20">

                  <UserRoundCog size={27} />

                </div>

                <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                  Faculty Portal
                </div>

                <h3 className="text-2xl font-bold text-white">
                  Welcome, Faculty
                </h3>

                <p className="mt-3 min-h-[72px] text-sm font-medium leading-6 text-slate-200">

                  Faculty members can manage academic activities, students,
                  clubs, events and campus-related responsibilities.

                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <div className="flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-[#263640]/70 px-3 py-3 text-xs font-semibold text-slate-100 transition duration-300 hover:border-cyan-300/30 hover:bg-[#2b3d47]">

                    <Users
                      size={16}
                      className="text-cyan-300"
                    />

                    Students

                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-[#263640]/70 px-3 py-3 text-xs font-semibold text-slate-100 transition duration-300 hover:border-cyan-300/30 hover:bg-[#2b3d47]">

                    <BookOpen
                      size={16}
                      className="text-sky-300"
                    />

                    Academics

                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-[#263640]/70 px-3 py-3 text-xs font-semibold text-slate-100 transition duration-300 hover:border-cyan-300/30 hover:bg-[#2b3d47]">

                    <CalendarDays
                      size={16}
                      className="text-cyan-300"
                    />

                    Events

                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-[#263640]/70 px-3 py-3 text-xs font-semibold text-slate-100 transition duration-300 hover:border-cyan-300/30 hover:bg-[#2b3d47]">

                    <Building2
                      size={16}
                      className="text-sky-300"
                    />

                    Clubs

                  </div>

                </div>

                <Link
                  href="/faculty/login"
                  className="group/button mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-gradient-to-r from-cyan-500/10 to-sky-500/10 px-5 text-sm font-bold text-cyan-100 transition duration-300 hover:border-cyan-300/55 hover:from-cyan-500/20 hover:to-sky-500/20 hover:text-white hover:shadow-lg hover:shadow-cyan-500/10"
                >

                  Login as Faculty

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover/button:translate-x-1"
                  />

                </Link>

                <p className="mt-3 text-center text-xs font-semibold text-slate-300">
                  Authorized faculty access only
                </p>

              </div>

            </div>

          </section>


          {/* =================================================
              BOTTOM FEATURES
          ================================================= */}

          <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur-md">

              <Building2
                size={15}
                className="text-emerald-400"
              />

              Club Management

            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur-md">

              <CalendarDays
                size={15}
                className="text-blue-400"
              />

              Event Management

            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur-md">

              <ShieldCheck
                size={15}
                className="text-violet-400"
              />

              Secure Access

            </div>

          </section>


          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="mt-6 text-center">

            <p className="text-xs font-semibold text-slate-300">
              © {new Date().getFullYear()} CampusConnect
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Smart Campus Management Platform
            </p>

            <p className="mt-3 text-sm font-bold text-slate-300">
              ❤️ Vivek Kumar
            </p>

          </footer>

        </div>

      </div>

    </main>
  );
}