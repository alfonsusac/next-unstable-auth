import { source } from "@/lib/source";
import { PlusSymbol } from "@/ui/plusgrid";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { ReactNode } from "react";

export default function AppDocsLayout(p: { children: ReactNode }) {
  return (
    <div className="px-4">
      <div
        className="
    max-w-7xl min-w-0
    [&_#nd-sidebar]:bg-zinc-950
    [&_#nd-sidebar>div]:border-none
    border border-zinc-500/20
    border-t-0 border-b-0 relative
    w-full

      [&_#nd-tocnav]:top-14
      md:[&_#nd-tocnav]:top-16
      md:[&_*[data-toc]]:top-16
      md:[&_*[data-toc]]:h-[calc(100svh_-_4rem)]


      [&_#nd-sidebar]:top-14
      md:[&_#nd-sidebar]:top-14

      [&_#nd-sidebar]:h-[calc(100svh_-_3.5rem)]
      [&_#nd-subnav]:bg-zinc-950
      [&_#nd-subnav]:right-0
      [&_#nd-subnav]:w-28
      [&_#nd-subnav]:border-none
      [&_#nd-subnav]:ml-auto
      [&_#nd-subnav]:backdrop-blur-none

      -mt-14
      md:mt-0
      "
      >
        <div className="left-0 right-0 sticky top-14 h-0 bg-zinc-500/20 z-50">
          <div className="left-0 right-0 absolute h-px bg-zinc-500/20" />
          <PlusSymbol className="left-0"/>
          <PlusSymbol className="right-0"/>
        </div>
        <DocsLayout
          nav={
            {
              // enabled: false,
            }
          }
          tree={source.pageTree}
          disableThemeSwitch
          sidebar={{ collapsible: false }}
        >
          {p.children}
        </DocsLayout>
      </div>
    </div>
  );
}
