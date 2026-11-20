import { writeFile } from "node:fs/promises";
import path from "node:path";
import { KNOWN_BLOCK_TYPES } from "@/lib/cms/blockTypes";
import { getPage } from "@/lib/cms/getPage";
import { validatePage } from "@/lib/cms/validate";

const DATA_FILE = path.join(process.cwd(), "data", "data.json");
const MAX_BODY_BYTES = 256 * 1024;

/** Mock Headless CMS delivery endpoint: GET /api/page */
export async function GET() {
  return Response.json(await getPage());
}

/**
 * Publish endpoint used by the editor: PUT /api/page
 *
 * Writes `data/data.json`, the hardcoded CMS source required by the brief.
 * Enabled only in development: a production container is immutable, and
 * content there would come from a real CMS.
 */
export async function PUT(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Publishing is disabled in production. Use “Download JSON” instead." },
      { status: 403 },
    );
  }

  // Same-origin check: refuse writes triggered from other sites.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "Payload too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Body must be valid JSON." }, { status: 400 });
  }

  const result = validatePage(body, KNOWN_BLOCK_TYPES);
  if (!result.valid) {
    return Response.json({ error: "Validation failed.", issues: result.issues }, { status: 422 });
  }

  await writeFile(DATA_FILE, `${JSON.stringify(body, null, 2)}\n`, "utf8");
  return Response.json({ ok: true, issues: result.issues });
}
