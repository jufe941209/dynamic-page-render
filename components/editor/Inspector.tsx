"use client";

import { useState } from "react";
import { PAGE_SETTINGS_SHAPE, templateFor } from "@/lib/cms/blockTemplates";
import { BLOCK_LABELS, isKnownBlockType } from "@/lib/cms/blockTypes";
import { cn } from "@/lib/cn";
import { isCmsBlock, type CmsPage } from "@/lib/cms/types";
import { ObjectFields } from "./fields/FieldEditor";
import { JsonEditor } from "./JsonEditor";

type InspectorTab = "content" | "json";

function Tabs({ tab, onChange, contentLabel }: { tab: InspectorTab; onChange: (t: InspectorTab) => void; contentLabel: string }) {
  return (
    <div role="tablist" aria-label="Inspector mode" className="flex rounded-lg bg-zinc-100 p-1">
      {(
        [
          ["content", contentLabel],
          ["json", "JSON"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={tab === key}
          onClick={() => onChange(key)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
            tab === key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

type BlockInspectorProps = {
  block: unknown;
  index: number;
  revision: number;
  onChange: (value: unknown) => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

/** Edits the selected section: a visual form (Content) or raw JSON. */
export function BlockInspector({ block, index, revision, onChange, onDuplicate, onRemove }: BlockInspectorProps) {
  const valid = isCmsBlock(block);
  const [tab, setTab] = useState<InspectorTab>(valid ? "content" : "json");
  const type = valid ? block.type : undefined;
  const known = type !== undefined && isKnownBlockType(type);
  const meta = known ? BLOCK_LABELS[type] : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold",
            known ? "bg-ink-950 text-brand-400" : "bg-amber-100 text-amber-700",
          )}
        >
          {meta?.icon ?? "⚠"}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold text-zinc-900">{meta?.label ?? type ?? "Malformed block"}</h2>
          <p className="truncate font-mono text-[0.7rem] text-zinc-500">
            #{index} · {valid ? (block.id ?? "no id") : "invalid"}
          </p>
        </div>
        <button type="button" onClick={onDuplicate} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100">
          Duplicate
        </button>
        <button type="button" onClick={onRemove} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
          Delete
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        {valid && <Tabs tab={tab} onChange={setTab} contentLabel="Content" />}

        {valid && !known && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            <strong>No component is registered for &ldquo;{type}&rdquo;.</strong> The site skips it safely
            (that&apos;s the PageBuilder fallback). Change its <code>type</code> in JSON or delete it.
          </p>
        )}
        {!valid && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800">
            <strong>This block is malformed.</strong> It needs a string <code>type</code> and an object{" "}
            <code>props</code>. Fix it below. The rest of the page keeps rendering.
          </p>
        )}

        {valid && tab === "content" ? (
          <ObjectFields
            value={block.props ?? {}}
            shape={type ? templateFor(type) : undefined}
            onChange={(props) => onChange({ ...block, props })}
          />
        ) : (
          <JsonEditor
            key={`block-json-${index}-${revision}`}
            id="block-json"
            label={`Section #${index} JSON`}
            initialValue={block}
            onValidChange={onChange}
            className="min-h-[420px] flex-1"
          />
        )}
      </div>
    </div>
  );
}

function validateDocumentShape(value: unknown): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "The root must be an object.";
  if (!Array.isArray((value as { blocks?: unknown }).blocks)) return "The root object needs a `blocks` array.";
  return null;
}

type PageInspectorProps = {
  page: CmsPage;
  revision: number;
  onChange: (page: CmsPage) => void;
};

/** Page-level settings (title, SEO, navigation…) and the full document JSON. */
export function PageInspector({ page, revision, onChange }: PageInspectorProps) {
  const [tab, setTab] = useState<InspectorTab>("content");
  const { blocks, ...settings } = page;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4">
        <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-base">
          ⚙
        </span>
        <div>
          <h2 className="text-sm font-bold text-zinc-900">Page settings</h2>
          <p className="text-[0.7rem] text-zinc-500">SEO, branding and navigation</p>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        <Tabs tab={tab} onChange={setTab} contentLabel="Settings" />
        {tab === "content" ? (
          <ObjectFields
            value={settings}
            shape={PAGE_SETTINGS_SHAPE}
            onChange={(next) => onChange({ ...(next as Omit<CmsPage, "blocks">), blocks })}
          />
        ) : (
          <JsonEditor
            key={`document-json-${revision}`}
            id="document-json"
            label="Full page JSON (data.json)"
            initialValue={page}
            validate={validateDocumentShape}
            onValidChange={(value) => onChange(value as CmsPage)}
            className="min-h-[480px] flex-1"
          />
        )}
      </div>
    </div>
  );
}
