import * as React from "react";
import { DEPARTMENTS } from "@/lib/constants";
import {
  GraduationCap,
  BookOpen,
  Building2,
  Utensils,
  BookMarked,
  Coins,
  Receipt,
  Award,
} from "lucide-react";

export function DepartmentGrid() {
  const iconMap: Record<string, React.ElementType> = {
    GraduationCap,
    BookOpen,
    Building2,
    Utensils,
    BookMarked,
    Coins,
    Receipt,
    Award,
  };

  return (
    <section id="departments" className="py-20 lg:py-28 bg-white dark:bg-[#07111e] border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="ddu-container">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-semibold uppercase tracking-wider border border-teal-200 dark:border-teal-800/60">
            Institutional Integration
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1a2e] dark:text-white tracking-tight">
            Eight Integrated University Clearance Units
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Every administrative and academic office at Dire Dawa University is connected to a single, unified review workflow to guarantee institutional accountability.
          </p>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEPARTMENTS.map((dept) => {
            const Icon = iconMap[dept.iconName] || Award;
            return (
              <div
                key={dept.id}
                className="flex flex-col bg-slate-50/70 dark:bg-[#0b1a2e] hover:bg-white dark:hover:bg-slate-800/70 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {dept.code}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors mb-2">
                  {dept.name}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 grow">
                  {dept.description}
                </p>

                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 mt-auto">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                    <span className="truncate">{dept.scope}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
