import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { DepartmentGrid } from "@/components/landing/DepartmentGrid";
import { Features } from "@/components/landing/Features";
import { TrustSecurity } from "@/components/landing/TrustSecurity";
import { FaqSection } from "@/components/landing/FaqSection";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#07111e] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Institutional Top Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* Hero Section with Illustrative Clearance Dashboard Preview */}
        <Hero />

        {/* Four-Stage Clearance Lifecycle Workflow */}
        <HowItWorks />

        {/* Eight Integrated Clearance Directorates & Offices */}
        <DepartmentGrid />

        {/* Comprehensive System Features & Digital Tools */}
        <Features />

        {/* Trust, Role-Based Access, & Institutional Governance */}
        <TrustSecurity />

        {/* Student & Faculty Frequently Asked Questions */}
        <FaqSection />
      </main>

      {/* Institutional Footer & Support Information */}
      <Footer />
    </div>
  );
}
