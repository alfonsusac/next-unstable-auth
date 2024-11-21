function parse(schema: any, input: any) {

}

type Infer<> = {

}

function number(errorMsg: string) {
  return (input: any) => {
    if (typeof input === 'number') return input
    throw new Error(errorMsg ?? "Invalid Number")
  }
}