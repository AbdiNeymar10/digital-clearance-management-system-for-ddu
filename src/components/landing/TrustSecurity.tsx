import * as React from "react";
import {
  Lock,
  FileKey2,
  History,
  FileCheck,
  UserCheck,
} from "lucide-react";

export function TrustSecurity() {
  const securityPillars = [
    {
      title: "Strict Role-Based Access (RBAC)",
      description:
        "Every actor — whether a student, proctor, librarian, finance clerk, or university registrar — operates within clearly separated, verified authorization levels.",
      icon: UserCheck,
    },
    {
      title: "Controlled Document Privacy",
      description:
        "Uploaded sensitive documents, cost-sharing forms, and clearance receipts are stored in restricted private storage buckets accessible solely through time-limited authorized tokens.",
      icon: FileKey2,
    },
    {
      title: "Immutable Audit Trails",
      description:
        "Every clearance sign-off, comment, hold placement, or modification is cryptographically timestamped and logged with user identity for accountability.",
      icon: History,
    },
    {
      title: "Database-Level Row Security (RLS)",
      description:
        "PostgreSQL Row Level Security policies ensure students cannot view peer records and officers can only interact with records designated to their department.",
      icon: Lock,
    },
  ];

  return (
    <section id="security" className="py-20 lg:py-28 bg-[#0b1a2e] text-white border-b border-slate-800 relative overflow-hidden">
      {/* Subtle ambient gradient */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="ddu-container relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/60 text-xs font-semibold uppercase tracking-wider">
            Governance & Compliance
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Institutional Trust & Security Architecture
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Engineered with strict governance principles to safeguard student confidentiality, maintain document integrity, and protect official university records.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {securityPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="flex items-start gap-4 p-6 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsible Security Notice Box */}
        <div className="mt-14 max-w-4xl mx-auto p-5 sm:p-6 rounded-xl bg-slate-900/90 border border-teal-500/30 text-xs sm:text-sm text-slate-300 flex items-center gap-3.5">
          <FileCheck className="w-6 h-6 text-teal-400 shrink-0" />
          <p>
            <strong className="text-white">Notice on System Integrity:</strong> Dire Dawa University DCMS enforces server-side permission validation and strict database controls. Official clearance certificates can only be issued by the authenticated Directorate of the Registrar.
          </p>
        </div>
      </div>
    </section>
  );
}
