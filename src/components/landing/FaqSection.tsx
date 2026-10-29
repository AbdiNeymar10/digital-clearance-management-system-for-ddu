"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

export function FaqSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const faqs = [
    {
      q: "Who is required to complete digital clearance through DCMS?",
      a: "All graduating undergraduate and postgraduate students, students withdrawing temporarily or permanently, and students transferring to another university must complete official clearance via DCMS.",
    },
    {
      q: "Do I still need to visit the 8 offices in person?",
      a: "No physical visits are needed for standard clearance. You only visit a specific office if they place an 'Action Required' hold on your clearance (e.g. to physically return a missing dormitory key, lab tool, or borrowed book).",
    },
    {
      q: "How will I know if a department rejects or delays my clearance?",
      a: "The DCMS dashboard displays clear status badges and official reviewer remarks for each office. You can view the specific reason for any hold immediately upon logging in.",
    },
    {
      q: "How do employers or external universities verify my clearance certificate?",
      a: "Each issued certificate contains a high-resolution cryptographic QR code. Scanning the QR code points to the official DDU verification URL to confirm authenticity and completion dates.",
    },
    {
      q: "What if I have lost a library book or property item?",
      a: "You can consult the Library Desk remarks in the system, pay the assessed replacement fee via University Finance, and upload the bank deposit slip directly through your portal.",
    },
  ];

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white dark:bg-[#07111e] border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="ddu-container">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
            Clearance Guidelines
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1a2e] dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Everything you need to know about navigating the Dire Dawa University Digital Clearance System.
          </p>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl mx-auto space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0b1a2e] overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
