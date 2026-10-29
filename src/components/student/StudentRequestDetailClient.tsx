"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  cancelClearanceRequest,
  submitClearanceRequest,
  type ClearanceRequestDetail,
} from "@/lib/actions/clearance-actions";
import type { ClearanceRequestStatus, DepartmentTaskStatus } from "@/types/database";
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  FileEdit,
  Send,
  Loader2,
  AlertTriangle,
  History,
  X,
} from "lucide-react";

interface StudentRequestDetailClientProps {
  request: ClearanceRequestDetail;
  isStudentOwner: boolean;
  userRole?: string;
}

export function StudentRequestDetailClient({
  request,
  isStudentOwner,
}: StudentRequestDetailClientProps) {
  const router = useRouter();

  // State
  const [currentRequest, setCurrentRequest] = React.useState<ClearanceRequestDetail>(request);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  const [isSubmittingDraft, setIsSubmittingDraft] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Status helper
  const renderStatusBadge = (status: ClearanceRequestStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="neutral" size="md" className="gap-1.5 font-semibold">
            <FileEdit className="w-3.5 h-3.5 text-slate-400" />
            <span>Draft (Unsubmitted)</span>
          </Badge>
        );
      case "SUBMITTED":
        return (
          <Badge variant="in_review" size="md" className="gap-1.5 font-semibold">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Submitted (Awaiting Parallel Reviews)</span>
          </Badge>
        );
      case "UNDER_REVIEW":
        return (
          <Badge variant="in_review" size="md" className="gap-1.5 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Under Review</span>
          </Badge>
        );
      case "ACTION_REQUIRED":
        return (
          <Badge variant="action_required" size="md" className="gap-1.5 font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Action Required</span>
          </Badge>
        );
      case "READY_FOR_REGISTRAR":
        return (
          <Badge variant="cleared" size="md" className="gap-1.5 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Ready for Registrar Final Sign-off</span>
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="cleared" size="md" className="gap-1.5 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Approved by University Registrar</span>
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="action_required" size="md" className="gap-1.5 font-semibold">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Rejected</span>
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="neutral" size="md" className="gap-1.5 font-semibold">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Cancelled by Student</span>
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="md">{status}</Badge>;
    }
  };

  const renderTaskStatusBadge = (status: DepartmentTaskStatus) => {
    switch (status) {
      case "CLEARED":
        return (
          <Badge variant="cleared" size="sm" className="gap-1 text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Cleared</span>
          </Badge>
        );
      case "IN_REVIEW":
        return (
          <Badge variant="in_review" size="sm" className="gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>In Review</span>
          </Badge>
        );
      case "HAS_LIABILITY":
        return (
          <Badge variant="action_required" size="sm" className="gap-1 text-[11px]">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span>Liability Identified</span>
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="action_required" size="sm" className="gap-1 text-[11px]">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>Rejected</span>
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge variant="neutral" size="sm" className="gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Pending Review</span>
          </Badge>
        );
    }
  };

  const isEligibleForCancellation =
    isStudentOwner &&
    ["SUBMITTED", "UNDER_REVIEW", "ACTION_REQUIRED", "READY_FOR_REGISTRAR"].includes(
      currentRequest.status
    );

  const clearedCount = currentRequest.tasks.filter((t) => t.status === "CLEARED").length;
  const totalCount = currentRequest.tasks.length || 8;

  // Handle Cancellation
  const handleConfirmCancel = async () => {
    setCancelError(null);
    if (!cancelReason || cancelReason.trim().length < 3) {
      setCancelError("A valid cancellation reason (minimum 3 characters) is required.");
      return;
    }

    setIsCancelling(true);
    try {
      const res = await cancelClearanceRequest(currentRequest.id, cancelReason);
      if (res.success) {
        setShowCancelModal(false);
        setCurrentRequest((prev) => ({
          ...prev,
          status: "CANCELLED",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancelReason.trim(),
        }));
        router.refresh();
      } else {
        setCancelError(res.error || "Failed to cancel request.");
      }
    } catch {
      setCancelError("An unexpected network error occurred while cancelling your request.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Draft Submission directly from detail view
  const handleSubmitDraft = async () => {
    setSubmitError(null);
    setIsSubmittingDraft(true);
    try {
      const res = await submitClearanceRequest(currentRequest.id);
      if (res.success) {
        router.refresh();
      } else {
        setSubmitError(res.error || "Failed to submit request.");
      }
    } catch {
      setSubmitError("An unexpected network error occurred during submission.");
    } finally {
      setIsSubmittingDraft(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <Link
            href="/student/requests"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Clearance Requests</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {currentRequest.clearance_type.name}
            </h2>
            {renderStatusBadge(currentRequest.status)}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            {currentRequest.academic_term.name} • Ref ID: {currentRequest.id}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {currentRequest.status === "DRAFT" && (
            <>
              <Link href={`/student/requests/new?draftId=${currentRequest.id}`}>
                <Button variant="outline-light" size="sm">
                  <FileEdit className="w-3.5 h-3.5 mr-1.5" />
                  <span>Edit Draft</span>
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitDraft}
                disabled={isSubmittingDraft}
                className="bg-blue-600 hover:bg-blue-500 font-semibold"
              >
                {isSubmittingDraft ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    <span>Submit Request</span>
                  </>
                )}
              </Button>
            </>
          )}

          {isEligibleForCancellation && (
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="text-rose-400 border-rose-500/40 hover:bg-rose-950/40 hover:border-rose-500"
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              <span>Cancel Request</span>
            </Button>
          )}
        </div>
      </div>

      {/* Errors */}
      {submitError && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <p>{submitError}</p>
        </div>
      )}

      {/* Status Notice Banner */}
      {currentRequest.status === "SUBMITTED" && (
        <div className="p-4 rounded-xl bg-blue-950/50 border border-blue-500/40 text-blue-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
          <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white block">Parallel Review Initiated</span>
            <p className="text-xs text-blue-200/90 leading-relaxed">
              Your application has been received. All 8 clearance departments conduct their reviews concurrently in parallel. Once all 8 departments mark your record as cleared, the request automatically advances to the Registrar for final sign-off.
            </p>
          </div>
        </div>
      )}

      {currentRequest.status === "CANCELLED" && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs sm:text-sm space-y-1 shadow-lg">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <XCircle className="w-4 h-4" />
            <span>Request Cancelled</span>
          </div>
          <p className="text-xs text-slate-400">
            Cancellation Reason: &quot;{currentRequest.cancellation_reason}&quot;
          </p>
          <p className="text-[11px] text-teal-400 pt-1">
            The active request slot for {currentRequest.academic_term.code} has been freed.
          </p>
        </div>
      )}

      {/* Student & Request Summary Card */}
      <div className="bg-[#0b1a2e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
          Applicant & Clearance Record
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Student Name:</span>
            <span className="text-white font-bold">{currentRequest.student_name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Student ID:</span>
            <span className="text-white font-mono">{currentRequest.student_number}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Academic Term:</span>
            <span className="text-slate-300">{currentRequest.academic_term.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Submission Date:</span>
            <span className="text-slate-300 font-mono">
              {currentRequest.submitted_at
                ? new Date(currentRequest.submitted_at).toLocaleString()
                : "Not yet submitted"}
            </span>
          </div>
          {currentRequest.phone_number && (
            <div>
              <span className="text-slate-500 block">Phone:</span>
              <span className="text-slate-300 font-mono">{currentRequest.phone_number}</span>
            </div>
          )}
          {currentRequest.student_notes && (
            <div className="sm:col-span-3">
              <span className="text-slate-500 block">Student Notes / Remarks:</span>
              <span className="text-slate-300">{currentRequest.student_notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: PARALLEL 8-DEPARTMENT REVIEW TASKS */}
      <div className="bg-[#0b1a2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Departmental Clearance Tasks
              </h3>
              <Badge variant="cleared" size="sm" className="font-mono text-xs">
                {clearedCount} / {totalCount} Cleared
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              All 8 university departments review your account concurrently in parallel. Every unit is mandatory.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">Parallel Review Mode</span>
          </div>
        </div>

        {currentRequest.tasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <Clock className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Tasks Pending Submission</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Departmental clearance tasks are not created for drafts. Once you officially submit the request, all 8 tasks are spawned simultaneously.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {currentRequest.tasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0">
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {task.department_name}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Code: {task.department_code}
                      </span>
                    </div>
                  </div>
                  {renderTaskStatusBadge(task.status)}
                </div>

                {task.decision_notes && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                    <span className="text-slate-500 block uppercase font-mono text-[9px]">
                      Liaison Remarks:
                    </span>
                    <p className="mt-0.5">{task.decision_notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-2 font-mono">
                  <span>Review Mode: Parallel</span>
                  <span>
                    {task.decided_at
                      ? `Decided: ${new Date(task.decided_at).toLocaleDateString()}`
                      : "Awaiting Staff Review"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: AUDIT TRAIL & HISTORY */}
      <div className="bg-[#0b1a2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <History className="w-4 h-4 text-teal-400" />
          <h3 className="text-base font-bold text-white">Official Request Audit Trail</h3>
        </div>

        {currentRequest.audit_logs.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No audit events recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {currentRequest.audit_logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 text-xs border-l-2 border-slate-700 pl-3.5 py-1"
              >
                <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 -ml-[19px] ring-4 ring-[#0b1a2e]" />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-white font-semibold">{log.action.replace(/_/g, " ")}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Actor: <span className="text-slate-300">{log.actor_name}</span>
                    {log.from_status && log.to_status && (
                      <span className="ml-2 font-mono text-[10px] text-blue-300">
                        ({log.from_status} → {log.to_status})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CANCELLATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0b1a2e] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-white">Cancel Clearance Request</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Cancelling this request will stop all 8 departmental reviews and release your active clearance slot for academic term <strong>{currentRequest.academic_term.code}</strong>.
            </p>

            {cancelError && (
              <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p>{cancelError}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="cancelReasonInput" className="text-xs font-semibold uppercase text-slate-300 block">
                Mandatory Cancellation Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="cancelReasonInput"
                rows={3}
                required
                placeholder="State why you are cancelling this clearance request (e.g., Postponing graduation, re-enrolling for next semester)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline-light"
                size="md"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Keep Request Active
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="bg-rose-600 hover:bg-rose-500 font-bold text-white"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Confirm Cancellation</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
