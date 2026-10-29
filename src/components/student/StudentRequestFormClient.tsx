"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  saveClearanceDraft,
  submitClearanceRequest,
  type ClearanceTypeItem,
  type AcademicTermItem,
  type ClearanceRequestDetail,
} from "@/lib/actions/clearance-actions";
import {
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Send,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface StudentRequestFormClientProps {
  types: ClearanceTypeItem[];
  terms: AcademicTermItem[];
  studentName: string;
  studentId: string;
  studentEmail: string;
  studentCollege?: string | null;
  studentDepartment?: string | null;
  initialDraft?: ClearanceRequestDetail | null;
}

export function StudentRequestFormClient({
  types,
  terms,
  studentName,
  studentId,
  studentEmail,
  studentCollege,
  studentDepartment,
  initialDraft,
}: StudentRequestFormClientProps) {
  const router = useRouter();

  // Active terms available for new requests
  const availableTerms = terms.filter((t) => t.is_available_for_new_requests);

  // Form states
  const [selectedTypeId, setSelectedTypeId] = React.useState<string>(
    initialDraft?.clearance_type.id || (types.length > 0 ? types[0].id : "")
  );
  const [selectedTermId, setSelectedTermId] = React.useState<string>(
    initialDraft?.academic_term.id || (availableTerms.length > 0 ? availableTerms[0].id : "")
  );
  const [studentNotes, setStudentNotes] = React.useState<string>(
    initialDraft?.student_notes || ""
  );
  const [phoneNumber, setPhoneNumber] = React.useState<string>(
    initialDraft?.phone_number || "+251 "
  );

  // Stepper / Wizard state: 1: Details, 2: Review & Confirm
  const [step, setStep] = React.useState<"form" | "review">("form");

  // Loading & feedback states
  const [isSavingDraft, setIsSavingDraft] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formSuccess, setFormSuccess] = React.useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [activeRequestConflictId, setActiveRequestConflictId] = React.useState<string | null>(null);

  const currentType = types.find((t) => t.id === selectedTypeId) || types[0];
  const currentTerm = terms.find((t) => t.id === selectedTermId) || terms[0];

  // Save draft
  const handleSaveDraft = async () => {
    setFormError(null);
    setFormSuccess(null);
    setIsSavingDraft(true);

    try {
      const res = await saveClearanceDraft({
        requestId: initialDraft?.id,
        clearanceTypeId: selectedTypeId,
        academicTermId: selectedTermId,
        studentNotes,
        phoneNumber,
      });

      if (res.success && res.data) {
        setFormSuccess("Draft saved successfully. Drafts do not occupy your active request slot.");
        router.refresh();
      } else {
        setFormError(res.error || "Failed to save draft.");
      }
    } catch {
      setFormError("An unexpected error occurred while saving your draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Submit request
  const handleConfirmSubmit = async () => {
    setFormError(null);
    setActiveRequestConflictId(null);
    setIsSubmitting(true);

    try {
      // 1. Ensure draft is saved first to capture any modified fields
      const draftRes = await saveClearanceDraft({
        requestId: initialDraft?.id,
        clearanceTypeId: selectedTypeId,
        academicTermId: selectedTermId,
        studentNotes,
        phoneNumber,
      });

      if (!draftRes.success || !draftRes.data) {
        setFormError(draftRes.error || "Failed to prepare request for submission.");
        setIsSubmitting(false);
        setShowConfirmModal(false);
        return;
      }

      const targetRequestId = draftRes.data.requestId;

      // 2. Submit atomically (triggers 8-department parallel task creation)
      const submitRes = await submitClearanceRequest(targetRequestId);

      if (submitRes.success && submitRes.data) {
        setShowConfirmModal(false);
        router.push(`/student/requests/${submitRes.data.requestId}?submitted=true`);
      } else {
        const errorMsg = submitRes.error || "Failed to submit request.";
        setFormError(errorMsg);
        setShowConfirmModal(false);

        // Check if error is due to an active request conflict
        if (errorMsg.includes("active clearance request")) {
          setActiveRequestConflictId(targetRequestId);
        }
      }
    } catch {
      setFormError("A network or server error occurred during request submission.");
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <Link
            href="/student/requests"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Requests</span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {initialDraft ? "Edit Clearance Draft" : "New Clearance Application"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Follow the steps below to prepare your clearance request. You may save incomplete drafts at any time.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setStep("form")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              step === "form" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            1. Details & Selection
          </button>
          <button
            type="button"
            onClick={() => setStep("review")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              step === "review" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            2. Review & Submit
          </button>
        </div>
      </div>

      {/* Error & Success Alerts */}
      {formError && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs sm:text-sm space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to Complete Action</p>
              <p className="text-xs text-rose-300 mt-0.5 leading-relaxed">{formError}</p>
            </div>
          </div>

          {activeRequestConflictId && (
            <div className="pt-2 pl-7">
              <Link href="/student/requests">
                <Button variant="outline-light" size="sm" className="text-xs bg-slate-950">
                  <span>View Existing Active Request</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {formSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p>{formSuccess}</p>
        </div>
      )}

      {/* STEP 1: FORM SELECTIONS */}
      {step === "form" && (
        <div className="space-y-6">
          {/* 1. Verified Student Record Card */}
          <div className="bg-[#0b1a2e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Verified Student Identity (Immutable)
              </span>
              <Badge variant="cleared" size="sm">
                Active Student
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Full Name:</span>
                <span className="text-white font-bold">{studentName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Student ID:</span>
                <span className="text-white font-mono">{studentId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">University Email:</span>
                <span className="text-slate-300 font-mono">{studentEmail}</span>
              </div>
              <div>
                <span className="text-slate-500 block">College / Dept:</span>
                <span className="text-slate-300">
                  {studentCollege || "CCI"} • {studentDepartment || "SE"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Clearance Type Selection */}
          <div className="bg-[#0b1a2e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <label className="text-sm font-bold text-white block">
              Step 1: Select Clearance Type <span className="text-rose-400">*</span>
            </label>
            <p className="text-xs text-slate-400">
              Choose the formal reason for your institutional clearance. All clearance types undergo parallel review across all 8 university units.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {types.map((t) => {
                const isSelected = selectedTypeId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTypeId(t.id)}
                    className={`text-left p-4 rounded-xl border transition-all space-y-2 ${
                      isSelected
                        ? "bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{t.name}</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {t.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Academic Term Selection */}
          <div className="bg-[#0b1a2e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <label htmlFor="academicTerm" className="text-sm font-bold text-white block">
              Step 2: Select Academic Term <span className="text-rose-400">*</span>
            </label>
            <p className="text-xs text-slate-400">
              Only terms currently active for clearance submissions can be selected. Each student may have exactly one active clearance request per academic term.
            </p>

            <div className="pt-1">
              <select
                id="academicTerm"
                value={selectedTermId}
                onChange={(e) => setSelectedTermId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              >
                {availableTerms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name} (Code: {term.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Student Contact & Remarks */}
          <div className="bg-[#0b1a2e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="space-y-1">
              <label htmlFor="phoneNumber" className="text-sm font-bold text-white block">
                Step 3: Contact & Remarks (Optional)
              </label>
              <p className="text-xs text-slate-400">
                Provide active telephone contact for departmental clearance liaisons and any explanatory remarks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="phoneNumber" className="text-xs font-semibold uppercase text-slate-400 block">
                  Active Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="text"
                  placeholder="+251 91 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="studentNotes" className="text-xs font-semibold uppercase text-slate-400 block">
                  Student Notes / Transfer Destination
                </label>
                <input
                  id="studentNotes"
                  type="text"
                  placeholder="e.g., Transfer to Addis Ababa University / Completed all credit hours"
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline-light"
              size="md"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Saving Draft...</span>
                </>
              ) : (
                <>
                  <FileEdit className="w-4 h-4 mr-2" />
                  <span>Save Incomplete Draft</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setStep("review")}
              disabled={isSavingDraft || isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 w-full sm:w-auto font-semibold"
            >
              <span>Continue to Review</span>
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: REVIEW & CONFIRMATION */}
      {step === "review" && (
        <div className="space-y-6">
          <div className="bg-[#0b1a2e] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                <span>Review Clearance Application Details</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Please verify all information below before submitting. Upon submission, all 8 clearance units review your request in parallel.
              </p>
            </div>

            {/* Summary Data */}
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Student Name:</span>
                <span className="text-white font-semibold">{studentName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Student ID:</span>
                <span className="text-white font-mono">{studentId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Clearance Type:</span>
                <span className="text-blue-300 font-bold">{currentType?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Academic Term:</span>
                <span className="text-teal-300 font-bold">{currentTerm?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Phone Number:</span>
                <span className="text-slate-200 font-mono">{phoneNumber || "Not provided"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Student Notes:</span>
                <span className="text-slate-200">{studentNotes || "None"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Required Review Units:</span>
                <span className="text-white font-bold">All 8 Departments (Parallel Review)</span>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-blue-500/30 text-xs text-slate-300 space-y-1.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Notice Regarding Institutional Policy:</span>
              </span>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Submitting this request occupies your single active clearance slot for academic term {currentTerm?.code}. You may cancel an active request before final Registrar approval with a stated reason.
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
              <Button
                type="button"
                variant="outline-light"
                size="md"
                onClick={() => setStep("form")}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span>Back to Edit</span>
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline-light"
                  size="md"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSavingDraft ? "Saving..." : "Save Draft"}
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-900/40 w-full sm:w-auto"
                >
                  <Send className="w-4 h-4 mr-2" />
                  <span>Submit Clearance Request</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0b1a2e] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Confirm Official Submission</h4>
                <p className="text-xs text-slate-400">Dire Dawa University DCMS</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Are you sure you want to officially submit this <strong>{currentType?.name}</strong> for <strong>{currentTerm?.name}</strong>?
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="text-teal-400 font-semibold block">• 8 Department tasks created immediately in parallel</span>
              <span className="text-amber-400 font-semibold block">• Occupies your active clearance slot for this term</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline-light"
                size="md"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-500 font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Yes, Submit Request</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
