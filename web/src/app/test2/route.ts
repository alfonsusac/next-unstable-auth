import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {

  const header = await headers()
  console.log(Object.fromEntries(header.entries()))

  redirect('/test')
}