import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {

  const header = await headers();
  console.log(Object.fromEntries(header.entries()));
  console.log({
    nextprivateorigin: process.env["__NEXT_PRIVATE_ORIGIN"],
    xforwardedhost: header.get("x-forwarded-host"),
    xforwardedproto: header.get("x-forwarded-proto"),
    xforwardedfor: header.get("x-forwarded-for"),
    host: header.get("host"),
  });

  redirect('/test')
}