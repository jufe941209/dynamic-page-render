import type { Metadata } from "next";
import { LivePreview } from "@/components/editor";

export const metadata: Metadata = {
  title: "Live preview",
  robots: { index: false, follow: false },
};

/** Rendered inside the editor's iframe; content arrives via postMessage. */
export default function PreviewPage() {
  return <LivePreview />;
}
