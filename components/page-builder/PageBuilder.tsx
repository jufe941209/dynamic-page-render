import type { ReactNode } from "react";
import { isCmsBlock } from "@/lib/cms/types";
import { BlockErrorBoundary } from "./BlockErrorBoundary";
import { BlockFallback } from "./BlockFallback";
import { blockRegistry, resolveBlock, type BlockRegistry } from "./registry";

type PageBuilderProps = {
  /** Raw `blocks` array from the CMS. Typed as `unknown` on purpose: CMS data is untrusted. */
  blocks: unknown;
  /** Injectable for tests or for pages that only allow a subset of blocks. */
  registry?: BlockRegistry;
  /**
   * Editor preview only: wraps each block in `<div data-block-index>` so the
   * editor can highlight and select sections by clicking them.
   */
  instrument?: boolean;
};

function warn(message: string, payload?: unknown) {
  console.warn(`[PageBuilder] ${message}`, ...(payload === undefined ? [] : [payload]));
}

function renderBlock(block: unknown, index: number, registry: BlockRegistry): ReactNode {
  if (!isCmsBlock(block)) {
    warn(`Block #${index} is malformed and was skipped.`, block);
    return <BlockFallback reason="invalid" index={index} />;
  }

  const { type, props = {} } = block;
  const Component = resolveBlock(type, registry);

  if (!Component) {
    warn(`Unknown block type "${type}" at #${index} was skipped.`);
    return <BlockFallback reason="unknown" index={index} blockType={type} />;
  }

  return (
    <BlockErrorBoundary blockType={type} index={index} resetKey={props}>
      <Component {...props} />
    </BlockErrorBoundary>
  );
}

function keyFor(block: unknown, index: number): string {
  // Index suffix keeps keys unique even if the CMS repeats an id.
  const id = isCmsBlock(block) ? (block.id ?? block.type) : "invalid";
  return `${id}-${index}`;
}

/**
 * Turns a CMS `blocks` array into React components, in order.
 *
 * Guarantees: it never throws because of the data it receives. Unknown types,
 * malformed entries and components that crash are each contained to their own
 * slot, and every other block still renders.
 */
export function PageBuilder({ blocks, registry = blockRegistry, instrument = false }: PageBuilderProps) {
  if (!Array.isArray(blocks)) {
    warn("`blocks` is not an array; nothing was rendered.", blocks);
    return null;
  }

  return (
    <>
      {blocks.map((block, index) => {
        const content = renderBlock(block, index, registry);
        return instrument ? (
          <div key={keyFor(block, index)} data-block-index={index}>
            {content}
          </div>
        ) : (
          <BlockSlot key={keyFor(block, index)}>{content}</BlockSlot>
        );
      })}
    </>
  );
}

/** Keyed passthrough so the public page renders no extra wrapper elements. */
function BlockSlot({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
