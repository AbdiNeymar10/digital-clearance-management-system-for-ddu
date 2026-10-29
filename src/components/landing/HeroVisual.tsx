"use client";

import * as React from "react";
import { DEMO_CLEARANCE_DATA } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
} from "lucide-react";

export function HeroVisual() {
  const [filter, setFilter] = React.useState<"all" | "cleared" | "pending">("all");
  const { student, requestDetails, departments } = DEMO_CLEARANCE_DATA;

  const filteredDepts = React.useMemo(() => {
    if (filter === "cleared") {
      return departments.filter((d) => d.status === "approved");
    }
    if (filter === "pending") {
      return departments.filter((d) => d.status !== "approved");
    }
    return departments;
  }, [filter, departments]);

  const percentage = Math.round(
    (requestDetails.clearedCount / requestDetails.totalCount) * 100
  );

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Decorative ambient glow backdrop */}
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Preview Container */}
      <div className="relative rounded-2xl border border-slate-700/80 bg-[#0d1f36]/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden text-slate-100">
        {/* Top Demonstration Ribbon Watermark */}
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-blue-950 border-b border-teal-500/30 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="demo" className="bg-teal-500/20 text-teal-300 border-teal-400/40">
              Interactive Preview
            </Badge>
            <span className="text-slate-300 font-medium hidden sm:inline">
              Demonstration Clearance Record • Non-Production Sample Data
            </span>
            <span className="text-slate-300 font-medium sm:hidden">
              Sample Record
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>ID: {requestDetails.trackingNumber}</span>
          </div>
        </div>

        {/* Dashboard Header Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-[#0a182b]/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Student Info */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center font-bold text-white shadow-md text-lg shrink-0">
                KT
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {student.fullName}
                  </h4>
                  <Badge variant="info" className="bg-blue-900/60 text-blue-200 border-blue-700/60 text-[11px]">
                    {student.clearanceType}
                  </Badge>
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-2 sm:gap-3 flex-wrap mt-1">
                  <span className="font-mono text-slate-200 font-medium">
                    {student.studentId}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span>{student.department}</span>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span className="text-slate-400 hidden sm:inline">Class of {student.admissionYear}</span>
                </div>
              </div>
            </div>

            {/* Quick action simulation badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 font-medium">
                <QrCode className="w-3.5 h-3.5 text-teal-400" />
                <span>QR Cert Ready Upon Final Sign-off</span>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="mt-5 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">
                  Institutional Clearance Progress
                </span>
                <span className="text-teal-400 font-medium">
                  ({requestDetails.clearedCount} of {requestDetails.totalCount} Offices Cleared)
                </span>
              </div>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {percentage}% Completed
              </span>
            </div>
            <Progress
              value={percentage}
              size="md"
              indicatorColor="bg-gradient-to-r from-teal-500 via-emerald-400 to-blue-500"
              className="bg-slate-800 h-2.5"
            />
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-[#091524] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 mr-2 text-[11px] font-medium hidden sm:inline">
              Filter Review Units:
            </span>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                filter === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              All Offices ({departments.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("cleared")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                filter === "cleared"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              Cleared ({requestDetails.clearedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                filter === "pending"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              Pending / In Review (2)
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden md:flex items-center gap-1">
            <span>Submitted {requestDetails.submittedDate}</span>
          </div>
        </div>

        {/* Department Clearance Cards List */}
        <div className="p-4 sm:p-6 max-h-[380px] overflow-y-auto space-y-3 divide-y divide-transparent">
          {filteredDepts.map((dept) => {
            const isApproved = dept.status === "approved";
            const isInReview = dept.status === "in_review";

            return (
              <div
                key={dept.deptId}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isApproved
                    ? "bg-[#0b1c31]/60 border-slate-800/80 hover:border-emerald-500/30"
                    : isInReview
                    ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {isApproved ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : isInReview ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <Clock className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm">
                          {dept.deptName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {dept.comment}
                      </p>
                      {dept.reviewedBy && (
                        <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-2 flex-wrap">
                          <span className="text-slate-300 font-medium">
                            {dept.reviewedBy}
                          </span>
                          {dept.reviewedDate && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span>Signed on {dept.reviewedDate}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="self-start sm:self-center shrink-0">
                    <span
                      className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${
                        isApproved
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : isInReview
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {dept.badgeText}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Demonstration Notice */}
        <div className="px-4 py-3 bg-[#081321] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Dire Dawa University DCMS Live Verification Engine</span>
          </div>
          <div className="font-mono text-slate-300">
            Hash: 8f9a...c41e [Demo]
          </div>
        </div>
      </div>
    </div>
  );
}
