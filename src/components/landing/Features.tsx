import * as React from "react";
import {
  Laptop2,
  GitFork,
  UploadCloud,
  BellRing,
  QrCode,
  ShieldCheck,
} from "lucide-react";

export function Features() {
  const features = [
    {
      title: "Digital Applications from Anywhere",
      description:
        "Students initiate their clearance request anytime from mobile devices or campus computers without obtaining physical paper booklets or wandering across campus.",
      icon: Laptop2,
      tag: "Accessibility",
    },
    {
      title: "Real-Time 8-Department Tracking",
      description:
        "Watch approvals update live as each directorate, library desk, and student housing office marks accountability off without bureaucratic bottlenecks.",
      icon: GitFork,
      tag: "Live Status",
    },
    {
      title: "Secure Document & Receipt Upload",
      description:
        "Directly upload scanned receipts, cost-sharing forms, book return receipts, and dormitory surrender slips with end-to-end server verification.",
      icon: UploadCloud,
      tag: "Document Storage",
    },
    {
      title: "Instant Alerts & Hold Remarks",
      description:
        "Receive immediate notifications and detailed remarks if a department places a hold, explaining exactly which item requires return or fine payment.",
      icon: BellRing,
      tag: "Real-time Alerts",
    },
    {
      title: "Tamper-Evident QR Certificate",
      description:
        "The final clearance certificate includes an encrypted cryptographic QR code that employers, embassies, and graduate schools can instantly authenticate.",
      icon: QrCode,
      tag: "Official Verification",
    },
    {
      title: "Role-Based Officer Portals",
      description:
        "Staff officers only see clearances relevant to their department, preserving student data privacy and speeding up bulk student approvals.",
      icon: ShieldCheck,
      tag: "Data Privacy",
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="ddu-container">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider">
            System Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1a2e] dark:text-white tracking-tight">
            Designed for Modern University Administration
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Engineered specifically to solve the administrative challenges of higher education clearance workflows at Dire Dawa University.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex flex-col bg-white dark:bg-[#0b1a2e] rounded-2xl p-7 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {feature.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors mb-2.5">
                  {feature.title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
