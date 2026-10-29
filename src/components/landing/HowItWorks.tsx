import * as React from "react";
import {
  FileText,
  Users2,
  Receipt,
  Award,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Initiate Clearance Online",
      subtitle: "Student Portal Submission",
      description:
        "Log in with your official DDU student credentials. Select your clearance reason (Graduation, Withdrawal, or Transfer) and attach any preliminary department requirements.",
      icon: FileText,
      badge: "Step 1",
      highlight: "No physical clearance forms needed",
    },
    {
      step: "02",
      title: "Parallel Departmental Review",
      subtitle: "Simultaneous Multi-Office Processing",
      description:
        "All eight departments receive and audit your record simultaneously. Library, Dormitory, Cafeteria, Sports, Security, and Department Advisors sign off in parallel without office queues.",
      icon: Users2,
      badge: "Step 2",
      highlight: "Zero waiting for one office before another",
    },
    {
      step: "03",
      title: "Finance & Cost-Sharing Settlement",
      subtitle: "Fiscal Reconciliation",
      description:
        "The Cost Sharing & Finance Office verifies taxpayer agreements, tuition settlements, and property accountability directly within the system with immediate status notifications.",
      icon: Receipt,
      badge: "Step 3",
      highlight: "Transparent records & clear feedback",
    },
    {
      step: "04",
      title: "Registrar Approval & QR Certificate",
      subtitle: "Official Institutional Seal",
      description:
        "Once all departments confirm clearance, the Office of the Registrar issues the official Digital Clearance Certificate complete with a tamper-evident cryptographic QR code.",
      icon: Award,
      badge: "Step 4",
      highlight: "Instant verifiable digital credential",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="ddu-container">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider">
            Clearance Lifecycle
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1a2e] dark:text-white tracking-tight">
            How Digital Clearance Works at DDU
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            A transparent four-phase process designed to replace manual paper circulating
            with secure, real-time departmental coordination.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col bg-white dark:bg-[#0b1a2e] rounded-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                {/* Step number watermark */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black font-mono text-slate-200 dark:text-slate-800 group-hover:text-blue-100 dark:group-hover:text-blue-900/50 transition-colors">
                    {item.step}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {item.subtitle}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {item.title}
                  </h3>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 grow">
                  {item.description}
                </p>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item.highlight}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Process comparison callout banner */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#0b1a2e] to-[#122b4c] text-white flex flex-col lg:flex-row items-center justify-between gap-6 shadow-lg shadow-slate-950/10">
          <div className="space-y-1.5 text-center lg:text-left">
            <h4 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              The Old Paper Way vs. The DDU DCMS Way
            </h4>
            <p className="text-sm text-slate-300 max-w-2xl">
              Previously, students spent 1 to 2 weeks walking between 8 physical offices across campus to gather rubber stamps and signatures. DCMS completes the process digitally with full transparency.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <a
              href="#departments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-colors shadow-md"
            >
              <span>View All 8 Departments</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
