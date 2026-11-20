export type FallbackReason = "unknown" | "invalid" | "error";

type BlockFallbackProps = {
  reason: FallbackReason;
  index: number;
  blockType?: string;
};

const messages: Record<FallbackReason, (type?: string) => string> = {
  unknown: (type) => `Unknown block type "${type}". No component is registered for it.`,
  invalid: () => "Malformed block. Expected an object with a non-empty string `type`.",
  error: (type) => `Block "${type}" threw while rendering. See the console for details.`,
};

/**
 * Rendered in place of a block that cannot be shown.
 *
 * - Development / test: a visible, non-intrusive notice so content editors and
 *   developers immediately see what went wrong and where.
 * - Production: renders nothing. Visitors never see a broken section and the
 *   rest of the page is unaffected.
 */
export function BlockFallback({ reason, index, blockType }: BlockFallbackProps) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div
      role="note"
      data-testid="block-fallback"
      data-reason={reason}
      data-block-type={blockType}
      className="mx-auto my-6 w-full max-w-6xl px-4 sm:px-6 lg:px-8"
    >
      <div className="rounded-2xl border-2 border-dashed border-amber-400/60 bg-amber-400/10 p-4 text-sm text-amber-200">
        <strong className="font-semibold text-amber-300">⚠ PageBuilder · block #{index}</strong>
        <span className="ml-2">{messages[reason](blockType)}</span>
      </div>
    </div>
  );
}
