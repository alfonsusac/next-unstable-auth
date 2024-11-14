import { headers } from "next/headers";

export async function GetHeaders() {
  const header = await headers();
  console.log(Object.fromEntries(header.entries()));
  console.log({
    nextprivateorigin: process.env["__NEXT_PRIVATE_ORIGIN"],
    xforwardedhost: header.get("x-forwarded-host"),
    xforwardedproto: header.get("x-forwarded-proto"),
    xforwardedfor: header.get("x-forwarded-for"),
    host: header.get("host"),
  });

  return <div>Hello World</div>;
}
