import { auth, getSession, signIn } from "@/lib/auth";
import { PlusSymbol } from "@/ui/plusgrid";
import { headers } from "next/headers";
import { Suspense } from "react";

export default function DemoPage() {
  const rng = Math.random();
  return (
    <div className="w-full px-4 flex flex-col items-center">
      <Suspense fallback="Loading...">
        <DemoContent />
      </Suspense>
      {rng}
    </div>
  );
}

async function DemoContent() {
  const session = await getSession();

  return (
    <form className="relative border-zinc-500/20 border-t-transparent border w-full max-w-2xl">
      <div className="sticky h-0 bg-zinc-500/20 z-50 self-stretch">
        <div className="left-0 right-0 absolute h-px bg-zinc-500/20" />
        <PlusSymbol className="left-0" />
      </div>

      <div className="flex flex-col items-center gap-4 my-8 px-2">
        <div className="text-center">
          Sign In to see data returned by the provider
        </div>
        <button
          formAction={async () => {
            "use server";
            await signIn("google");
          }}
        >
          Sign In via Google
        </button>

        <button
          formAction={async () => {
            "use server"
            const header = await headers()
            console.log(Object.fromEntries(header.entries()));
          }}
        >
          Get Header Test
        </button>

        <div className="relative w-full max-w-xl p-2 px-4 border border-zinc-500/10">
          <PlusSymbol className="left-0 top-0 absolute" />
          <div className="w-full overflow-auto relative">
            <pre>{JSON.stringify(session, null, 2)}</pre>
          </div>
          <PlusSymbol className="right-0 bottom-0 absolute" />
        </div>

        {session ? (
          <button
            formAction={async () => {
              "use server";
              await auth.signOut();
            }}
          >
            Sign Out
          </button>
        ) : null}

        <PlusSymbol className="right-0 bottom-0 absolute" />
      </div>
    </form>
  );
}
