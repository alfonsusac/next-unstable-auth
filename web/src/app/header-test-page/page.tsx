import { headers } from "next/headers";

export default async function TestPage() {
  const header = await headers();
  console.log(Object.fromEntries(header.entries()));
  console.log({
    nextprivateorigin: process.env["__NEXT_PRIVATE_ORIGIN"],
    xforwardedhost: header.get("x-forwarded-host"),
    xforwardedproto: header.get("x-forwarded-proto"),
    xforwardedfor: header.get("x-forwarded-for"),
    host: header.get("host"),
  });

  return (
    <div>
      Hello World
      <form
        action={async () => {
          "use server"
          const header = await headers();
          console.log(Object.fromEntries(header.entries()));
          console.log({
            nextprivateorigin: process.env["__NEXT_PRIVATE_ORIGIN"],
            xforwardedhost: header.get("x-forwarded-host"),
            xforwardedproto: header.get("x-forwarded-proto"),
            xforwardedfor: header.get("x-forwarded-for"),
            host: header.get("host"),
          });
        }}
      >
        <button>GETHEADER</button>
      </form>
    </div>
  );
}
