import { source } from "@/lib/source";
import { PlusSymbol } from "@/ui/plusgrid";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";

export default async function DocPage(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle className="font-semibold relative">
        {page.data.title}
      </DocsTitle>
      <div className="h-px bg-zinc-500/30 relative">
        <PlusSymbol small className="left-0" />
        <PlusSymbol small className="right-0" />
      </div>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody className="">
        <MDX
          components={{
            ...defaultMdxComponents,
          }}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}
