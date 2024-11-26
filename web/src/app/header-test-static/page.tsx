import Link from "next/link";
import { ClientFetchRoute } from "./client";

export default async function Static() {
  return (
    <div>
      Hello World
      <Link href="/header-test-page" prefetch={false}>
        Go to Header Test Page
      </Link>
      <ClientFetchRoute />
    </div>
  );
}
