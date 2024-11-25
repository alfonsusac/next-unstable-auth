export function isFunction(o: {}): o is Function {
  return typeof o === 'function'
}

export function isObject(o: {}): o is object {
  if (o === null) return false
  return typeof o === 'object'
}

export function isString(o: unknown): o is string {
  return typeof o === 'string'
}

export function isNumber(o: unknown): o is number {
  return typeof o === 'number' && !isNaN(o)
}

export function isNull(o: unknown): o is null {
  return o === null
}

export function isInstanceOf<T>(o: unknown, c: new () => T): o is T {
  return o instanceof c
}

export function isBoolean(o: any): o is boolean {
  return typeof o === 'boolean'
}

export function isDefined(o: unknown): o is {} {
  return o !== undefined
}


// type TypeOfValues
//   = "undefined"
//   | "object"
//   | "boolean"
//   | "number"
//   | "bigint"
//   | "string"
//   | "symbol"
//   | "function"
//   | "null"
//   | "array"
//   ;

// type TypeFromString<T extends TypeOfValues>
//   = T extends "undefined" ? undefined
//   : T extends "object" ? object
//   : T extends "boolean" ? boolean
//   : T extends "number" ? number
//   : T extends "bigint" ? bigint
//   : T extends "string" ? string
//   : T extends "symbol" ? symbol
//   : T extends "function" ? (...params: any) => any
//   : T extends "null" ? null
//   : T extends "array" ? any[]
//   : never

// // untested
// export function hasPropertyWithType<
//   O extends unknown,
//   P extends string,
//   T extends TypeOfValues
// >(
//   obj: O,
//   property: P,
//   type: T
// ): obj is O & {
//   [key in P]: TypeFromString<T>
// } {
//   if (obj === null || typeof obj !== "object")
//     return false
//   if (property in obj) {
//     if (type === "array" && Array.isArray((obj as any)[property]))
//       return true
//     if (type === "null" && (obj as any)[property] === null)
//       return true
//     if (typeof (obj as any)[property] === type)
//       return true
//   }
//   return false
// }

