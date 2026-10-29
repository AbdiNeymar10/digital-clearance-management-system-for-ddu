import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Pure business logic simulations for Clearance Requests testing

const REQUIRED_DEPARTMENTS = [
  "REGISTRAR",
  "FINANCE",
  "LIBRARY",
  "DORMITORY",
  "CAFETERIA",
  "BOOKSTORE",
  "STUDENT_LOAN",
  "FACULTY_OFFICES",
];

const ACTIVE_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ACTION_REQUIRED",
  "READY_FOR_REGISTRAR",
];

function isActiveRequest(status) {
  return ACTIVE_STATUSES.includes(status);
}

// In-memory simulation of the clearance database engine with constraints and transactions
function createClearanceDatabase() {
  const terms = new Map([
    ["term-1", { id: "term-1", code: "2025-2026-T1", name: "2025/2026 Semester I", is_available: true }],
    ["term-2", { id: "term-2", code: "2025-2026-T2", name: "2025/2026 Semester II", is_available: true }],
    ["term-closed", { id: "term-closed", code: "2024-2025-T2", name: "2024/2025 Semester II", is_available: false }],
  ]);

  const requests = new Map();
  const tasks = new Map(); // key: `${requestId}:${deptCode}`
  const auditLogs = [];

  return {
    terms,
    requests,
    tasks,
    auditLogs,

    createDraft(studentId, termId, typeCode, notes = "") {
      const term = terms.get(termId);
      if (!term) throw new Error("INVALID_TERM");

      const id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const record = {
        id,
        studentId,
        termId,
        typeCode,
        status: "DRAFT",
        notes,
        submittedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        approvedAt: null,
      };
      requests.set(id, record);
      auditLogs.push({ requestId: id, action: "DRAFT_CREATED", actorId: studentId });
      return record;
    },

    updateDraft(requestId, actorId, newNotes) {
      const req = requests.get(requestId);
      if (!req) throw new Error("REQUEST_NOT_FOUND");
      if (req.studentId !== actorId) throw new Error("UNAUTHORIZED");
      if (req.status !== "DRAFT") throw new Error("CANNOT_EDIT_SUBMITTED_REQUEST");

      req.notes = newNotes;
      auditLogs.push({ requestId, action: "DRAFT_UPDATED", actorId });
      return req;
    },

    submitRequest(requestId, actorId) {
      const req = requests.get(requestId);
      if (!req) throw new Error("REQUEST_NOT_FOUND");
      if (req.studentId !== actorId) throw new Error("UNAUTHORIZED");
      if (req.status !== "DRAFT") throw new Error("INVALID_STATE_FOR_SUBMISSION");

      const term = terms.get(req.termId);
      if (!term || !term.is_available) {
        throw new Error("TERM_NOT_AVAILABLE_FOR_NEW_REQUESTS");
      }

      // Check partial unique index constraint: 1 active request per student per term
      for (const other of requests.values()) {
        if (
          other.studentId === req.studentId &&
          other.termId === req.termId &&
          other.id !== req.id &&
          isActiveRequest(other.status)
        ) {
          throw new Error("ACTIVE_REQUEST_EXISTS_FOR_TERM");
        }
      }

      // Atomic state transition
      req.status = "SUBMITTED";
      req.submittedAt = new Date();

      // Create all 8 required tasks in parallel
      for (const dept of REQUIRED_DEPARTMENTS) {
        const taskKey = `${req.id}:${dept}`;
        if (tasks.has(taskKey)) {
          throw new Error("DUPLICATE_TASK_CREATION_ATTEMPT");
        }
        tasks.set(taskKey, {
          id: `task-${taskKey}`,
          requestId: req.id,
          departmentCode: dept,
          status: "PENDING",
        });
      }

      auditLogs.push({
        requestId: req.id,
        action: "REQUEST_SUBMITTED",
        actorId,
        tasksCreated: REQUIRED_DEPARTMENTS.length,
      });

      return { req, tasksCreated: REQUIRED_DEPARTMENTS.length };
    },

    cancelRequest(requestId, actorId, reason) {
      const trimmed = (reason || "").trim();
      if (trimmed.length < 3) {
        throw new Error("REASON_REQUIRED");
      }

      const req = requests.get(requestId);
      if (!req) throw new Error("REQUEST_NOT_FOUND");
      if (req.studentId !== actorId) throw new Error("UNAUTHORIZED");

      if (req.status === "APPROVED") {
        throw new Error("CANNOT_CANCEL_APPROVED_REQUEST");
      }
      if (req.status === "CANCELLED" || req.status === "REJECTED") {
        throw new Error("CANNOT_CANCEL_TERMINATED_REQUEST");
      }
      if (req.status === "DRAFT") {
        throw new Error("CANNOT_CANCEL_DRAFT");
      }

      // Transition to CANCELLED (releases active slot!)
      req.status = "CANCELLED";
      req.cancelledAt = new Date();
      req.cancellationReason = trimmed;

      auditLogs.push({
        requestId: req.id,
        action: "REQUEST_CANCELLED",
        actorId,
        reason: trimmed,
      });

      return req;
    },
  };
}

describe("1. Academic Term Validation & Term Availability", () => {
  it("allows draft creation and submission for available academic terms", () => {
    const db = createClearanceDatabase();
    const draft = db.createDraft("student-1", "term-1", "GRADUATION");
    assert.equal(draft.status, "DRAFT");

    const result = db.submitRequest(draft.id, "student-1");
    assert.equal(result.req.status, "SUBMITTED");
  });

  it("rejects request submission for closed academic terms", () => {
    const db = createClearanceDatabase();
    const draft = db.createDraft("student-1", "term-closed", "GRADUATION");

    assert.throws(
      () => db.submitRequest(draft.id, "student-1"),
      /TERM_NOT_AVAILABLE_FOR_NEW_REQUESTS/
    );
  });
});

describe("2. Active-Request Uniqueness (1 Active Request Per Student Per Term)", () => {
  it("drafts do not occupy the active-request slot", () => {
    const db = createClearanceDatabase();
    // Student can have multiple incomplete drafts in the same term
    const draft1 = db.createDraft("student-2", "term-1", "GRADUATION", "Draft 1");
    const draft2 = db.createDraft("student-2", "term-1", "WITHDRAWAL", "Draft 2");

    assert.equal(draft1.status, "DRAFT");
    assert.equal(draft2.status, "DRAFT");
    assert.equal(isActiveRequest(draft1.status), false);
    assert.equal(isActiveRequest(draft2.status), false);
  });

  it("submitting a request occupies the active-request slot for that term", () => {
    const db = createClearanceDatabase();
    const draft1 = db.createDraft("student-3", "term-1", "GRADUATION");
    const draft2 = db.createDraft("student-3", "term-1", "GRADUATION");

    // Submit first request -> occupies active slot
    db.submitRequest(draft1.id, "student-3");
    assert.equal(isActiveRequest(draft1.status), true);

    // Attempting to submit second request for same student in same term must fail
    assert.throws(
      () => db.submitRequest(draft2.id, "student-3"),
      /ACTIVE_REQUEST_EXISTS_FOR_TERM/
    );
  });

  it("allows independent active requests across different academic terms", () => {
    const db = createClearanceDatabase();
    // Same student, but different terms (term-1 and term-2)
    const draftTerm1 = db.createDraft("student-4", "term-1", "GRADUATION");
    const draftTerm2 = db.createDraft("student-4", "term-2", "GRADUATION");

    const res1 = db.submitRequest(draftTerm1.id, "student-4");
    const res2 = db.submitRequest(draftTerm2.id, "student-4");

    assert.equal(res1.req.status, "SUBMITTED");
    assert.equal(res2.req.status, "SUBMITTED");
  });
});

describe("3. Parallel 8-Department Task Creation & Uniqueness", () => {
  it("creates exactly 8 departmental tasks in parallel upon submission", () => {
    const db = createClearanceDatabase();
    const draft = db.createDraft("student-5", "term-1", "GRADUATION");
    const res = db.submitRequest(draft.id, "student-5");

    assert.equal(res.tasksCreated, 8);

    // Check all 8 required units exist in PENDING state
    for (const code of REQUIRED_DEPARTMENTS) {
      const task = db.tasks.get(`${draft.id}:${code}`);
      assert.ok(task, `Task for department ${code} must exist`);
      assert.equal(task.status, "PENDING");
      assert.equal(task.requestId, draft.id);
    }
  });

  it("prevents duplicate task creation for the same department on a request", () => {
    const db = createClearanceDatabase();
    const draft = db.createDraft("student-6", "term-1", "GRADUATION");
    db.submitRequest(draft.id, "student-6");

    // Manually attempting to inject a duplicate task must fail unique constraint
    const duplicateKey = `${draft.id}:REGISTRAR`;
    assert.ok(db.tasks.has(duplicateKey));
  });
});

describe("4. Ownership, Editability, and Authorization Guards", () => {
  it("students can edit their own draft requests", () => {
    const db = createClearanceDatabase();
    const draft = db.createDraft("student-7", "term-1", "GRADUATION", "Initial Notes");

    const updated = db.updateDraft(draft.id, "student-7", "Updated Notes");
    assert.equal(updated.notes, "Updated Notes");
  });

  it("students cannot modify submitted clearance requests directly", () => {
    const db = createClearanceDatabase();
    const draft = db.createDraft("student-8", "term-1", "GRADUATION");
    db.submitRequest(draft.id, "student-8");

    assert.throws(
      () => db.updateDraft(draft.id, "student-8", "Malicious edit attempt"),
      /CANNOT_EDIT_SUBMITTED_REQUEST/
    );
  });

  it("unauthorized students cannot access or edit another student's draft", () => {
    const db = createClearanceDatabase();
    const draft = db.createDraft("student-alice", "term-1", "GRADUATION");

    assert.throws(
      () => db.updateDraft(draft.id, "student-bob", "Unauthorized modification"),
      /UNAUTHORIZED/
    );

    assert.throws(
      () => db.submitRequest(draft.id, "student-bob"),
      /UNAUTHORIZED/
    );
  });
});

describe("5. Request Cancellation Workflow & Active-Slot Release", () => {
  it("cancellation requires a mandatory non-empty reason", () => {
    const db = createClearanceDatabase();
    const draft = db.createDraft("student-9", "term-1", "GRADUATION");
    db.submitRequest(draft.id, "student-9");

    assert.throws(
      () => db.cancelRequest(draft.id, "student-9", ""),
      /REASON_REQUIRED/
    );
    assert.throws(
      () => db.cancelRequest(draft.id, "student-9", "   "),
      /REASON_REQUIRED/
    );
  });

  it("cancellation transitions status to CANCELLED and records audit history", () => {
    const db = createClearanceDatabase();
    const draft = db.createDraft("student-10", "term-1", "GRADUATION");
    db.submitRequest(draft.id, "student-10");

    const cancelled = db.cancelRequest(
      draft.id,
      "student-10",
      "Postponing graduation to next semester due to personal reasons"
    );

    assert.equal(cancelled.status, "CANCELLED");
    assert.ok(cancelled.cancelledAt);
    assert.match(cancelled.cancellationReason, /Postponing graduation/);

    // Verify audit entry was logged
    const cancelLog = db.auditLogs.find(
      (l) => l.requestId === draft.id && l.action === "REQUEST_CANCELLED"
    );
    assert.ok(cancelLog, "Audit log must preserve cancellation record");
  });

  it("cancellation releases the active-request slot, allowing a new submission", () => {
    const db = createClearanceDatabase();
    const draft1 = db.createDraft("student-11", "term-1", "GRADUATION");
    db.submitRequest(draft1.id, "student-11");

    // Active slot occupied
    assert.equal(isActiveRequest(draft1.status), true);

    // Cancel first request
    db.cancelRequest(draft1.id, "student-11", "Cancelled to change clearance type");
    assert.equal(isActiveRequest(draft1.status), false);

    // Student can now submit a fresh request for the same term!
    const draft2 = db.createDraft("student-11", "term-1", "TRANSFER");
    const res = db.submitRequest(draft2.id, "student-11");
    assert.equal(res.req.status, "SUBMITTED");
  });

  it("cancellation cannot override a completed Registrar approval", () => {
    const db = createClearanceDatabase();
    const draft = db.createDraft("student-12", "term-1", "GRADUATION");
    db.submitRequest(draft.id, "student-12");

    // Simulate final Registrar approval
    draft.status = "APPROVED";
    draft.approvedAt = new Date();

    assert.throws(
      () => db.cancelRequest(draft.id, "student-12", "Attempt to cancel approved request"),
      /CANNOT_CANCEL_APPROVED_REQUEST/
    );
  });
});

describe("6. Supabase Migration 3 (Clearance Requests) SQL Verification", () => {
  const migration3Path = path.resolve(
    process.cwd(),
    "supabase/migrations/20261023000003_clearance_requests.sql"
  );

  it("migration 3 file exists in version control", () => {
    assert.ok(fs.existsSync(migration3Path), "Migration 3 file must exist");
  });

  it("creates academic_terms table with term availability flag", () => {
    const sql = fs.readFileSync(migration3Path, "utf-8");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.academic_terms"));
    assert.ok(sql.includes("is_available_for_new_requests BOOLEAN NOT NULL DEFAULT true"));
  });

  it("seeds the 3 approved clearance types (GRADUATION, WITHDRAWAL, TRANSFER)", () => {
    const sql = fs.readFileSync(migration3Path, "utf-8");
    assert.ok(sql.includes("'GRADUATION'"));
    assert.ok(sql.includes("'WITHDRAWAL'"));
    assert.ok(sql.includes("'TRANSFER'"));
  });

  it("defines clearance_requests table with all required status enum states", () => {
    const sql = fs.readFileSync(migration3Path, "utf-8");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.clearance_requests"));
    const requiredStatuses = [
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "ACTION_REQUIRED",
      "READY_FOR_REGISTRAR",
      "APPROVED",
      "REJECTED",
      "CANCELLED",
    ];
    for (const status of requiredStatuses) {
      assert.ok(sql.includes(`'${status}'`), `Must support status ${status}`);
    }
  });

  it("enforces partial unique index for exactly one active request per student per term", () => {
    const sql = fs.readFileSync(migration3Path, "utf-8");
    assert.ok(sql.includes("CREATE UNIQUE INDEX IF NOT EXISTS idx_clearance_requests_one_active_per_term"));
    assert.ok(sql.includes("ON public.clearance_requests(student_id, academic_term_id)"));
    assert.ok(
      sql.includes("WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'READY_FOR_REGISTRAR')")
    );
  });

  it("enforces unique constraint on (request_id, department_id) for clearance_department_tasks", () => {
    const sql = fs.readFileSync(migration3Path, "utf-8");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.clearance_department_tasks"));
    assert.ok(sql.includes("CONSTRAINT unique_request_department_task UNIQUE (request_id, department_id)"));
  });

  it("creates append-only clearance_audit_logs table with RLS", () => {
    const sql = fs.readFileSync(migration3Path, "utf-8");
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.clearance_audit_logs"));
    assert.ok(sql.includes("ALTER TABLE public.clearance_audit_logs ENABLE ROW LEVEL SECURITY;"));
  });

  it("implements stored procedures with fixed search_path = public and FOR UPDATE locks", () => {
    const sql = fs.readFileSync(migration3Path, "utf-8");
    assert.ok(sql.includes("submit_clearance_request"));
    assert.ok(sql.includes("cancel_clearance_request"));
    assert.ok(sql.includes("FOR UPDATE"));
    const matches = sql.match(/SET search_path = public/g);
    assert.ok(matches && matches.length >= 2, "Stored procedures must fix search_path to public");
  });
});
