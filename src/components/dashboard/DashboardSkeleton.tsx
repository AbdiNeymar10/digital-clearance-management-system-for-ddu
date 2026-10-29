import * as React from "react";
import { cn } from "@/lib/utils";

export function SkeletonItem({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-slate-200/80 dark:bg-slate-800/60 animate-shimmer",
        className
      )}
      aria-hidden="true"
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#0b1a2e] border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <SkeletonItem className="h-3 w-24" />
          <SkeletonItem className="h-7 w-16" />
        </div>
        <SkeletonItem className="w-11 h-11 rounded-xl" />
      </div>
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between">
        <SkeletonItem className="h-3 w-28" />
        <SkeletonItem className="h-3 w-12" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#0b1a2e] border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonItem className="h-5 w-40" />
        <SkeletonItem className="h-8 w-28 rounded-lg" />
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-shimmer" />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" aria-label="Loading page content">
      <div className="space-y-2">
        <SkeletonItem className="h-8 w-64" />
        <SkeletonItem className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <TableSkeleton rows={5} />
    </div>
  );
}
