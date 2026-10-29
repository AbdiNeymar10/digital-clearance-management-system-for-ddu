import * as React from "react";
import Link from "next/link";
import { UniversityCrest } from "@/components/ui/university-crest";
import { UNIVERSITY_INFO, NAVIGATION_LINKS } from "@/lib/constants";
import { ShieldCheck, MapPin, Building } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#07111e] text-slate-300 border-t border-slate-800">
      {/* Main Footer Links */}
      <div className="ddu-container py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Identity column (2 cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <UniversityCrest size={48} variant="white" />
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Dire Dawa University
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Digital Clearance Management System (DCMS)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The official clearance and accountability verification portal of Dire Dawa University,
              facilitating parallel departmental approvals for graduating and withdrawing students.
            </p>

            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Main Campus, {UNIVERSITY_INFO.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{UNIVERSITY_INFO.pobox}</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              System Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              {NAVIGATION_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Portals & Roles */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Access Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/login"
                  className="text-slate-400 hover:text-teal-300 transition-colors flex items-center gap-1"
                >
                  <span>Student Portal</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-slate-400 hover:text-teal-300 transition-colors flex items-center gap-1"
                >
                  <span>Department Reviewer Desk</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-slate-400 hover:text-teal-300 transition-colors flex items-center gap-1"
                >
                  <span>Registrar Directorate</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-slate-400 hover:text-teal-300 transition-colors flex items-center gap-1"
                >
                  <span>System Administration</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional Notice & Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Support & Inquiries
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintained jointly by the {UNIVERSITY_INFO.registrarOffice} for academic clearance operations.
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              For technical clearance assistance or login issues, consult your respective College Dean or ICT Helpdesk on campus.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar with Compliance Notice */}
      <div className="border-t border-slate-800/80 bg-[#050c15] py-5">
        <div className="ddu-container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            © {UNIVERSITY_INFO.year} {UNIVERSITY_INFO.name}. All institutional rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Academic Year {UNIVERSITY_INFO.academicYear}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Official Academic System
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
