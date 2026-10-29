"use client";

import * as React from "react";
import {
  provisionStudentAccount,
  reissueClaimLink,
  type ProvisionStudentInput,
} from "@/lib/actions/student-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Users,
  Search,
  RefreshCw,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Eye,
  X,
  Filter,
  GraduationCap,
  Building,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export interface StudentAccountItem {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  college: string | null;
  department: string | null;
  is_claimed: boolean;
  claimed_at: string | null;
  claim_status: "CLAIMED" | "CLAIM_PENDING" | "UNCLAIMED" | "DELIVERY_FAILED";
  last_issued_at?: string;
  expires_at?: string;
}

interface StudentManagementClientProps {
  initialStudents: StudentAccountItem[];
  userRole: "ADMINISTRATOR" | "REGISTRAR";
  userEmail: string;
}

export function StudentManagementClient({
  initialStudents,
  userRole,
}: StudentManagementClientProps) {
  const [students, setStudents] = React.useState<StudentAccountItem[]>(initialStudents);
  const [activeTab, setActiveTab] = React.useState<"directory" | "provision">("directory");

  // Filtering & search states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Provisioning form states
  const [formInput, setFormInput] = React.useState<ProvisionStudentInput>({
    studentId: "",
    fullName: "",
    email: "",
    college: "College of Computing and Informatics",
    department: "Software Engineering",
  });
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [provisionSuccessMsg, setProvisionSuccessMsg] = React.useState<string | null>(null);
  const [provisionErrorMsg, setProvisionErrorMsg] = React.useState<string | null>(null);

  // Reissuing link modal states
  const [selectedStudentForReissue, setSelectedStudentForReissue] = React.useState<StudentAccountItem | null>(null);
  const [isReissuing, setIsReissuing] = React.useState(false);
  const [reissueFeedback, setReissueFeedback] = React.useState<{ success: boolean; message: string } | null>(null);

  // Student detail modal state
  const [detailStudent, setDetailStudent] = React.useState<StudentAccountItem | null>(null);

  // Filtered students list
  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || s.claim_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  // Handle open review-and-confirm modal
  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionErrorMsg(null);
    setProvisionSuccessMsg(null);

    // Basic client validation
    if (!formInput.studentId.trim() || !formInput.fullName.trim() || !formInput.email.trim()) {
      setProvisionErrorMsg("Please provide Student ID, Full Name, and University Email.");
      return;
    }

    setShowConfirmModal(true);
  };

  // Execute provision upon confirmation
  const handleConfirmProvision = async () => {
    setIsSubmitting(true);
    setProvisionErrorMsg(null);

    try {
      const result = await provisionStudentAccount(formInput);

      if (result.success && result.data) {
        setProvisionSuccessMsg(
          `Student account ${result.data.studentId} provisioned successfully! A secure 72-hour activation link has been generated and dispatched.`
        );
        setShowConfirmModal(false);

        // Add newly provisioned student to directory state
        const newStudent: StudentAccountItem = {
          id: `new_${Date.now()}`,
          student_id: formInput.studentId.trim().toUpperCase(),
          full_name: formInput.fullName.trim(),
          email: formInput.email.trim().toLowerCase(),
          college: formInput.college || null,
          department: formInput.department || null,
          is_claimed: false,
          claimed_at: null,
          claim_status: "CLAIM_PENDING",
          last_issued_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 72 * 3600000).toISOString(),
        };

        setStudents((prev) => [newStudent, ...prev]);

        // Reset form
        setFormInput({
          studentId: "",
          fullName: "",
          email: "",
          college: "College of Computing and Informatics",
          department: "Software Engineering",
        });

        // Switch to directory after short delay
        setTimeout(() => {
          setActiveTab("directory");
        }, 1200);
      } else {
        setProvisionErrorMsg(result.error || "Failed to provision student account.");
        setShowConfirmModal(false);
      }
    } catch (err) {
      console.error("Provisioning error:", err);
      setProvisionErrorMsg("A network error occurred. Please try again.");
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reissuing claim link
  const handleConfirmReissue = async () => {
    if (!selectedStudentForReissue) return;

    setIsReissuing(true);
    setReissueFeedback(null);

    try {
      const result = await reissueClaimLink(selectedStudentForReissue.id);

      if (result.success) {
        setReissueFeedback({
          success: true,
          message: `Fresh 72-hour activation link generated and dispatched to ${selectedStudentForReissue.email}. Previous links have been revoked.`,
        });

        // Update student in state
        setStudents((prev) =>
          prev.map((s) =>
            s.id === selectedStudentForReissue.id
              ? {
                  ...s,
                  claim_status: "CLAIM_PENDING",
                  last_issued_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + 72 * 3600000).toISOString(),
                }
              : s
          )
        );
      } else {
        setReissueFeedback({
          success: false,
          message: result.error || "Failed to reissue claim link.",
        });
      }
    } catch {
      setReissueFeedback({
        success: false,
        message: "An unexpected error occurred while reissuing the activation link.",
      });
    } finally {
      setIsReissuing(false);
    }
  };

  // Status badge helper
  const renderStatusBadge = (status: StudentAccountItem["claim_status"]) => {
    switch (status) {
      case "CLAIMED":
        return (
          <Badge variant="cleared" size="sm">
            Claimed & Active
          </Badge>
        );
      case "CLAIM_PENDING":
        return (
          <Badge variant="in_review" size="sm">
            Link Pending (72h)
          </Badge>
        );
      case "DELIVERY_FAILED":
        return (
          <Badge variant="action_required" size="sm">
            Delivery Failed
          </Badge>
        );
      case "UNCLAIMED":
      default:
        return (
          <Badge variant="neutral" size="sm">
            Unclaimed
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Student Account Governance
            </h2>
            <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
              <ShieldCheck className="w-3 h-3 text-teal-400 inline mr-1" />
              {userRole}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Secure student provisioning, 72-hour claim token issuance, and account activation oversight.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "directory"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student Directory ({students.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("provision")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "provision"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Provision New Student</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Student Directory & Search */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0b1a2e] p-4 rounded-xl border border-slate-800">
            <div className="sm:col-span-2 relative">
              <input
                type="text"
                placeholder="Search by Student ID, Full Name, or Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Account States</option>
                <option value="CLAIMED">Claimed & Active</option>
                <option value="CLAIM_PENDING">Claim Link Pending</option>
                <option value="UNCLAIMED">Unclaimed</option>
                <option value="DELIVERY_FAILED">Delivery Failed</option>
              </select>
            </div>
          </div>

          {/* Student Table */}
          <div className="rounded-xl border border-slate-800 bg-[#0b1a2e] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Full Legal Name</th>
                    <th className="px-4 py-3">University Email</th>
                    <th className="px-4 py-3">College / Dept</th>
                    <th className="px-4 py-3">Claim Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No student records match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-white">
                          {student.student_id}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-100">
                          {student.full_name}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {student.email}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {student.department || student.college || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {renderStatusBadge(student.claim_status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailStudent(student)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                              title="Inspect Student Record"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {!student.is_claimed && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForReissue(student);
                                  setReissueFeedback(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-[11px] font-medium transition-colors flex items-center gap-1"
                                title="Reissue 72h Claim Link"
                              >
                                <Send className="w-3 h-3" />
                                <span>Reissue Link</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Provision New Student Form */}
      {activeTab === "provision" && (
        <div className="max-w-2xl bg-[#0b1a2e] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-400" />
              <span>Provision Single Student Account</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provisioning registers the student identity and issues an official single-use 72-hour account activation link to their email.
            </p>
          </div>

          {provisionSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{provisionSuccessMsg}</p>
            </div>
          )}

          {provisionErrorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{provisionErrorMsg}</p>
            </div>
          )}

          <form onSubmit={handleOpenReview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                  Student ID Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DDU/14829/12"
                  value={formInput.studentId}
                  onChange={(e) => setFormInput({ ...formInput, studentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                  Registered University Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="student.name@student.ddu.edu.et"
                  value={formInput.email}
                  onChange={(e) => setFormInput({ ...formInput, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                placeholder="First Middle Last Name"
                value={formInput.fullName}
                onChange={(e) => setFormInput({ ...formInput, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                  College (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. College of Computing and Informatics"
                  value={formInput.college}
                  onChange={(e) => setFormInput({ ...formInput, college: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                  Academic Department (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineering"
                  value={formInput.department}
                  onChange={(e) => setFormInput({ ...formInput, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Security Guard Notice */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-teal-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Institutional Provisioning Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Role will be assigned as <strong>STUDENT</strong> exclusively by server-side logic. Passwords are never stored in plaintext and must be established directly by the student using the single-use 72-hour cryptographic link.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 font-semibold"
              >
                <span>Review & Confirm Provisioning</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 1: Review and Confirm Step */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0b1a2e] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Confirm Student Provisioning</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Please verify the entered student information before issuing the official account activation credentials:
            </p>

            <div className="p-4 rounded-xl bg-slate-950 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Student ID:</span>
                <span className="text-white font-bold">{formInput.studentId.toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Full Name:</span>
                <span className="text-slate-200">{formInput.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">University Email:</span>
                <span className="text-slate-200">{formInput.email.toLowerCase()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Role Assigned:</span>
                <span className="text-teal-400 font-bold">STUDENT (Immutable)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Link Validity:</span>
                <span className="text-amber-300 font-bold">72 Hours (Single Use)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline-light"
                size="md"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmProvision}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <span>Confirm & Issue Claim Link</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Reissue Claim Link Modal */}
      {selectedStudentForReissue && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0b1a2e] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-teal-400" />
                <span>Reissue Account Claim Link</span>
              </h4>
              <button
                type="button"
                onClick={() => setSelectedStudentForReissue(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                You are about to issue a fresh 72-hour activation link for:
              </p>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
                <div className="text-white font-bold">{selectedStudentForReissue.full_name}</div>
                <div className="text-slate-400">{selectedStudentForReissue.student_id} • {selectedStudentForReissue.email}</div>
              </div>
              <p className="text-amber-300/90 text-[11px] leading-relaxed">
                Notice: Reissuing will immediately invalidate any previous outstanding activation links for this student.
              </p>
            </div>

            {reissueFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
                  reissueFeedback.success
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                    : "bg-rose-950/60 border-rose-500/40 text-rose-200"
                }`}
              >
                {reissueFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <p className="leading-relaxed">{reissueFeedback.message}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline-light"
                size="md"
                onClick={() => setSelectedStudentForReissue(null)}
                disabled={isReissuing}
              >
                {reissueFeedback?.success ? "Close" : "Cancel"}
              </Button>
              {!reissueFeedback?.success && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmReissue}
                  disabled={isReissuing}
                  className="bg-blue-600 hover:bg-blue-500"
                >
                  {isReissuing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Reissuing...</span>
                    </>
                  ) : (
                    <span>Confirm Reissuance</span>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Student Detail Inspection Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0b1a2e] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-400" />
                <span>Student Identity Record</span>
              </h4>
              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Student ID:</span>
                  <span className="text-white font-mono font-bold">{detailStudent.student_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Legal Name:</span>
                  <span className="text-slate-200 font-semibold">{detailStudent.full_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>University Email:</span>
                  </span>
                  <span className="text-slate-200 font-mono">{detailStudent.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>College:</span>
                  </span>
                  <span className="text-slate-300">{detailStudent.college || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>Department:</span>
                  </span>
                  <span className="text-slate-300">{detailStudent.department || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Claim Status:</span>
                  <span>{renderStatusBadge(detailStudent.claim_status)}</span>
                </div>
                {detailStudent.claimed_at && (
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Claimed Date:</span>
                    <span className="text-emerald-400">{new Date(detailStudent.claimed_at).toLocaleDateString()}</span>
                  </div>
                )}
                {detailStudent.expires_at && !detailStudent.is_claimed && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500/80" />
                      <span>Link Expiry:</span>
                    </span>
                    <span className="text-amber-400">{new Date(detailStudent.expires_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-900/60 rounded-lg text-slate-400 text-[11px] leading-relaxed">
                Raw claim tokens and student passwords are cryptographically isolated and never displayed or accessible in administrative interfaces.
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                variant="outline-light"
                size="md"
                onClick={() => setDetailStudent(null)}
              >
                Close Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
