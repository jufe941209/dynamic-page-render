import type { Metadata } from "next";
import { PageShell } from "@/components/templates";
import { getPage } from "@/lib/cms/getPage";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage();
  return { title: page.title, description: page.description };
}

export default async function Home() {
  const page = await getPage();
  return <PageShell page={page} />;
}
