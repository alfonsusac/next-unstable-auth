import { Suspense } from "react";
import { GetHeaders } from "./dynamic";

export default async function Static() {
  return (
    <div>
      Hello World
      <Suspense fallback={'...'}>
        <GetHeaders />
      </Suspense>
    </div>
  );
}
