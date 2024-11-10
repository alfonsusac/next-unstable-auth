const MockLib = (e: number) => {
  return {
    add: (a: number, b: number) => a + b + e,
    subtract: (a: number, b: number) => a - b + e,
  }
}


export const { add, subtract } = MockLib(10)