"use client";

import { useState } from "react";

export function ClientTest() {
  const [state, setState] = useState(0);

  // const getState = () => state; // Getter function

  // const f = (getState: () => number) => {
  //   console.log("f(() => state) re-run"); // Log to see if f() is called again
  //   return <div>Current state: {getState()}</div>;
  //   {
  //     /* Only the getter is called */
  //   }
  // };
  // const Comp = useCallback(() => Child({ state }), []);

  // const Comp = useChildUI(state);
  // const Comp = useCallback(() => <ChildUI state={state} />, [state % 4 === 0 ? state : null]);

  return (
    <div>
      <button
        onClick={() => {
          setState(state + 1);
          if (state % 4 === 0) {
            // Comp.updater(state);
          }
        }}
      >
        Increase State
      </button>
      {/* <Comp.ui /> */}
      {/* <Comp /> */}
    </div>
  );
}

// function Child($: { stateGetter: () => number }) {
//   console.log("Child re-run"); // Log to see if Child() is called again
//   return <div> Child: {$.stateGetter()}</div>;
// }

// function Child($: { state: number }) {
//   return {
//     ui: <Child2 state={$.state} />,
//     updater: (newState: number) => newState,
//   };
// }

// function Child($: { state: number }) {
//   return <div>Child: {$.state}</div>;
// }

// function useChildUI(init: number) {
//   const [state, setState] = useState(init);
//   const ui = useCallback(() => <ChildUI state={state} />, []);
//   return {
//     ui,
//     updater: (newState: number) => setState(newState),
//   };
// }

// function ChildUI($: { state: number }) {
//   console.log("Child re-run"); // Log to see if Child() is called again
//   return <div>Child2: {$.state}</div>;
// }
