export class InvalidConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidConfigError'
  }
}

export class InvalidParameterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidParameterError'
  }
}