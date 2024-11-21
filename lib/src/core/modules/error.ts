// Object: Error classes


/**
 * Error class for invalid configuration errors
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidConfigError'
  }
}

/**
 * Error class for invalid parameter errors, 
 * excluding invalid configuration errors
 */
export class ParameterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidParameterError'
  }
}

/**
 * Error class for invalid parameter errors, 
 * excluding invalid configuration errors
 */
// export class ValidationError extends Error {
//   constructor(message: string) {
//     super(message)
//     this.name = 'InvalidParameterError'
//   }
// }


// Object: Error Helpers

export function rethrowError(error: unknown, ErrorType: new (message: string) => Error) {
  let newError: Error
  if (error instanceof Error) {
    newError = new ErrorType(`${ error.name }: ${ error.message }`)
    if (error.stack)
      newError.stack = error.stack
  } else {
    newError = new ErrorType(String(error))
  }
  throw newError
}