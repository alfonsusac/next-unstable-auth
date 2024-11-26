"use client";

export function ClientFetchRoute() {
  return (
    <button
      onClick={async () => {
        await fetch("/header-test-route", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
      }}
    >Fetch header-test-route</button>
  );
}
