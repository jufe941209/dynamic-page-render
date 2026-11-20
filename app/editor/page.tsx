import type { Metadata } from "next";
import { PageEditor } from "@/components/editor";
import { getPage } from "@/lib/cms/getPage";

export const metadata: Metadata = {
  title: "Editor · Page CMS",
  robots: { index: false, follow: false },
};

export default async function EditorPage() {
  const page = await getPage();
  return <PageEditor initialPage={page} canPublish={process.env.NODE_ENV === "development"} />;
}
