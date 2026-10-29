"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ClearanceRequestSummary } from "@/lib/actions/clearance-actions";
import type { ClearanceRequestStatus } from "@/types/database";
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileEdit,
  ArrowRight,
  Filter,
  GraduationCap,
  Building,
} from "lucide-react";

interface StudentRequestsListClientProps {
  initialRequests: ClearanceRequestSummary[];
  studentName: string;
  studentId: string;
}

export function StudentRequestsListClient({
  initialRequests,
  studentName,
  studentId,
}: StudentRequestsListClientProps) {
  const [filter, setFilter] = React.useState<string>("ALL");

  const filteredRequests = initialRequests.filter((req) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") {
      return ["SUBMITTED", "UNDER_REVIEW", "ACTION_REQUIRED", "READY_FOR_REGISTRAR"].includes(req.status);
    }
    if (filter === "DRAFT") return req.status === "DRAFT";
    if (filter === "APPROVED") return req.status === "APPROVED";
    if (filter === "CANCELLED") return req.status === "CANCELLED";
    if (filter === "REJECTED") return req.status === "REJECTED";
    return true;
  });

  const activeCount = initialRequests.filter((r) =>
    ["SUBMITTED", "UNDER_REVIEW", "ACTION_REQUIRED", "READY_FOR_REGISTRAR"].includes(r.status)
  ).length;

  const renderStatusBadge = (status: ClearanceRequestStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="neutral" size="sm" className="gap-1">
            <FileEdit className="w-3 h-3 text-slate-400" />
            <span>Draft</span>
          </Badge>
        );
      case "SUBMITTED":
        return (
          <Badge variant="in_review" size="sm" className="gap-1">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>Submitted</span>
          </Badge>
        );
      case "UNDER_REVIEW":
        return (
          <Badge variant="in_review" size="sm" className="gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Under Review</span>
          </Badge>
        );
      case "ACTION_REQUIRED":
        return (
          <Badge variant="action_required" size="sm" className="gap-1">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span>Action Required</span>
          </Badge>
        );
      case "READY_FOR_REGISTRAR":
        return (
          <Badge variant="cleared" size="sm" className="gap-1">
            <CheckCircle2 className="w-3 h-3 text-teal-400" />
            <span>Ready for Registrar</span>
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="cleared" size="sm" className="gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Approved</span>
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="action_required" size="sm" className="gap-1">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>Rejected</span>
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="neutral" size="sm" className="gap-1">
            <XCircle className="w-3 h-3 text-slate-500" />
            <span>Cancelled</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            My Clearance Requests
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Track your clearance applications, view 8-department parallel review tasks, and manage drafts.
          </p>
        </div>

        <Link href="/student/requests/new">
          <Button
            variant="primary"
            size="md"
            className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30 font-semibold"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            <span>Initiate New Request</span>
          </Button>
        </Link>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0b1a2e] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">Total Applications</span>
          <span className="text-2xl font-bold text-white font-mono mt-1 block">
            {initialRequests.length}
          </span>
        </div>
        <div className="bg-[#0b1a2e] border border-blue-500/30 rounded-xl p-4">
          <span className="text-xs text-blue-300 block font-medium">Active Requests</span>
          <span className="text-2xl font-bold text-blue-400 font-mono mt-1 block">
            {activeCount}
          </span>
        </div>
        <div className="bg-[#0b1a2e] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">Saved Drafts</span>
          <span className="text-2xl font-bold text-slate-300 font-mono mt-1 block">
            {initialRequests.filter((r) => r.status === "DRAFT").length}
          </span>
        </div>
        <div className="bg-[#0b1a2e] border border-teal-500/30 rounded-xl p-4">
          <span className="text-xs text-teal-300 block font-medium">Cleared / Approved</span>
          <span className="text-2xl font-bold text-teal-400 font-mono mt-1 block">
            {initialRequests.filter((r) => r.status === "APPROVED").length}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 bg-[#0b1a2e] p-2.5 rounded-xl border border-slate-800 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-400 text-xs px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {[
            { id: "ALL", label: "All Requests" },
            { id: "ACTIVE", label: `Active (${activeCount})` },
            { id: "DRAFT", label: "Drafts" },
            { id: "APPROVED", label: "Approved" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === tab.id
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono px-2">
          {studentName} • ID: {studentId}
        </span>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-[#0b1a2e] border border-slate-800 rounded-2xl p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Clearance Requests Found</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              {filter === "ALL"
                ? "You have not submitted or drafted any clearance requests yet. Get started by selecting your clearance type."
                : `No requests matching the "${filter}" filter.`}
            </p>
          </div>
          {filter === "ALL" && (
            <Link href="/student/requests/new">
              <Button variant="primary" size="md" className="bg-blue-600 hover:bg-blue-500 mt-2">
                <PlusCircle className="w-4 h-4 mr-2" />
                <span>Start Clearance Application</span>
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-[#0b1a2e] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    {req.clearance_type_name}
                  </h4>
                  {renderStatusBadge(req.status)}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-mono flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{req.academic_term_name}</span>
                  </span>
                  <span>•</span>
                  <span>
                    {req.submitted_at
                      ? `Submitted: ${new Date(req.submitted_at).toLocaleDateString()}`
                      : `Draft Created: ${new Date(req.created_at).toLocaleDateString()}`}
                  </span>
                </div>

                {/* 8-Department Parallel Progress (when submitted) */}
                {req.status !== "DRAFT" && (
                  <div className="pt-1 flex items-center gap-3">
                    <div className="w-36 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-teal-500 h-full transition-all"
                        style={{
                          width: `${(req.cleared_tasks_count / (req.total_tasks_count || 8)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {req.cleared_tasks_count} of {req.total_tasks_count || 8} Units Cleared
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                {req.status === "DRAFT" ? (
                  <Link href={`/student/requests/new?draftId=${req.id}`}>
                    <Button variant="outline-light" size="sm" className="text-xs">
                      <FileEdit className="w-3.5 h-3.5 mr-1.5" />
                      <span>Edit Draft</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/student/requests/${req.id}`}>
                    <Button
                      variant="outline-light"
                      size="sm"
                      className="text-xs group-hover:border-blue-500/50"
                    >
                      <span>View Tasks & Status</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
