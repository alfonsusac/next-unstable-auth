import { headers } from "next/headers"

export default async function TestPage() {
  
  const header = await headers()
  console.log(Object.fromEntries(header.entries()))
  
  return (
    <div> Hello World </div>
  )
}
