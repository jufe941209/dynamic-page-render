"use client";

import { cn } from "@/lib/cn";
import type { ValidationIssue } from "@/lib/cms/validate";

type IssuesPanelProps = {
  issues: ValidationIssue[];
  onJumpToBlock: (index: number) => void;
};

export function IssuesPanel({ issues, onJumpToBlock }: IssuesPanelProps) {
  const errors = issues.filter((issue) => issue.level === "error").length;
  const warnings = issues.length - errors;

  return (
    <section aria-label="Validation" className="border-t border-zinc-200 bg-zinc-50/80 px-5 py-4">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Validation
        {errors > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">{errors} error{errors > 1 && "s"}</span>}
        {warnings > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">{warnings} warning{warnings > 1 && "s"}</span>}
      </h2>

      {issues.length === 0 ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
          <span aria-hidden="true">✓</span> Everything looks good. Ready to publish.
        </p>
      ) : (
        <ul className="mt-2 max-h-32 space-y-1 overflow-auto">
          {issues.map((issue, i) => {
            const content = (
              <>
                <span aria-hidden="true">{issue.level === "error" ? "✕" : "⚠"}</span>
                <span>{issue.message}</span>
              </>
            );
            const tone = issue.level === "error" ? "text-red-700" : "text-amber-700";

            return (
              <li key={i}>
                {issue.blockIndex === undefined ? (
                  <p className={cn("flex gap-2 text-sm", tone)}>{content}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => onJumpToBlock(issue.blockIndex!)}
                    className={cn("flex w-full gap-2 rounded-md px-1 text-left text-sm hover:bg-white", tone)}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
