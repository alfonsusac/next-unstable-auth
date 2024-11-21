/* eslint-disable @next/next/no-img-element */
import { cookies } from "next/headers";
import { ReactNode, SVGProps } from "react";
import { codeToHtml } from "shiki";

export default async function Home() {
  const cookie = await cookies();
  try {
    cookie.set("ns-auth", "test");
  } catch (error) {
    console.log("------");
    console.log(String(error).includes("Error: Cookies"));
  }

  return (
    <div className="max-w-screen-lg mx-4 border border-t-0 border-zinc-500/20 mb-8">
      <div className="sticky max-w-screen-lg mx-auto left-0 right-0 top-14 h-px bg-zinc-500/20">
        <div className="absolute left-0 bg-zinc-500 w-2 h-px" />
        <div className="absolute left-0 bg-zinc-500 w-px h-2" />
        <div className="absolute right-0 bg-zinc-500 w-2 h-px" />
        <div className="absolute right-0 bg-zinc-500 w-px h-2" />
      </div>
      <div className="text-center pt-24 py-16 flex flex-col gap-1 items-center border-b border-zinc-500/10">
        <img
          alt="Doobie.js"
          src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f510.svg"
          width="48"
          height="48"
          className="pb-4"
        />
        <h1 className="text-5xl font-semibold tracking-tight relative">
          NuAuth
          <div className="absolute right-0 top-0 translate-x-full text-xs bg-blue-500 rounded-full px-1.5 py-0.5">
            WIP
          </div>
        </h1>
        <p className="text-lg opacity-80">
          Simple Auth for your Next.js 15 App
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg flex p-4 justify-center items-center gap-2 font-semibold">
            <SolarCheckCircleBoldDuotone className="text-emerald-500 text-xl" />
            Type-safe
          </div>
          <div className="rounded-lg flex p-4 justify-center items-center gap-2 font-semibold">
            <SolarCheckCircleBoldDuotone className="text-emerald-500 text-xl" />
            Easy
          </div>
          <div className="rounded-lg flex p-4 justify-center items-center gap-2 font-semibold">
            <SolarCheckCircleBoldDuotone className="text-emerald-500 text-xl" />
            Flexible
          </div>
        </div>
        <Shell code={"npx nuauth create"} />
        <small className="text-zinc-500">Package coming soon!</small>
      </div>
      <div className="w-full flex justify-center py-16 border-b border-zinc-500/10">
        <div className="max-w-screen-sm self-center w-full">
          <div className="pb-6">
            <h2 className="text-3xl font-medium tracking-tighter text-center">
              Set Up Auth in Minutes
            </h2>
            <p className="text-center">
              All in one configuration file. No database needed.
            </p>
          </div>

          <div className="">
            <CodeBlock
              code={`export const auth = NextJWTAuth({
  providers: {
    google: Google({
      client_id: process.env.GOOGLE_ID,
      client_secret: process.env.GOOGLE_SECRET,
    })
  },
  apiRoute: '/api/auth',
})`}
              title={`Config`}
              path={`/src/lib/auth.ts`}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        <FeatureGridItem>
          <FeatureGridHeader>Social Logins</FeatureGridHeader>
          <FeatureGridDescription>
            Built-in support for Google, Facebook, and more
          </FeatureGridDescription>
        </FeatureGridItem>
        <FeatureGridItem>
          <FeatureGridHeader>Server Actions</FeatureGridHeader>
          <FeatureGridDescription>
            Directly call methods via server actions. No need to create API
            routes.
          </FeatureGridDescription>
        </FeatureGridItem>
        <FeatureGridItem>
          <FeatureGridHeader>Username & Password</FeatureGridHeader>
          <FeatureGridDescription>
            Create your own custom provider for username and password logins,
            and directly integrate with your database.
          </FeatureGridDescription>
        </FeatureGridItem>
        <FeatureGridItem>
          <FeatureGridHeader>Full type inference</FeatureGridHeader>
          <FeatureGridDescription>
            Type-safe session and config objects, even modified, will infer
            changes accordingly.
          </FeatureGridDescription>
        </FeatureGridItem>
        <FeatureGridItem>
          <FeatureGridHeader>Full Control</FeatureGridHeader>
          <FeatureGridDescription>
            Customize the entire auth flow with ease.
          </FeatureGridDescription>
        </FeatureGridItem>
        <FeatureGridItem>
          <FeatureGridHeader>Secure</FeatureGridHeader>
          <FeatureGridDescription>
            CSRF protection, signed cookies, prefixed keys, and more.
          </FeatureGridDescription>
        </FeatureGridItem>
      </div>
      <footer className="p-12 flex flex-col border-t border-zinc-500/20">
        <div className="text-center opacity-80">
          NuAuth © Alfonsus Ardani {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

function SolarCheckCircleBoldDuotone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10"
        opacity=".5"
      ></path>
      <path
        fill="currentColor"
        d="M16.03 8.97a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47l2.235-2.235L14.97 8.97a.75.75 0 0 1 1.06 0"
      ></path>
    </svg>
  );
}

async function Shell(p: { code: string }) {
  const out = await codeToHtml(p.code, {
    lang: "shell",
    theme: "github-dark",
    colorReplacements: {
      "#24292e": "transparent",
    },
  });

  return (
    <div className="bg-zinc-500/10 rounded-md w-full max-w-sm text-start">
      <div className="p-4 text-sm" dangerouslySetInnerHTML={{ __html: out }} />
    </div>
  );
}

async function CodeBlock(p: { code: string; path: string; title: string }) {
  const out = await codeToHtml(p.code, {
    lang: "ts",
    theme: "github-dark",
    colorReplacements: {
      "#24292e": "transparent",
    },
  });

  return (
    <div className="bg-zinc-500/10 rounded-md">
      <div className="p-4 pt-3 pb-2 font-medium grid grid-cols-3 justify-between text-xs text-zinc-500">
        <p className="">typescript</p>
        <p className="text-center text-body">Config</p>
        <p className="text-end">{p.path}</p>
      </div>
      <div
        className="p-4 pt-0 text-sm"
        dangerouslySetInnerHTML={{ __html: out }}
      />
    </div>
  );
}

function FeatureGridItem(props: { children: ReactNode }) {
  return (
    <div className="flex p-8 relative flex-col outline-[0.1px] outline-dashed outline-zinc-500/20">
      {props.children}
      <div className="absolute right-0 bottom-0 font-thin translate-x-[0.26rem] translate-y-[0.68rem]">
        <div>+</div>
      </div>
    </div>
  );
}

function FeatureGridHeader(props: { children: ReactNode }) {
  return <h3 className="text-lg font-medium">{props.children}</h3>;
}

function FeatureGridDescription(props: { children: ReactNode }) {
  return <p className="opacity-80">{props.children}</p>;
}
