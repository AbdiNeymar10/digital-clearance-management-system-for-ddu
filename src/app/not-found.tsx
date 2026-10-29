import * as React from "react";
import Link from "next/link";
import { UniversityCrest } from "@/components/ui/university-crest";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-[#0b1a2e] text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        <div className="flex justify-center">
          <UniversityCrest size={64} />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-extrabold font-mono text-blue-400 block">
            404
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Clearance Page Not Found
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The requested university portal URL does not exist or may have been relocated within the Dire Dawa University DCMS directory.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 font-semibold"
            >
              <Home className="w-4 h-4 mr-1.5" />
              <span>Return to Public Home</span>
            </Button>
          </Link>

          <Link href="/login" className="w-full sm:w-auto">
            <Button
              variant="outline-light"
              size="md"
              className="w-full sm:w-auto border-slate-700"
            >
              <span>Access Login</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
