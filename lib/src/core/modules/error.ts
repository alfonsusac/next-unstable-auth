// Object: Error classes


/**
 * Error class for invalid configuration errors
 */
export class InvalidConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidConfigError'
  }
}

/**
 * Error class for invalid parameter errors, 
 * excluding invalid configuration errors
 */
export class InvalidParameterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidParameterError'
  }
}

/**
 * Error class for validation errors,
 * extending invalid parameter errors
 */
export class ValidationError extends InvalidParameterError {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}