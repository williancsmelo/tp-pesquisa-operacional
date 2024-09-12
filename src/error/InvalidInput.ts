export class InvalidInput extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidInput'
  }
}
