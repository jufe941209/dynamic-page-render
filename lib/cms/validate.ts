import { isCmsBlock } from "./types";

export type IssueLevel = "error" | "warning";

export type ValidationIssue = {
  level: IssueLevel;
  message: string;
  /** Set when the issue belongs to a specific block, so the editor can jump to it. */
  blockIndex?: number;
};

export type ValidationResult = {
  /** `false` when there is at least one error. Warnings never block publishing. */
  valid: boolean;
  issues: ValidationIssue[];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

/**
 * Validates a page document before it is published.
 *
 * - **Errors** mean the document breaks the CMS contract (no slug, blocks not an
 *   array, malformed block) and must not be saved.
 * - **Warnings** mean it is valid but will render with gaps, e.g. a block type
 *   with no component. The PageBuilder tolerates these at runtime.
 */
export function validatePage(value: unknown, knownTypes: readonly string[]): ValidationResult {
  const issues: ValidationIssue[] = [];
  const error = (message: string, blockIndex?: number) =>
    issues.push({ level: "error", message, blockIndex });
  const warning = (message: string, blockIndex?: number) =>
    issues.push({ level: "warning", message, blockIndex });

  if (!isPlainObject(value)) {
    error("The page must be a JSON object.");
    return { valid: false, issues };
  }

  if (!isNonEmptyString(value.slug)) error("`slug` is required and must be a non-empty string.");
  if (!isNonEmptyString(value.title)) error("`title` is required and must be a non-empty string.");

  if (value.site !== undefined && (!isPlainObject(value.site) || !isNonEmptyString(value.site.name))) {
    error("`site.name` is required when `site` is provided.");
  }

  if (!Array.isArray(value.blocks)) {
    error("`blocks` must be an array.");
    return { valid: false, issues };
  }

  const known = new Set(knownTypes);
  const seenIds = new Set<string>();

  value.blocks.forEach((block, index) => {
    if (!isCmsBlock(block)) {
      error(
        `Block #${index} is malformed: it needs a non-empty string \`type\` and, if present, an object \`props\`.`,
        index,
      );
      return;
    }

    if (!known.has(block.type)) {
      warning(`Block #${index} uses unknown type "${block.type}". It will be skipped when rendering.`, index);
    }

    if (block.id !== undefined) {
      if (typeof block.id !== "string") {
        warning(`Block #${index} has a non-string \`id\`.`, index);
      } else if (seenIds.has(block.id)) {
        warning(`Block #${index} reuses id "${block.id}". Ids should be unique.`, index);
      } else {
        seenIds.add(block.id);
      }
    }
  });

  return { valid: !issues.some((issue) => issue.level === "error"), issues };
}
