/**
 * Dire Dawa University (DDU) Digital Clearance Management System (DCMS)
 * Institutional constants and configuration parameters.
 */

export const UNIVERSITY_INFO = {
  name: "Dire Dawa University",
  shortName: "DDU",
  systemName: "Digital Clearance Management System",
  systemAcronym: "DCMS",
  motto: "Pioneering Academic Excellence & Digital Transformation",
  country: "Ethiopia",
  location: "Dire Dawa, Ethiopia",
  pobox: "P.O. Box 1362, Dire Dawa, Ethiopia",
  registrarOffice: "Office of the University Registrar & Directorate for ICT",
  year: "2026",
  academicYear: "2025/2026",
} as const;

/**
 * The 8 standard mandatory clearance departments at Dire Dawa University (Prompt 2 seeded units)
 */
export interface DepartmentConfig {
  id: string;
  name: string;
  shortName: string;
  code: string;
  description: string;
  scope: string;
  iconName: string;
  order: number;
}

export const DEPARTMENTS: DepartmentConfig[] = [
  {
    id: "registrar",
    name: "Office of the University Registrar",
    shortName: "Registrar",
    code: "REGISTRAR",
    description: "Final institutional authorization, academic credential verification, and issuance of the official Digital Clearance Certificate.",
    scope: "Academic records, official transcript release, digital certificate issuance",
    iconName: "Award",
    order: 1,
  },
  {
    id: "finance",
    name: "Cost Sharing & University Finance",
    shortName: "Finance",
    code: "FINANCE",
    description: "Reconciliation of university student accounts, tuition balances, library fine receipts, and fiscal clearance stamps.",
    scope: "Tuition settlements, property reimbursement, fiscal receipts",
    iconName: "Receipt",
    order: 2,
  },
  {
    id: "library",
    name: "University Library System",
    shortName: "Library",
    code: "LIBRARY",
    description: "Verification of zero outstanding borrowed books, journals, research volumes, and digital repository account clearance.",
    scope: "Circulation check, reference book returns, repository accounts",
    iconName: "BookOpen",
    order: 3,
  },
  {
    id: "dormitory",
    name: "Student Housing & Dormitory",
    shortName: "Dormitory",
    code: "DORMITORY",
    description: "Inspection of hostel room condition, surrender of dorm room keys, bedding materials, and furniture accountability.",
    scope: "Room inspection, key surrender, furniture accountability, proctor sign-off",
    iconName: "Building2",
    order: 4,
  },
  {
    id: "cafeteria",
    name: "Student Cafeteria & Food Services",
    shortName: "Cafeteria",
    code: "CAFETERIA",
    description: "Deactivation of student meal privileges, digital meal allowance surrender, and cafeteria asset returns.",
    scope: "Meal voucher deactivation, dining asset accountability",
    iconName: "Utensils",
    order: 5,
  },
  {
    id: "bookstore",
    name: "University Bookstore",
    shortName: "Bookstore",
    code: "BOOKSTORE",
    description: "Verification of university textbook releases, course manual accountability, and instructional materials clearance.",
    scope: "Curriculum textbooks, lab manuals, institutional publications",
    iconName: "BookMarked",
    order: 6,
  },
  {
    id: "student-loan",
    name: "Student Loan & Cost Sharing",
    shortName: "Student Loan",
    code: "STUDENT_LOAN",
    description: "National cost-sharing contract signing, higher education loan beneficiary records, and revenue agency notifications.",
    scope: "Cost-sharing contracts, national loan beneficiary records",
    iconName: "Coins",
    order: 7,
  },
  {
    id: "faculty-offices",
    name: "Faculty & Academic Offices",
    shortName: "Faculty Offices",
    code: "FACULTY_OFFICES",
    description: "Departmental advisor sign-off, thesis/capstone project submissions, lab tool accountability, and Dean's office endorsement.",
    scope: "Thesis repository, lab gear, course completion, dean endorsement",
    iconName: "GraduationCap",
    order: 8,
  },
];

/**
 * Clearance clearance states
 */
export type ClearanceStatus = "approved" | "in_review" | "pending" | "action_required";

export interface DemoClearanceRecord {
  student: {
    fullName: string;
    studentId: string;
    college: string;
    department: string;
    program: string;
    admissionYear: string;
    clearanceType: "Graduation Clearance" | "Withdrawal Clearance" | "Transfer Clearance";
    avatarUrl?: string;
  };
  requestDetails: {
    trackingNumber: string;
    submittedDate: string;
    academicYear: string;
    overallStatus: "in_progress" | "cleared" | "rejected";
    clearedCount: number;
    totalCount: number;
  };
  departments: {
    deptId: string;
    deptName: string;
    status: ClearanceStatus;
    reviewedBy?: string;
    reviewedDate?: string;
    comment: string;
    badgeText: string;
  }[];
}

/**
 * Authentic demonstration preview dataset representing a graduating student
 */
export const DEMO_CLEARANCE_DATA: DemoClearanceRecord = {
  student: {
    fullName: "Kenenisa Tsegaye Bekele",
    studentId: "DDU/14829/12",
    college: "College of Computing and Informatics",
    department: "Software Engineering",
    program: "Regular Undergraduate (B.Sc.)",
    admissionYear: "2019/2020",
    clearanceType: "Graduation Clearance",
  },
  requestDetails: {
    trackingNumber: "DDU-CLR-2026-08429",
    submittedDate: "2026-10-18",
    academicYear: "2025/2026",
    overallStatus: "in_progress",
    clearedCount: 6,
    totalCount: 8,
  },
  departments: [
    {
      deptId: "faculty-offices",
      deptName: "Faculty & Academic Offices",
      status: "approved",
      reviewedBy: "Dr. Almaz Kebede (Advisor)",
      reviewedDate: "2026-10-19",
      comment: "Final capstone project source code & documentation submitted. All lab hardware accounted for.",
      badgeText: "Cleared",
    },
    {
      deptId: "library",
      deptName: "University Library System",
      status: "approved",
      reviewedBy: "Tadesse Hailu (Circulation Head)",
      reviewedDate: "2026-10-19",
      comment: "All borrowed textbooks safely returned to Main Library. Zero overdue fines.",
      badgeText: "Cleared",
    },
    {
      deptId: "dormitory",
      deptName: "Student Housing & Dormitory",
      status: "approved",
      reviewedBy: "Proctor Sisay Wolde",
      reviewedDate: "2026-10-20",
      comment: "Block 14, Room 304 inspected. Room keys and metal locker returned in proper condition.",
      badgeText: "Cleared",
    },
    {
      deptId: "cafeteria",
      deptName: "Student Cafeteria & Food Services",
      status: "approved",
      reviewedBy: "Mulugeta Desta (Service Sup.)",
      reviewedDate: "2026-10-20",
      comment: "Non-cafe stipend verified. Digital meal allowance surrendered. No balance.",
      badgeText: "Cleared",
    },
    {
      deptId: "bookstore",
      deptName: "University Bookstore",
      status: "approved",
      reviewedBy: "Abebech Tola (Inventory Mgr.)",
      reviewedDate: "2026-10-21",
      comment: "All engineering course manuals and loaned textbooks returned in good order.",
      badgeText: "Cleared",
    },
    {
      deptId: "finance",
      deptName: "Cost Sharing & University Finance",
      status: "approved",
      reviewedBy: "Finance Officer Hiwot Tekle",
      reviewedDate: "2026-10-21",
      comment: "Tuition and lab account reconciliation complete. Zero financial liability.",
      badgeText: "Cleared",
    },
    {
      deptId: "student-loan",
      deptName: "Student Loan & Cost Sharing",
      status: "in_review",
      reviewedBy: "Cost Sharing Desk Officer",
      reviewedDate: "2026-10-22",
      comment: "National cost-sharing contract signed. Tax identification verification in progress.",
      badgeText: "In Review",
    },
    {
      deptId: "registrar",
      deptName: "Office of the University Registrar",
      status: "pending",
      reviewedBy: "Registrar Directorate Desk",
      comment: "Scheduled for final graduation clearance seal pending completion of Cost Sharing review.",
      badgeText: "Pending Loan Sign-off",
    },
  ],
};

export const NAVIGATION_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Departments", href: "#departments" },
  { label: "Features", href: "#features" },
  { label: "Security & Trust", href: "#security" },
  { label: "FAQ", href: "#faq" },
];
